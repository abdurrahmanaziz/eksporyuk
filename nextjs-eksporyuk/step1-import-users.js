#!/usr/bin/env node
/**
 * STEP 1: Import Users dari Sejoli dengan nama PERSIS
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function importUsers() {
  console.log('👥 STEP 1: Import Users dari Sejoli');
  console.log('='.repeat(50));
  
  // Baca file users
  const filepath = path.join(__dirname, 'scripts/sejoli-migration/exports/users_export.tsv');
  const content = fs.readFileSync(filepath, 'utf-8');
  const rows = content.split('\n').filter(line => line.trim());
  
  console.log(`📂 Total rows: ${rows.length}`);
  
  const tempPassword = await bcrypt.hash('TempPass123!', 10);
  let imported = 0;
  let skipped = 0;
  
  // Skip header, process in batches of 500
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split('\t');
    const [sejoliId, username, email, displayName, registered] = cols;
    
    if (!email || !email.includes('@')) {
      skipped++;
      continue;
    }
    
    const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50) || `user${sejoliId}`;
    
    let regDate = new Date('2022-01-01');
    if (registered) {
      const d = new Date(registered);
      if (!isNaN(d.getTime())) regDate = d;
    }
    
    try {
      await prisma.user.create({
        data: {
          email: email,
          username: cleanUsername,
          name: displayName || username || email.split('@')[0], // NAMA PERSIS dari Sejoli
          password: tempPassword,
          role: 'MEMBER_FREE',
          emailVerified: false,
          createdAt: regDate,
          updatedAt: regDate,
        }
      });
      imported++;
      
      if (imported % 500 === 0) {
        console.log(`   ✅ ${imported} users imported...`);
      }
    } catch (e) {
      if (e.code !== 'P2002') skipped++;
    }
  }
  
  const total = await prisma.user.count();
  console.log(`\n✅ SELESAI!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total di DB: ${total}`);
  
  await prisma.$disconnect();
}

importUsers();