// Test upload to Vercel Blob
// Run with: node test-blob-upload.js

require('dotenv').config({ path: '.env.local' });

async function testUpload() {
  console.log('🚀 Testing Vercel Blob Upload...\n');

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.log('❌ BLOB_READ_WRITE_TOKEN not found');
    return;
  }

  try {
    const { put, list } = require('@vercel/blob');

    // Create a simple test image (1x1 transparent PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');

    console.log('📤 Uploading test image...');
    
    const blob = await put('test/logo-test.png', testImageBuffer, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
    });

    console.log('✅ Upload successful!');
    console.log('');
    console.log('📋 Blob Details:');
    console.log('   URL:', blob.url);
    console.log('   Path:', blob.pathname);
    console.log('');
    console.log('🔗 Test this URL in browser:');
    console.log('   ' + blob.url);
    console.log('');

    // List all blobs
    const result = await list();
    console.log('📁 All blobs in storage:', result.blobs.length);
    result.blobs.forEach(b => {
      console.log(`   - ${b.pathname}`);
      console.log(`     URL: ${b.url}`);
    });

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error(error);
  }
}

testUpload();
