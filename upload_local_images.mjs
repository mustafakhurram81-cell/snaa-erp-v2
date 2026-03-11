import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseSecretRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseSecretRoleKey || supabaseKey);
const BUCKET_NAME = 'product-images';
const CONCURRENCY = 20; // High concurrency is fine for local-to-Supabase
const PICTURES_DIR = path.resolve(process.cwd(), 'Product Pictures');

async function uploadImageToSupabase(baseSku, localFilePath) {
    try {
        const buffer = fs.readFileSync(localFilePath);
        // We'll standardise the name in Supabase to be the baseSku.jpg
        const fileName = `${baseSku}.jpg`;

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

        if (error) {
            console.error(`[GROUP: ${baseSku}] Failed to upload to Supabase: ${error.message}`);
            return null;
        }

        const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        return publicData.publicUrl;
    } catch (err) {
        console.error(`[GROUP: ${baseSku}] Unexpected error uploading: ${err.message}`);
        return null;
    }
}

async function processBaseSkuGroup(baseSku, variantIds, allLocalFilesMap) {
    // 1. Find a matching local image file for this group.
    let matchingFile = null;

    // First try exact base sku (e.g., 04-500.jpg)
    if (allLocalFilesMap[baseSku]) {
        matchingFile = allLocalFilesMap[baseSku];
    } else {
        // Fallback: look for ANY variant image that starts with the baseSku (e.g., 04-500-14.jpg)
        for (const filename of Object.keys(allLocalFilesMap)) {
            if (filename.startsWith(`${baseSku}-`)) {
                matchingFile = allLocalFilesMap[filename];
                break;
            }
        }
    }

    if (!matchingFile) {
        console.log(`[GROUP: ${baseSku}] No local image found in 'Product Pictures' directory.`);
        return;
    }

    // 2. Upload it
    console.log(`[GROUP: ${baseSku}] Found local image '${matchingFile}', uploading...`);
    const fullPath = path.join(PICTURES_DIR, matchingFile);
    const supabasePublicUrl = await uploadImageToSupabase(baseSku, fullPath);

    if (supabasePublicUrl) {
        // 3. Update DB
        const { error } = await supabase
            .from('products')
            .update({ image_url: supabasePublicUrl })
            .in('id', variantIds);

        if (error) {
            console.error(`[GROUP: ${baseSku}] DB update failed:`, error.message);
        } else {
            console.log(`[GROUP: ${baseSku}] SUCCESSFULLY applied local image to ${variantIds.length} variants!`);
        }
    }
}

async function main() {
    console.log(`Scanning local directory: ${PICTURES_DIR}`);
    if (!fs.existsSync(PICTURES_DIR)) {
        console.error(`Directory not found: ${PICTURES_DIR}`);
        return;
    }

    const files = fs.readdirSync(PICTURES_DIR);
    console.log(`Found ${files.length} files in local directory.`);

    // Create a map of lowercase SKU (without extension) -> actual filename
    // e.g. "04-500" -> "04-500.jpg", "04-500-14" -> "04-500-14.JPG"
    const allLocalFilesMap = {};
    for (const file of files) {
        if (!file.toLowerCase().endsWith('.jpg') && !file.toLowerCase().endsWith('.jpeg') && !file.toLowerCase().endsWith('.png')) {
            continue;
        }
        const skuPart = file.replace(/\.(jpg|jpeg|png)$/i, '').toLowerCase();
        allLocalFilesMap[skuPart] = file;
    }


    console.log("Starting local upload sync for ALL missing images...");
    let totalProcessed = 0;

    while (true) {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, sku')
            .is('image_url', null)
            .limit(2000);

        if (error || !products) {
            console.error("Failed to fetch products.");
            break;
        }

        if (products.length === 0) {
            console.log("No more products missing images! We are done!");
            break;
        }

        console.log(`Fetched a batch of ${products.length} products missing images from DB.`);

        // Group products by their "Base SKU" (e.g., 02-550-14 -> 02-550)
        const groupedProducts = {};
        for (const p of products) {
            const parts = p.sku.split('-');
            let baseSku = p.sku.toLowerCase();
            if (parts.length > 2) {
                parts.pop(); // remove the trailing size/variant code
                baseSku = parts.join('-').toLowerCase();
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
                const promises = batchSkus.map(baseSku =>
                    processBaseSkuGroup(baseSku, groupedProducts[baseSku], allLocalFilesMap)
                        .catch(err => console.log(`[GROUP: ${baseSku}] Caught exception: ${err.message}`))
                );

                await Promise.all(promises);
            }
        } catch (e) {
            console.log("Batch caught exception, continuing to next batch...", e.message);
        }

        totalProcessed += products.length;
        console.log(`\n--- Completed processing chunk. Total DB rows scanned so far: ${totalProcessed} ---\n`);
    }
}

main();
