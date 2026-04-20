const { put, list } = require('@vercel/blob');

async function testBlob() {
  console.log('Testing Vercel Blob connection...');
  console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'Set (' + process.env.BLOB_READ_WRITE_TOKEN.substring(0, 10) + '...)' : 'Not set');
  
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === 'data.json');
    console.log('Found data.json:', file ? file.url : 'No');
    
    if (file) {
      const dbRes = await fetch(`${file.url}?t=${Date.now()}`);
      const text = await dbRes.text();
      console.log('Current DB preview:', text.substring(0, 100));
    }
  } catch (error) {
    console.error('Error in blob:', error.message);
  }
}

testBlob();
