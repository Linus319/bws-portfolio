const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nvkqjzygxbsbzrfmizef.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52a3FqenlneGJzYnpyZm1pemVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjM1NTUwOCwiZXhwIjoyMDYxOTMxNTA4fQ.UTLUQidDsXi3vBmKT1eiws5unNVMbEThREFcBC19Sd4';
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