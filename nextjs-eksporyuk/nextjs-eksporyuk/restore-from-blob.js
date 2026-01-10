/**
 * Restore Database from Vercel Blob Backup
 * Usage: node restore-from-blob.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Same order as backup service
const RESTORE_ORDER = [
  'User',
  'Membership', 
  'UserMembership',
  'Transaction',
  'AffiliateProfile',
  'AffiliateConversion',
  'AffiliateCommission',
  'AffiliateCreditTransaction',
  'AffiliateLink',
  'AffiliateShortLink',
  'Wallet',
  'WalletTransaction',
  'PendingRevenue',
  'Course',
  'CourseModule',
  'CourseLesson',
  'CourseEnrollment',
  'Product',
  'Coupon',
  'BrandedTemplate',
  'Settings',
  'Integration',
  'IntegrationConfig',
  'Event',
  'EventRegistration',
  'Group',
  'GroupMember',
  'Post',
  'PostComment',
  'Notification',
  'Certificate',
  'LeadMagnet',
  'OptInPage',
  'MentorProfile',
];

// Fields that should be undefined instead of null
const NULLABLE_JSON_FIELDS = [
  'oneSignalTags', 'mailketingLists', 'metadata', 'settings',
  'customFields', 'config', 'data', 'options', 'params', 'extra',
  'json', 'tags', 'attributes', 'properties', 'detail', 'details',
  'commissionData', 'paymentData', 'orderData', 'transactionData'
];

// Clean record - remove null values that should be undefined
function cleanRecord(record) {
  const cleaned = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null && NULLABLE_JSON_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      // Skip null JSON fields - let Prisma use default
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

async function main() {
  console.log('🔄 Database Restore from Vercel Blob');
  console.log('=====================================\n');
  
  try {
    // Load backup
    console.log('📂 Loading backup file...');
    const backupPath = require('path').join(__dirname, 'backup-restore-dec27.json');
    const backupRaw = fs.readFileSync(backupPath, 'utf-8');
    const backupData = JSON.parse(backupRaw);
    
    if (!backupData.tables) {
      throw new Error('Invalid backup format - missing tables property');
    }
    
    const tables = backupData.tables;
    
    // Show backup info
    console.log(`\n📊 Backup Info:`);
    console.log(`   Created: ${backupData.createdAt}`);
    console.log(`   Version: ${backupData.version}`);
    
    // Count records
    let totalRecords = 0;
    for (const [table, records] of Object.entries(tables)) {
      if (Array.isArray(records)) {
        totalRecords += records.length;
        console.log(`   ${table}: ${records.length} records`);
      }
    }
    console.log(`   TOTAL: ${totalRecords} records\n`);
    
    // Clear all tables first (in reverse order to handle foreign keys)
    console.log('🗑️  Clearing existing data...');
    const reverseOrder = [...RESTORE_ORDER].reverse();
    
    for (const tableName of reverseOrder) {
      const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
      try {
        if (prisma[modelName]) {
          const deleted = await prisma[modelName].deleteMany({});
          console.log(`   ✓ ${tableName}: ${deleted.count} deleted`);
        }
      } catch (e) {
        console.log(`   ⚠ ${tableName}: ${e.message}`);
      }
    }
    
    // Restore data in order
    console.log('\n📥 Restoring data...');
    
    for (const tableName of RESTORE_ORDER) {
      const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
      // Backup uses lowercase table names
      const backupTableName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
      const records = tables[backupTableName];
      
      if (!records || !Array.isArray(records) || records.length === 0) {
        continue;
      }
      
      if (!prisma[modelName]) {
        console.log(`   ⚠ Skipping ${tableName}: Model not found`);
        continue;
      }
      
      try {
        // Insert in batches of 100
        let inserted = 0;
        let errors = [];
        
        for (let i = 0; i < records.length; i += 100) {
          const batch = records.slice(i, i + 100).map(cleanRecord);
          try {
            await prisma[modelName].createMany({
              data: batch,
              skipDuplicates: true,
            });
            inserted += batch.length;
          } catch (batchError) {
            // Try one by one
            for (const record of batch) {
              try {
                await prisma[modelName].create({ data: record });
                inserted++;
              } catch (e) {
                errors.push(e.message.substring(0, 100));
              }
            }
          }
          
          // Progress indicator for large tables
          if (records.length > 1000 && (i % 1000 === 0)) {
            process.stdout.write(`   ${tableName}: ${inserted}/${records.length}\r`);
          }
        }
        console.log(`   ✓ ${tableName}: ${inserted}/${records.length}${errors.length > 0 ? ` (${errors.length} errors)` : ''}`);
      } catch (e) {
        console.log(`   ⚠ ${tableName}: ${e.message}`);
      }
    }
    
    // Verification
    console.log('\n✅ Verification:');
    const userCount = await prisma.user.count();
    const courseCount = await prisma.course.count();
    const enrollmentCount = await prisma.courseEnrollment.count();
    const walletCount = await prisma.wallet.count();
    const conversionCount = await prisma.affiliateConversion.count();
    const affiliateCount = await prisma.user.count({ where: { role: 'AFFILIATE' } });
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Affiliates: ${affiliateCount}`);
    console.log(`   Courses: ${courseCount}`);
    console.log(`   Enrollments: ${enrollmentCount}`);
    console.log(`   Wallets: ${walletCount}`);
    console.log(`   Conversions: ${conversionCount}`);
    
    console.log('\n🎉 Restore complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
