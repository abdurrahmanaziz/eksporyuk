import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

console.log('\n👥 IMPORTING MISSING USERS FROM SEJOLI\n');

// Load TSV
const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8');
const userLines = usersRaw.split('\n').slice(1).filter(l => l.trim());

console.log(`📂 Loaded ${userLines.length} users from TSV\n`);

// Get existing users
console.log('🔍 Checking existing users...');
const existingUsers = await prisma.user.findMany({
  select: { email: true }
});

const existingEmails = new Set(
  existingUsers.map(u => u.email?.toLowerCase()).filter(e => e)
);

console.log(`  Found ${existingEmails.size} existing emails\n`);

// Parse and filter missing users
const usersToCreate = [];
let skippedExists = 0;
let skippedNoEmail = 0;

for (const line of userLines) {
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  
  const sejoliUserId = parts[0];
  const name = parts[1]?.trim() || `User ${sejoliUserId}`;
  const email = parts[2]?.trim().toLowerCase();
  
  if (!email) {
    skippedNoEmail++;
    continue;
  }
  
  if (existingEmails.has(email)) {
    skippedExists++;
    continue;
  }
  
  // Create user object
  usersToCreate.push({
    name,
    email,
    password: await bcrypt.hash('password123', 10), // Default password
    role: 'MEMBER_FREE',
    status: 'ACTIVE',
    metadata: {
      sejoliUserId: parseInt(sejoliUserId),
      importedFrom: 'sejoli',
      importedAt: new Date().toISOString()
    }
  });
}

console.log(`📊 Import Summary:`);
console.log(`  Total users in TSV: ${userLines.length}`);
console.log(`  Already exists: ${skippedExists}`);
console.log(`  No email: ${skippedNoEmail}`);
console.log(`  Ready to import: ${usersToCreate.length}\n`);

if (usersToCreate.length === 0) {
  console.log('✅ No new users to import!');
  await prisma.$disconnect();
  process.exit(0);
}

// Import in batches
console.log('💾 Importing users...');
const batchSize = 100;
let imported = 0;

for (let i = 0; i < usersToCreate.length; i += batchSize) {
  const batch = usersToCreate.slice(i, i + batchSize);
  
  for (const user of batch) {
    try {
      await prisma.user.create({
        data: user
      });
      imported++;
      
      if (imported % 50 === 0) {
        console.log(`  Progress: ${imported}/${usersToCreate.length} (${((imported/usersToCreate.length)*100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error(`  ❌ Error importing ${user.email}:`, error.message);
    }
  }
}

console.log(`\n✅ Imported ${imported} users\n`);

// Verify
const finalCount = await prisma.user.count();
console.log(`📊 Total users in database: ${finalCount.toLocaleString('id-ID')}\n`);

console.log('✅ User import complete!');

await prisma.$disconnect();
