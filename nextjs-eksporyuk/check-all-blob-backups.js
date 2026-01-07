/**
 * SAFE BLOB BACKUP CHECKER
 * Checks all available backup URLs in Vercel Blob storage
 * READ-ONLY operation - NO database modifications
 */

console.log('🔍 CHECKING ALL BLOB BACKUP FILES FOR MODULE DATA...\n');
console.log('⚠️  READ-ONLY ANALYSIS - NO DATABASE CHANGES\n');

// List of potential backup URLs based on patterns found
const backupUrls = [
  'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/backup-2025-12-17T15-28-38-897Z.json',
  'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/backup-2025-12-26T22-28-26-296Z.json',
  'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/backup-2025-12-27T12-55-51-138Z.json',
  'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/backup-2026-01-01T05-58-52-302Z.json',
  'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/full-backup-1767414248776.json',
  'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/eksporyuk-backup-2025-12-29T03-48-47.json',
  'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/eksporyuk-backup-2025-12-29T03-45-56.json'
];

let foundModules = false;
let bestBackup = null;
let maxModules = 0;

async function checkBackup(url, index) {
  const filename = url.split('/').pop();
  
  try {
    console.log(`📋 Checking ${index + 1}/${backupUrls.length}: ${filename}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`   ❌ Not found (${response.status})`);
      return;
    }
    
    const data = await response.json();
    console.log('   ✅ Successfully loaded');
    
    if (data.timestamp) {
      console.log(`   📅 Created: ${data.timestamp}`);
    }
    
    let moduleCount = 0;
    let lessonCount = 0;
    let courseCount = 0;
    let totalTables = 0;
    
    // Check backup structure
    if (data.tables) {
      const tables = Object.keys(data.tables);
      totalTables = tables.length;
      moduleCount = data.tables.CourseModule ? data.tables.CourseModule.length : 0;
      lessonCount = data.tables.Lesson ? data.tables.Lesson.length : 0;
      courseCount = data.tables.Course ? data.tables.Course.length : 0;
      
      console.log(`   📊 Tables: ${totalTables} (${tables.slice(0,5).join(', ')}${tables.length > 5 ? '...' : ''})`);
    } else {
      const keys = Object.keys(data);
      totalTables = keys.length;
      moduleCount = data.CourseModule ? data.CourseModule.length : 0;
      lessonCount = data.Lesson ? data.Lesson.length : 0;
      courseCount = data.Course ? data.Course.length : 0;
      
      console.log(`   📊 Keys: ${totalTables} (${keys.slice(0,5).join(', ')}${keys.length > 5 ? '...' : ''})`);
    }
    
    console.log(`   📚 Course: ${courseCount}`);
    console.log(`   📖 CourseModule: ${moduleCount}`);
    console.log(`   📝 Lesson: ${lessonCount}`);
    
    if (moduleCount > 0) {
      foundModules = true;
      console.log(`   🎯 FOUND ${moduleCount} COURSE MODULES!`);
      
      if (moduleCount > maxModules) {
        maxModules = moduleCount;
        bestBackup = { url, filename, moduleCount, data };
      }
      
      // Show sample modules
      const modules = data.tables ? data.tables.CourseModule : data.CourseModule;
      if (modules && modules.length > 0) {
        console.log(`   Sample: "${modules[0].title}"`);
        if (modules.length > 1) {
          console.log(`   Sample: "${modules[1].title}"`);
        }
      }
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Check all backups sequentially (safer than parallel)
async function checkAllBackups() {
  for (let i = 0; i < backupUrls.length; i++) {
    await checkBackup(backupUrls[i], i);
    
    // Add small delay to be respectful to the server
    if (i < backupUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('='.repeat(60));
  if (foundModules) {
    console.log('✅ MODULES FOUND IN BACKUP!');
    console.log(`🎯 Best backup: ${bestBackup.filename}`);
    console.log(`📖 Contains: ${bestBackup.moduleCount} course modules`);
    console.log('');
    console.log('💡 Ready for safe restoration when requested');
  } else {
    console.log('❌ No backup contains CourseModule data');
    console.log('💡 Modules will need to be created manually');
  }
  console.log('');
  console.log('⚡ NO DATABASE WAS MODIFIED - READ-ONLY ANALYSIS COMPLETE');
}

checkAllBackups().catch(console.error);