#!/usr/bin/env node
/**
 * Analisis kenapa tidak semua users terimport
 */

const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'scripts/sejoli-migration/exports/users_export.tsv');
const content = fs.readFileSync(usersFile, 'utf-8');
const lines = content.split('\n').filter(line => line.trim());
const header = lines[0];
const data = lines.slice(1);

console.log('📋 Header:', header);
console.log('📊 Total lines (with header):', lines.length);
console.log('📊 Data lines:', data.length);

// Check for invalid emails
let validEmails = 0;
let invalidEmails = 0;
let duplicateEmails = 0;
const invalidSamples = [];
const emailSet = new Set();

data.forEach((line, index) => {
  const [wpId, email, displayName, registered] = line.split('\t');
  
  if (!email || !email.includes('@')) {
    invalidEmails++;
    if (invalidSamples.length < 5) {
      invalidSamples.push({ line: index + 2, email, wpId });
    }
  } else {
    // Check for duplicates
    if (emailSet.has(email.toLowerCase())) {
      duplicateEmails++;
    } else {
      emailSet.add(email.toLowerCase());
      validEmails++;
    }
  }
});

console.log('✅ Valid unique emails:', validEmails);
console.log('❌ Invalid emails:', invalidEmails);
console.log('🔄 Duplicate emails:', duplicateEmails);

if (invalidSamples.length > 0) {
  console.log('\n🔍 Sample invalid emails:');
  invalidSamples.forEach(sample => {
    console.log(`   Line ${sample.line}: "${sample.email}" (ID: ${sample.wpId})`);
  });
}

console.log('\n📝 Expected successful imports:', validEmails, 'users');
console.log('📝 Current database count: Check with Prisma...');

// Also check for very long usernames or invalid characters
let longUsernames = 0;
let invalidUsernames = 0;

data.forEach((line, index) => {
  const [wpId, email, displayName, registered] = line.split('\t');
  
  if (email && email.includes('@')) {
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
    
    if (username.length === 0) {
      invalidUsernames++;
    } else if (email.split('@')[0].length > 50) {
      longUsernames++;
    }
  }
});

console.log('⚠️  Long usernames (truncated):', longUsernames);
console.log('⚠️  Invalid usernames (empty after cleanup):', invalidUsernames);