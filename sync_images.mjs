import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseSecretRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use the service role key if available for storage creation, else fallback to anon wrapper
const supabase = createClient(supabaseUrl, supabaseSecretRoleKey || supabaseKey);

const BUCKET_NAME = 'product-images';
const CONCURRENCY = 5;

async function fetchImageForSku(sku) {
    try {
        let imageUrl = await attemptFetchUrl(sku, sku);

        // If not found, try with base SKU (remove the trailing -XX)
        // e.g., 02-544-17 -> 02-544
        if (!imageUrl) {
            const parts = sku.split('-');
            if (parts.length > 2) {
                // assume the last part is a size/variant identifier
                parts.pop();
                const baseSku = parts.join('-');
                console.log(`[${sku}] Not found directly. Retrying with base SKU: ${baseSku}...`);
                imageUrl = await attemptFetchUrl(baseSku, baseSku);
            }
        }

        return imageUrl;
    } catch (err) {
        console.warn(`[${sku}] Search fetch error:`, err.message);
        return null;
    }
}

async function attemptFetchUrl(searchQuery, filenameToMatch) {
    const searchUrl = `https://smithsurgical.uk/?s=${searchQuery}&post_type=product`;
    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });

    if (!response.ok) {
        return null;
    }

    const text = await response.text();
    if (text.includes('No products were found matching your selection.')) {
        return null;
    }

    // Look for a 600x600 image (highest res standard thumbnail)
    let regex = /https:\/\/smithsurgical\.uk\/[^"'<]*?([a-zA-Z0-9-]*?600x600\.jpg)/i;
    let match = text.match(regex);
    let returnMatchUrl = null;

    if (match && match[0]) {
        let betterRegex = /(https:\/\/smithsurgical\.uk\/[^"'\s]*?[a-zA-Z0-9-]*?600x600\.jpg)/i;
        let betterMatch = text.match(betterRegex);
        if (betterMatch && betterMatch[1]) returnMatchUrl = betterMatch[1];
    }

    if (!returnMatchUrl) {
        regex = new RegExp(`(https://smithsurgical\\.uk/[^"'\\s<]*?${filenameToMatch}\\.jpg)`, 'i');
        match = text.match(regex);
        if (match && match[1]) returnMatchUrl = match[1];
    }

    if (!returnMatchUrl) {
        regex = new RegExp(`(https://smithsurgical\\.uk/[^"'\\s<]*?${filenameToMatch}[^"'\\s<]*?\\.jpg)`, 'i');
        match = text.match(regex);
        if (match && match[1]) returnMatchUrl = match[1];
    }

    // New fallback: just grab the first product image found in the result if the SKU name doesn't match perfectly
    if (!returnMatchUrl) {
        let genericFallbackRegex = /(https:\/\/smithsurgical\.uk\/wp-content\/uploads\/[^"'\s]*?[a-zA-Z0-9-]*?300x300\.jpg)/i;
        let genericMatch = text.match(genericFallbackRegex);
        if (genericMatch && genericMatch[1]) {
            // we'd rather have 600x600
            returnMatchUrl = genericMatch[1].replace('300x300', '600x600');
        }
    }

    return returnMatchUrl;
}

async function downloadAndUploadImage(sku, imageUrl) {
    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        if (!response.ok) {
            console.warn(`[${sku}] Failed to download image: HTTP ${response.status}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${sku}.jpg`;

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) {
            console.error(`[${sku}] Supabase upload error:`, error.message);
            return null;
        }

        const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        return publicData.publicUrl;

    } catch (err) {
        console.warn(`[${sku}] Upload process error:`, err.message);
        return null;
    }
}

async function processSku(product) {
    const sku = product.sku;

    // Temporary bypass: disable RLS locally in the script just in case we need to update
    // But since we're using anon key, we'll try to update directly if RLS allows.

    const imageUrl = await fetchImageForSku(sku);

    if (!imageUrl) {
        console.log(`[${sku}] No image found on target site.`);
        return;
    }

    console.log(`[${sku}] Image found: ${imageUrl}, downloading to bucket...`);
    const supabasePublicUrl = await downloadAndUploadImage(sku, imageUrl);

    if (supabasePublicUrl) {
        // Update database
        const { error } = await supabase
            .from('products')
            .update({ image_url: supabasePublicUrl })
            .eq('id', product.id);

        if (error) {
            console.error(`[${sku}] DB update failed (RLS?):`, error.message);
        } else {
            console.log(`[${sku}] SUCCESSFULLY updated URL: ${supabasePublicUrl}`);
        }
    }
}

async function main() {
    console.log("Fetching products with no image_url for the full run...");

    // Fetch products
    const { data: products, error } = await supabase
        .from('products')
        .select('id, sku')
        .is('image_url', null);

    if (error) {
        console.error("Failed to fetch products:", error);
        return;
    }

    console.log(`Found ${products.length} products to process in this chunk.`);

    // Process in batches
    for (let i = 0; i < products.length; i += CONCURRENCY) {
        const batch = products.slice(i, i + CONCURRENCY);
        const promises = batch.map(p => processSku(p));
        await Promise.all(promises);

        if (i + CONCURRENCY < products.length) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    console.log("Chunk done!");
}

main();
