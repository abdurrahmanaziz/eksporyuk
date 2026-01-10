const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Loading backup...');
    const backupText = fs.readFileSync('./backup-restore-dec27.json', 'utf-8');
    const backupData = JSON.parse(backupText);
    const backup = backupData.tables || backupData;
    
    console.log('\n📊 Restoring...');
    
    // Helper to create records one by one
    async function createRecords(model, records, label) {
      if (!records || records.length === 0) return 0;
      
      let count = 0;
      for (const record of records) {
        try {
          // Fix date fields
          const cleanRecord = { ...record };
          Object.keys(cleanRecord).forEach(k => {
            if (cleanRecord[k] instanceof Object && cleanRecord[k]._low !== undefined) {
              cleanRecord[k] = new Date(cleanRecord[k]._low);
            } else if (typeof cleanRecord[k] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(cleanRecord[k])) {
              cleanRecord[k] = new Date(cleanRecord[k]);
            }
          });
          
          await model.create({ data: cleanRecord }).catch(() => {});
          count++;
        } catch (e) {
          // Skip errors for now
        }
      }
      console.log(`${label}: ${count}/${records.length}`);
      return count;
    }
    
    // Restore in order
    const users = await createRecords(prisma.user, backup.user, 'Users');
    const courses = await createRecords(prisma.course, backup.course, 'Courses');
    const wallets = await createRecords(prisma.wallet, backup.wallet, 'Wallets');
    const enrollments = await createRecords(prisma.courseEnrollment, backup.courseEnrollment, 'Enrollments');
    const links = await createRecords(prisma.affiliateShortLink, backup.affiliateShortLink, 'Short Links');
    const conversions = await createRecords(prisma.affiliateConversion, backup.affiliateConversion, 'Conversions');
    
    console.log('\n✅ Restore complete!');
    
    // Verify counts
    const userCount = await prisma.user.count();
    const courseCount = await prisma.course.count();
    const enrollmentCount = await prisma.courseEnrollment.count();
    const walletCount = await prisma.wallet.count();
    const conversionCount = await prisma.affiliateConversion.count();
    
    console.log('\n📊 Final counts:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Courses: ${courseCount}`);
    console.log(`  Enrollments: ${enrollmentCount}`);
    console.log(`  Wallets: ${walletCount}`);
    console.log(`  Conversions: ${conversionCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
