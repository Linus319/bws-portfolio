const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const fs = require('fs');
const path = require('path');

dir = '/Users/thomasfagan/Desktop/supabase-upload';

function findMp3Files(dir, results = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            findMp3Files(fullPath, results);
        }
        else if (file.name.toLowerCase().endsWith('.mp3')) {
            results.push(fullPath);
        }
    }
    return results;
}

// temp[0]: artist; temp[1]:album, temp[2]:title
let files = findMp3Files(dir, results=[]);
let song_data = [];
for (file of files) {
    const temp = (file.split('/')).slice(-3);
    song_data.push(temp);
}

async function uploadToBucket() {
    for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        const fileBuffer = fs.readFileSync(filePath);
        const storagePath = filePath.replace(dir + '/', ''); // Remove local dir prefix

        // get artist, album, title
        const parts = storagePath.split('/');
        if (parts.length < 3) {
            console.error(`Skipping file with invalid path structure: ${filePath}`);
            continue;
        }
        const [artist, album, titleWithExt] = parts.slice(-3);
        const title = titleWithExt.replace(/\.mp3/i, '');

        // upload to storage
        const { data, error } = await supabase
            .storage
            .from('tracks')
            .upload(storagePath, fileBuffer, {
                contentType: 'audio/mpeg',
                upsert: false,
            });

        if (error) {
            console.error(`Error uploading ${filePath}:`, error);
        } else {
            console.log(`Uploaded: ${storagePath}`);

            // insert into tracks table
            const { error: dbError } = await supabase
                .from('tracks')
                .insert([{ title, artist, album }]);

            if (dbError) {
                console.error(`Error inserting into songs table for ${filePath}:`, dbError);
            } else {
                console.log(`Inserted into songs table: ${title} by ${artist} (${album})`);
            }
        }
    }
}

uploadToBucket();