const { list } = require('@vercel/blob');
const https = require('https');
const fs = require('fs');

async function download() {
  const result = await list({
    token: 'vercel_blob_rw_2O4Ab48sR0ROKwSf_Q2UfUm1QSOlMCFbODmvt0zwO0RupNx'
  });
  
  const backup = result.blobs.find(b => b.pathname === 'backups/eksporyuk-backup-2025-12-29T03-48-47.json');
  if (!backup) {
    console.log('Backup not found!');
    return;
  }
  
  console.log('Downloading:', backup.pathname);
  console.log('URL:', backup.url);
  console.log('Size:', (backup.size / 1024 / 1024).toFixed(2), 'MB');
  
  const file = fs.createWriteStream('/tmp/db-backup.json');
  https.get(backup.url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download complete: /tmp/db-backup.json');
    });
  });
}
download().catch(console.error);
