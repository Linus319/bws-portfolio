const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'songs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getBucketFiles(path) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path, { recursive: true });  // Ensure recursive is true if you have subfolders

    if (error) throw error;
    return data;
}

async function syncFilesToDatabase() {
  const files = await getBucketFiles('linus-and-friends');  // Update with your folder path

  for (const file of files) {
    const filePath = file.name;

    const { data: publicUrlData, error: publicUrlError } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (publicUrlError) {
      console.error('Error generating public URL:', publicUrlError);
      continue;
    }

    const songUrl = publicUrlData.publicUrl;

    const { data: existing, error: selectError } = await supabase
      .from('songs')
      .select('id')
      .eq('file_path', filePath)  // Compare based on file_path
      .maybeSingle();

    if (selectError) {
      console.error('Select error:', selectError);
      continue;
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from('songs')
        .insert({
          title: file.name.replace(/\.[^/.]+$/, ''),
          file_path: filePath,
          created_at: new Date().toISOString(),
          song_url: songUrl,
          album_id: 2,  // Replace or adjust this as necessary
        });

      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        console.log(`Inserted ${filePath} with URL ${songUrl}`);
      }
    } else {
      console.log(`Already exists: ${filePath}`);  n   
    }
  }
}

syncFilesToDatabase().catch(console.error);