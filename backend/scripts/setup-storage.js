const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupBuckets() {
    const buckets = [
        { name: 'products', public: true, fileSizeLimit: 5 * 1024 * 1024 },
        { name: 'portraits', public: true, fileSizeLimit: 5 * 1024 * 1024 }
    ];

    for (const bucket of buckets) {
        // Check if already exists
        const { data: existing } = await supabaseAdmin.storage.getBucket(bucket.name);
        if (existing) {
            console.log(`✅ Bucket '${bucket.name}' already exists`);
            continue;
        }

        const { data, error } = await supabaseAdmin.storage.createBucket(bucket.name, {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
        });

        if (error) {
            console.error(`❌ Failed to create bucket '${bucket.name}':`, error.message);
        } else {
            console.log(`✅ Created bucket '${bucket.name}' (public CDN enabled)`);
        }
    }

    console.log('\n🎉 Supabase Storage setup complete!');
    console.log(`Public base URL: ${SUPABASE_URL}/storage/v1/object/public/`);
}

setupBuckets().catch(console.error);
