const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BUCKET_NAME = 'trracks';

async function fetchTracks() {
  const { data, error } = await supabase
    .from('tracks')
    .select('*');

  if (error) {
    console.error('Error fetching tracks:', error);
    return;
  }

  // Assuming each row has a 'storage_path' column with the file path in the bucket
  const tracksWithUrls = data.map(track => {
    const { data: publicUrlData } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(track.storage_path); // or track.path, depending on your schema

    return {
      ...track,
      publicUrl: publicUrlData.publicUrl,
    };
  });

  console.log('Tracks with URLs:', tracksWithUrls);
}

fetchTracks();