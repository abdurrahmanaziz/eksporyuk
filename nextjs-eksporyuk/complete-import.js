#!/usr/bin/env node
/**
 * COMPLETE IMPORT - Import SEMUA users termasuk yang tanpa email valid
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports');

function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'));
}

async function completeImport() {
  console.log('🔥 COMPLETE IMPORT - SEMUA 18K+ USERS');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();

  try {
    // Parse data
    console.log('📂 Reading TSV files...');
    const usersData = readTSV('users_export.tsv').slice(1); // Skip header
    
    console.log(`   ${usersData.length} total users from Sejoli\n`);

    // 1. Create admin if not exists
    console.log('👤 Ensuring admin exists...');
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@eksporyuk.com' },
      create: {
        email: 'admin@eksporyuk.com',
        username: 'admin',
        name: 'Administrator',
        password: adminHash,
        role: 'ADMIN',
        emailVerified: true,
      },
      update: {}
    });
    console.log('   ✅ Admin ready\n');

    // 2. COMPLETE import: Handle SEMUA users
    console.log('👥 Complete import - ALL users...');
    const tempPassword = await bcrypt.hash('TempPass123!', 10);
    
    const BATCH_SIZE = 1000;
    let totalImported = 0;
    
    for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
      const batch = usersData.slice(i, i + BATCH_SIZE);
      const userBatch = [];
      
      for (const [wpId, email, displayName, registered] of batch) {
        // Validasi dan normalize tanggal
        let createdAt = new Date('2022-01-01');
        if (registered && registered.trim()) {
          const testDate = new Date(registered);
          if (!isNaN(testDate.getTime())) {
            createdAt = testDate;
          }
        }
        
        // Handle users DENGAN dan TANPA email valid
        let userEmail, userName, displayedName;
        
        if (email && email.includes('@')) {
          // User dengan email valid
          userEmail = email;
          userName = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50) || `user${wpId}`;
          displayedName = (displayName || email.split('@')[0]).substring(0, 100);
        } else {
          // User TANPA email valid - buat email dummy
          userEmail = `user${wpId}@temp.eksporyuk.com`;
          userName = (email || displayName || `user${wpId}`).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50) || `user${wpId}`;
          displayedName = (displayName || email || `User ${wpId}`).substring(0, 100);
        }
        
        // Pastikan username tidak kosong
        if (!userName || userName.length === 0) {
          userName = `user${wpId}`;
        }
        
        userBatch.push({
          email: userEmail,
          username: userName,
          name: displayedName,
          password: tempPassword,
          role: 'MEMBER_FREE',
          emailVerified: false,
          createdAt: createdAt,
        });
      }
      
      if (userBatch.length > 0) {
        const result = await prisma.user.createMany({
          data: userBatch,
          skipDuplicates: true
        });
        totalImported += result.count;
        console.log(`   ✅ Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${result.count} users imported`);
      }
    }

    const finalUserCount = await prisma.user.count();
    console.log(`   ✅ Total users in DB: ${finalUserCount}`);
    console.log(`   ✅ New users imported: ${totalImported}\n`);

    const duration = (Date.now() - startTime) / 1000 / 60;

    console.log('🎉 COMPLETE IMPORT FINISHED!');
    console.log(`   Duration: ${duration.toFixed(2)} minutes`);
    console.log(`   Speed: ${Math.round(totalImported / duration)} users/minute`);
    console.log(`   Coverage: ${Math.round((finalUserCount / usersData.length) * 100)}% of Sejoli users`);
    
    console.log('\n💡 Next steps:');
    console.log('   1. Login: admin@eksporyuk.com / Admin123!');
    console.log('   2. Import transactions & commissions');
    console.log('   3. Deploy: git add . && git commit && git push');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.code) console.error('   Code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

completeImport();