/**
 * Quick test: Check if auto-backup is working and list existing backups
 * 
 * Usage:
 *   node scripts/check-auto-backup-status.js
 */

// Load .env
require('dotenv').config();

async function main() {
  console.log('🔍 CHECKING AUTO-BACKUP STATUS\n');

  // Check environment
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const hasCronSecret = !!process.env.CRON_SECRET;

  console.log('Environment Check:');
  console.log(`  BLOB_READ_WRITE_TOKEN: ${hasToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  CRON_SECRET: ${hasCronSecret ? '✅ Set' : '❌ Missing'}`);

  if (!hasToken) {
    console.log('\n❌ BLOB_READ_WRITE_TOKEN not found!');
    console.log('Auto-backup TIDAK AKAN JALAN di production tanpa token ini.');
    console.log('\nCara set di Vercel:');
    console.log('1. Buka project di Vercel Dashboard');
    console.log('2. Settings → Storage → Connect Blob Store');
    console.log('3. Copy BLOB_READ_WRITE_TOKEN');
    console.log('4. Settings → Environment Variables → Add BLOB_READ_WRITE_TOKEN');
    return;
  }

  console.log('\n📊 Backup Statistics:');
  try {
    const { list } = require('@vercel/blob');
    const { blobs } = await list({ prefix: 'db-backups/' });
    
    const totalSize = blobs.reduce((sum, b) => sum + b.size, 0);
    const lastBackup = blobs.length > 0 ? blobs[0].uploadedAt.toISOString() : null;
    
    console.log(`  Total Backups: ${blobs.length}`);
    console.log(`  Last Backup: ${lastBackup || 'Never'}`);
    console.log(`  Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    if (blobs.length > 0) {
      console.log('\n📁 Recent Backups:');
      const sortedBlobs = blobs
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 5);
      
      sortedBlobs.forEach((b, i) => {
        const date = new Date(b.uploadedAt);
        const age = Math.floor((Date.now() - date.getTime()) / 1000 / 60); // minutes
        const filename = b.pathname.replace('db-backups/', '');
        console.log(`  ${i + 1}. ${filename}`);
        console.log(`     Created: ${date.toLocaleString('id-ID')} (${age} menit lalu)`);
        console.log(`     Size: ${(b.size / 1024 / 1024).toFixed(2)} MB`);
      });

      console.log('\n✅ Auto-backup AKTIF dan sudah ada backup!');
    } else {
      console.log('\n⚠️  Belum ada backup. Cron akan jalan otomatis setiap 30 menit.');
      console.log('    Atau jalankan manual: curl -X GET https://eksporyuk.com/api/cron/auto-backup \\');
      console.log('      -H "Authorization: Bearer YOUR_CRON_SECRET"');
    }
  } catch (error) {
    console.error('\n❌ Error checking backups:', error.message);
    if (error.message.includes('fetch') || error.message.includes('401')) {
      console.log('\n💡 Kemungkinan token expired atau tidak valid.');
      console.log('   Regenerate token di Vercel Dashboard → Storage → Blob.');
    }
  }

  console.log('\n📋 Vercel Cron Config (vercel.json):');
  const vj = require('../vercel.json');
  if (vj.crons && vj.crons.length > 0) {
    vj.crons.forEach(c => {
      if (c.path.includes('auto-backup')) {
        console.log(`  ✅ Path: ${c.path}`);
        console.log(`  ✅ Schedule: ${c.schedule} (setiap 30 menit)`);
      }
    });
  } else {
    console.log('  ❌ Cron config tidak ditemukan di vercel.json!');
  }

  console.log('\n🔍 Kesimpulan:');
  if (!hasToken) {
    console.log('  ❌ Auto-backup BELUM AKTIF - token missing');
    console.log('  📝 Action: Set BLOB_READ_WRITE_TOKEN di Vercel Dashboard');
  } else if (!hasCronSecret) {
    console.log('  ⚠️  CRON_SECRET tidak ada - endpoint tidak protected!');
    console.log('  📝 Action: Generate random secret dan set di Vercel');
  } else {
    console.log('  ✅ Semua env vars sudah OK untuk production');
  }
}

main()
  .catch(e => {
    console.error('Fatal error:', e);
    process.exitCode = 1;
  });
