/**
 * MANUAL MEMBERSHIP ASSIGNMENT TOOL
 * 
 * Script untuk admin yang ingin manual assign membership ke user tertentu.
 * Berguna jika ada kasus khusus atau data yang perlu diperbaiki.
 * 
 * Usage:
 * node scripts/migration/manual-assign-membership.js
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function findUser(emailOrName) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: emailOrName, mode: 'insensitive' } },
        { name: { contains: emailOrName, mode: 'insensitive' } }
      ]
    },
    include: {
      userMemberships: {
        include: { membership: true }
      }
    },
    take: 10
  });
  
  return users;
}

async function listMemberships() {
  const memberships = await prisma.membership.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      duration: true
    }
  });
  
  return memberships;
}

function calculateEndDate(duration) {
  const now = new Date();
  
  if (!duration || duration === 0) {
    // Lifetime: 100 tahun dari sekarang
    return new Date(now.getFullYear() + 100, 11, 31);
  }
  
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + duration);
  return endDate;
}

async function assignMembership(userId, membershipId, customEndDate = null) {
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId }
  });
  
  if (!membership) {
    throw new Error('Membership not found');
  }
  
  const endDate = customEndDate || calculateEndDate(membership.duration);
  const now = new Date();
  const status = endDate > now ? 'ACTIVE' : 'EXPIRED';
  
  // Check if user already has this membership
  const existing = await prisma.userMembership.findFirst({
    where: {
      userId,
      membershipId
    }
  });
  
  if (existing) {
    // Update existing
    const updated = await prisma.userMembership.update({
      where: { id: existing.id },
      data: {
        endDate,
        status,
        updatedAt: new Date()
      },
      include: { membership: true }
    });
    
    return { action: 'UPDATED', data: updated };
  } else {
    // Create new
    const created = await prisma.userMembership.create({
      data: {
        userId,
        membershipId,
        startDate: now,
        endDate,
        status,
        autoRenew: false
      },
      include: { membership: true }
    });
    
    return { action: 'CREATED', data: created };
  }
}

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   MANUAL MEMBERSHIP ASSIGNMENT TOOL                ║');
  console.log('║   EksporyUK Platform - Admin Tool                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  // Step 1: Find user
  console.log('📝 Step 1: Cari User\n');
  const searchQuery = await question('Masukkan email atau nama user: ');
  
  console.log('\n🔍 Mencari user...\n');
  const users = await findUser(searchQuery);
  
  if (users.length === 0) {
    console.log('❌ User tidak ditemukan!\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }
  
  console.log(`Ditemukan ${users.length} user:\n`);
  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.name}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Current Memberships: ${u.userMemberships.length}`);
    if (u.userMemberships.length > 0) {
      u.userMemberships.forEach(um => {
        const exp = um.endDate ? new Date(um.endDate).toLocaleDateString('id-ID') : 'Lifetime';
        console.log(`     - ${um.membership.name} (exp: ${exp}) [${um.status}]`);
      });
    }
    console.log('');
  });
  
  const userIndex = await question('Pilih nomor user (atau 0 untuk cancel): ');
  const selectedUserIndex = parseInt(userIndex) - 1;
  
  if (selectedUserIndex < 0 || selectedUserIndex >= users.length) {
    console.log('\n❌ Dibatalkan\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }
  
  const selectedUser = users[selectedUserIndex];
  console.log(`\n✅ Selected: ${selectedUser.name} (${selectedUser.email})\n`);
  
  // Step 2: Choose membership
  console.log('📦 Step 2: Pilih Membership\n');
  const memberships = await listMemberships();
  
  console.log('Available Memberships:\n');
  memberships.forEach((m, i) => {
    const duration = m.duration === 0 ? 'Lifetime' : `${m.duration} hari`;
    console.log(`${i + 1}. ${m.name}`);
    console.log(`   Price: Rp ${Number(m.price).toLocaleString('id-ID')} | Duration: ${duration}`);
  });
  console.log('');
  
  const membershipIndex = await question('Pilih nomor membership (atau 0 untuk cancel): ');
  const selectedMembershipIndex = parseInt(membershipIndex) - 1;
  
  if (selectedMembershipIndex < 0 || selectedMembershipIndex >= memberships.length) {
    console.log('\n❌ Dibatalkan\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }
  
  const selectedMembership = memberships[selectedMembershipIndex];
  console.log(`\n✅ Selected: ${selectedMembership.name}\n`);
  
  // Step 3: Set expiry date (optional)
  console.log('📅 Step 3: Set Expiry Date (optional)\n');
  console.log('Default expiry akan dihitung otomatis berdasarkan duration.');
  const customDate = await question('Custom expiry date? (YYYY-MM-DD atau Enter untuk default): ');
  
  let endDate = null;
  if (customDate && customDate.trim() !== '') {
    try {
      endDate = new Date(customDate);
      console.log(`✅ Custom expiry: ${endDate.toLocaleDateString('id-ID')}\n`);
    } catch (err) {
      console.log('⚠️  Invalid date format, menggunakan default\n');
    }
  }
  
  // Step 4: Confirm
  console.log('═'.repeat(60));
  console.log('📋 KONFIRMASI:\n');
  console.log(`User      : ${selectedUser.name} (${selectedUser.email})`);
  console.log(`Membership: ${selectedMembership.name}`);
  if (endDate) {
    console.log(`Expiry    : ${endDate.toLocaleDateString('id-ID')} (custom)`);
  } else {
    const autoEndDate = calculateEndDate(selectedMembership.duration);
    console.log(`Expiry    : ${autoEndDate.toLocaleDateString('id-ID')} (auto)`);
  }
  console.log('═'.repeat(60));
  console.log('');
  
  const confirm = await question('Lanjutkan? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('\n❌ Dibatalkan\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }
  
  // Step 5: Execute
  console.log('\n⏳ Processing...\n');
  
  try {
    const result = await assignMembership(
      selectedUser.id,
      selectedMembership.id,
      endDate
    );
    
    console.log(`✅ ${result.action}!\n`);
    console.log('Details:');
    console.log(`   Membership: ${result.data.membership.name}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Start Date: ${new Date(result.data.startDate).toLocaleDateString('id-ID')}`);
    console.log(`   End Date: ${new Date(result.data.endDate).toLocaleDateString('id-ID')}`);
    console.log('');
    
    // Ask if want to continue with another user
    const continueAssign = await question('Assign membership lain? (y/n): ');
    
    if (continueAssign.toLowerCase() === 'y') {
      rl.close();
      await prisma.$disconnect();
      // Restart
      return main();
    }
    
    console.log('\n✅ Selesai!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
  
  rl.close();
  await prisma.$disconnect();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n\n👋 Goodbye!\n');
  rl.close();
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('Fatal Error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
