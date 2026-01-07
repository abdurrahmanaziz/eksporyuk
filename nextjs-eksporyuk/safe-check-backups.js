/**
 * SAFE BACKUP CHECKER - NO DATABASE MODIFICATIONS
 * Only reads and analyzes backup files for CourseModule data
 * Does NOT modify any existing data or database
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SAFELY CHECKING BACKUP FILES FOR MODULE DATA...\n');
console.log('⚠️  READ-ONLY OPERATION - NO DATABASE CHANGES\n');

// List backup files safely
const backupFiles = [
  'vercel-blob-backup/2026-01-03T04-09-44/31_database-backup-2025-12-30-2e2FjkJoTnCXU9oqFgdOK5ruva7D7D.json',
  'vercel-blob-backup/2026-01-03T04-09-44/32_database-backup-2025-12-30.json',
  'vercel-blob-backup/2026-01-03T04-09-44/33_database-backup-2026-01-01-OXimCL0d9sK7xHqJa3naM1AfdIdkwo.json'
];

let bestBackup = null;
let maxModules = 0;

for (const backupFile of backupFiles) {
  try {
    if (!fs.existsSync(backupFile)) {
      console.log(`❌ File not found: ${path.basename(backupFile)}`);
      continue;
    }
    
    const filename = path.basename(backupFile);
    console.log(`📋 Analyzing: ${filename}`);
    
    // Get file size first
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   File size: ${fileSizeMB} MB`);
    
    // Try to parse JSON safely
    const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    let moduleCount = 0;
    let lessonCount = 0;
    let courseCount = 0;
    
    // Check different backup formats safely
    if (data.tables) {
      moduleCount = data.tables.CourseModule ? data.tables.CourseModule.length : 0;
      lessonCount = data.tables.Lesson ? data.tables.Lesson.length : 0;
      courseCount = data.tables.Course ? data.tables.Course.length : 0;
    } else {
      moduleCount = data.CourseModule ? data.CourseModule.length : 0;
      lessonCount = data.Lesson ? data.Lesson.length : 0;
      courseCount = data.Course ? data.Course.length : 0;
    }
    
    console.log(`   📚 Course: ${courseCount}`);
    console.log(`   📖 CourseModule: ${moduleCount}`);
    console.log(`   📝 Lesson: ${lessonCount}`);
    
    if (moduleCount > 0) {
      console.log(`   🎯 FOUND MODULES! (${moduleCount} modules)`);
      
      if (moduleCount > maxModules) {
        maxModules = moduleCount;
        bestBackup = backupFile;
      }
      
      // Show sample data safely (no modifications)
      const modules = data.tables ? data.tables.CourseModule : data.CourseModule;
      if (modules && modules.length > 0) {
        console.log(`   Sample: "${modules[0].title}" (Course: ${modules[0].courseId})`);
      }
    }
    
    console.log('');
    
  } catch (error) {
    console.log(`   ❌ Error reading: ${error.message}`);
  }
}

if (bestBackup) {
  console.log('✅ ANALYSIS COMPLETE');
  console.log(`🎯 Best backup found: ${path.basename(bestBackup)}`);
  console.log(`📖 Contains ${maxModules} course modules`);
  console.log('\n💡 Ready for safe restoration when requested');
} else {
  console.log('❌ No backup files contain CourseModule data');
  console.log('💡 Modules may need to be created manually');
}

console.log('\n⚡ NO DATABASE WAS MODIFIED - READ-ONLY ANALYSIS COMPLETE');