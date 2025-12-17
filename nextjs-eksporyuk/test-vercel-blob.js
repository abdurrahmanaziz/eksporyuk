// Test Vercel Blob connection
// Run: node test-vercel-blob.js

const https = require('https');

async function testBlobConnection() {
  console.log('🔍 Testing Vercel Blob Configuration...\n');

  // Check environment variable
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.log('❌ BLOB_READ_WRITE_TOKEN not found in environment');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Go to Vercel Dashboard → Storage → Your Blob Store');
    console.log('   2. Click "Settings" tab');
    console.log('   3. Copy the "Read/Write Token"');
    console.log('   4. Add to .env.local:');
    console.log('      BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxx..."');
    console.log('   5. Also add to Vercel Environment Variables for production');
    console.log('');
    return;
  }

  console.log('✅ BLOB_READ_WRITE_TOKEN found');
  console.log('   Token starts with:', token.substring(0, 20) + '...');

  // Try to list blobs to verify connection
  try {
    const { list } = require('@vercel/blob');
    const result = await list();
    console.log('✅ Successfully connected to Vercel Blob!');
    console.log('   Blobs in storage:', result.blobs.length);
    
    if (result.blobs.length > 0) {
      console.log('\n   Recent files:');
      result.blobs.slice(0, 5).forEach(blob => {
        console.log(`   - ${blob.pathname} (${blob.url})`);
      });
    }
  } catch (error) {
    console.log('❌ Failed to connect to Vercel Blob:', error.message);
  }
}

testBlobConnection();
