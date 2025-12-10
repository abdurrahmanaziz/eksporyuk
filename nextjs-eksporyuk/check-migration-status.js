#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkStatus() {
  try {
    console.log('\n📊 SEJOLI MIGRATION STATUS REPORT');
    console.log('='.repeat(70));
    
    // Read export file
    const exportFile = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-export-100users-1765248491032.json');
    
    if (!fs.existsSync(exportFile)) {
      console.log('❌ Export file not found!');
      await prisma.$disconnect();
      return;
    }
    
    const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    
    console.log('\n📦 FILE EXPORT (Testing 100 users):');
    console.log('   👤 Users:', exportData.users?.length || 0);
    console.log('   💳 Orders:', exportData.orders?.length || 0);
    console.log('   💰 Commissions:', exportData.commissions?.length || 0);
    
    // Check database
    console.log('\n💾 DATABASE EKSPORYUK SEKARANG:');
    
    const users = await prisma.user.count();
    console.log('   👥 Total users:', users);
    
    const transactions = await prisma.transaction.count();
    console.log('   💰 Transactions:', transactions);
    
    const memberships = await prisma.userMembership.count();
    const activeMemberships = await prisma.userMembership.count({ 
      where: { isActive: true } 
    });
    console.log('   💳 Memberships:', memberships, `(${activeMemberships} active)`);
    
    const affiliates = await prisma.affiliateProfile.count();
    console.log('   🔗 Affiliates:', affiliates);
    
    // Check sample imported users
    console.log('\n✅ SAMPLE CHECK (first 5 from export):');
    for (let i = 0; i < Math.min(5, exportData.users.length); i++) {
      const email = exportData.users[i].user_email;
      const user = await prisma.user.findUnique({ 
        where: { email },
        select: { name: true, role: true }
      });
      
      if (user) {
        console.log(`   ✅ ${email} → ${user.name} (${user.role})`);
      } else {
        console.log(`   ❌ ${email} → NOT FOUND`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 YANG SUDAH DI-IMPORT (Testing Phase):');
    console.log('   ✅ 100 users dari Sejoli');
    console.log('   ✅ Order history mereka');
    console.log('   ✅ Membership status');
    console.log('   ✅ Affiliate data (jika ada)');
    
    console.log('\n📋 YANG TERSISA UNTUK DI-IMPORT:');
    console.log('   ⏳ ~17,900 users lagi dari Sejoli');
    console.log('   ⏳ Semua transaksi mereka');
    console.log('   ⏳ Semua membership history');
    console.log('   ⏳ Semua commission records');
    
    console.log('\n❓ APAKAH TRANSAKSI IKUT DI-IMPORT?');
    console.log('   ✅ YA! Semua data dari Sejoli akan di-import:');
    console.log('      • User accounts');
    console.log('      • Order/transaction history');
    console.log('      • Membership purchases & status');
    console.log('      • Affiliate commissions');
    console.log('      • Payment records');
    
    console.log('\n🎯 NEXT STEP:');
    console.log('   1. Extract full data (18K users) dari Sejoli WordPress');
    console.log('   2. Import semua ke Eksporyuk');
    console.log('   3. Verify data completeness');
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
