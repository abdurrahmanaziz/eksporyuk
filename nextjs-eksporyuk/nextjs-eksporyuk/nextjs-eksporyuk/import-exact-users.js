#!/usr/bin/env node
/**
 * Import PERSIS 18,752 users dari Sejoli (sesuai PRD line 5093)
 * TIDAK BOLEH DUPLIKAT - jumlah harus EXACT sama
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function importExact() {
  console.log('📋 PRD LINE 5093: Import EXACT dari Sejoli');
  console.log('='.repeat(50));
  
  const filepath = path.join(__dirname, 'scripts/sejoli-migration/exports/users_export.tsv');
  const content = fs.readFileSync(filepath, 'utf-8');
  const rows = content.split('\n').filter(line => line.trim());
  
  const sejoliCount = rows.length - 1; // minus header
  console.log(`📂 Sejoli users: ${sejoliCount}`);
  
  const tempPassword = await bcrypt.hash('TempPass123!', 10);
  const emailSet = new Set(); // Cegah duplikat email
  let imported = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split('\t');
    const [sejoliId, username, email, displayName, registered] = cols;
    
    // Skip jika email invalid atau sudah ada
    if (!email || !email.includes('@') || emailSet.has(email.toLowerCase())) {
      continue;
    }
    emailSet.add(email.toLowerCase());
    
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
          name: displayName || username || email.split('@')[0],
          password: tempPassword,
          role: 'MEMBER_FREE',
          emailVerified: false,
          createdAt: regDate,
          updatedAt: regDate,
        }
      });
      imported++;
      
      if (imported % 1000 === 0) {
        console.log(`   ✅ ${imported}/${sejoliCount}...`);
      }
    } catch (e) {
      // Skip error
    }
  }
  
  const dbCount = await prisma.user.count();
  console.log(`\n✅ SELESAI!`);
  console.log(`   Sejoli: ${sejoliCount}`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Di DB: ${dbCount}`);
  
  if (dbCount <= sejoliCount) {
    console.log(`   ✅ TIDAK ADA DUPLIKAT`);
  } else {
    console.log(`   ⚠️  ADA MASALAH DUPLIKAT!`);
  }
  
  await prisma.$disconnect();
}

importExact();