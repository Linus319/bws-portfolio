const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


const fs = require('fs');
const path = require('path');

dir = '/Users/thomasfagan/Desktop/bws-portfolio-test-library';

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


// async function uploadToBucket() {
//     for (let i = 0; i < files.length; i++) {
//         const { data, error } = await supabase 
//             .storage
//             .from('songs')
//             .upload(files[i], File)
//     }
// } 

async function uploadToBucket() {
    for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        const fileBuffer = fs.readFileSync(filePath);
        const storagePath = filePath.replace(dir + '/', ''); // Remove local dir prefix

        const { data, error } = await supabase
            .storage
            .from('songs')
            .upload(storagePath, fileBuffer, {
                contentType: 'audio/mpeg',
                upsert: false,
            });

        if (error) {
            console.error(`Error uploading ${filePath}:`, error);
        } else {
            console.log(`Uploaded: ${storagePath}`);
        }
    }
}

uploadToBucket();