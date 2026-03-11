import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseSecretRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseSecretRoleKey || supabaseKey);
const BUCKET_NAME = 'product-images';
const CONCURRENCY = 2; // Reduced significantly to prevent Smith Surgical from blocking our IP for rate limiting

async function attemptFetchUrl(searchQuery, filenameToMatch) {
    const searchUrl = `https://smithsurgical.uk/?s=${searchQuery}&post_type=product`;
    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });

    if (!response.ok) return null;
    const text = await response.text();
    if (text.includes('No products were found matching your selection.')) return null;

    let regex = /(https:\/\/smithsurgical\.uk\/[^"'\s]*?[a-zA-Z0-9-]*?600x600\.jpg)/i;
    let match = text.match(regex);
    let returnMatchUrl = null;

    if (match && match[1]) {
        returnMatchUrl = match[1];
    } else {
        // Only one fallback: just grab the first product image found in the result if the SKU name doesn't match perfectly
        let genericFallbackRegex = /(https:\/\/smithsurgical\.uk\/wp-content\/uploads\/[^"'\s]*?[a-zA-Z0-9-]*?300x300\.jpg)/i;
        let genericMatch = text.match(genericFallbackRegex);
        if (genericMatch && genericMatch[1]) {
            returnMatchUrl = genericMatch[1].replace('300x300', '600x600');
        }
    }

    return returnMatchUrl;
}

async function downloadAndUploadImage(baseSku, imageUrl) {
    try {
        const response = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${baseSku}.jpg`; // Save as the parent/base SKU

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

        if (error) return null;

        const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        return publicData.publicUrl;
    } catch (err) {
        return null;
    }
}

async function processBaseSkuGroup(baseSku, variantIds) {
    // 1. We ONLY search Smith Surgical once per GROUP using the base SKU.
    const imageUrl = await attemptFetchUrl(baseSku, baseSku);

    if (!imageUrl) {
        console.log(`[GROUP: ${baseSku}] No image found on target site for parent SKU.`);
        return;
    }

    console.log(`[GROUP: ${baseSku}] Image found, downloading to bucket...`);
    const supabasePublicUrl = await downloadAndUploadImage(baseSku, imageUrl);

    if (supabasePublicUrl) {
        // 2. We update ALL variants that share this base SKU with this single Supabase URL!
        const { error } = await supabase
            .from('products')
            .update({ image_url: supabasePublicUrl })
            .in('id', variantIds); // Bulk update all variants in one call

        if (error) {
            console.error(`[GROUP: ${baseSku}] DB update failed:`, error.message);
        } else {
            console.log(`[GROUP: ${baseSku}] SUCCESSFULLY applied image to ${variantIds.length} variants!`);
        }
    }
}

async function main() {
    console.log("Starting full optimized sync for ALL missing images...");
    let totalProcessed = 0;

    while (true) {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, sku')
            .is('image_url', null)
            .limit(1000);

        if (error || !products) {
            console.error("Failed to fetch products.");
            break;
        }

        if (products.length === 0) {
            console.log("No more products missing images! We are done!");
            break;
        }

        console.log(`Fetched a batch of ${products.length} products missing images.`);

        // Group products by their "Base SKU" (e.g., 02-550-14 -> 02-550)
        const groupedProducts = {};
        for (const p of products) {
            const parts = p.sku.split('-');
            let baseSku = p.sku;
            if (parts.length > 2) {
                parts.pop(); // remove the trailing size/variant code
                baseSku = parts.join('-');
            }

            if (!groupedProducts[baseSku]) {
                groupedProducts[baseSku] = [];
            }
            groupedProducts[baseSku].push(p.id);
        }

        const uniqueBaseSkus = Object.keys(groupedProducts);
        console.log(`Grouped ${products.length} products into ${uniqueBaseSkus.length} unique Base SKUs. Processing chunk...`);

        try {
            for (let i = 0; i < uniqueBaseSkus.length; i += CONCURRENCY) {
                const batchSkus = uniqueBaseSkus.slice(i, i + CONCURRENCY);
                const promises = batchSkus.map(baseSku => processBaseSkuGroup(baseSku, groupedProducts[baseSku]).catch(err => console.log(`[GROUP: ${baseSku}] Caught exception: ${err.message}`)));

                await Promise.all(promises);

                if (i + CONCURRENCY < uniqueBaseSkus.length) {
                    await new Promise(r => setTimeout(r, 2000)); // 2 second pause between pairs
                }
            }
        } catch (e) {
            console.log("Batch caught exception, continuing to next batch...", e.message);
        }

        totalProcessed += products.length;
        console.log(`\n--- Completed processing chunk of 1000. Total processed so far: ${totalProcessed} ---\n`);
    }
}

main();
