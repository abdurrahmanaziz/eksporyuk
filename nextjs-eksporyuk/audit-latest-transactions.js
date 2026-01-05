#!/usr/bin/env node
/**
 * Auto-audit latest transactions
 * Cek komisi, membership, user paket, benefit yang didapat
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

async function auditTransactions() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        AUTO AUDIT - LATEST TRANSACTIONS                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get latest 10 SUCCESS transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS'
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log(`📊 Found ${transactions.length} successful transactions\n`);

  let issueCount = 0;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Transaction ${i + 1}/${transactions.length}`);
    console.log(`${'─'.repeat(60)}`);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: tx.userId },
      select: { id: true, email: true, name: true, role: true }
    });

    console.log(`👤 User: ${user?.name || 'Unknown'} (${user?.email})`);
    console.log(`   Role: ${user?.role || 'Unknown'}`);
    console.log(`   ID: ${tx.userId}`);

    // Get membership details from metadata or membershipId
    let membership = null;
    if (tx.membershipId) {
      membership = await prisma.membership.findUnique({
        where: { id: tx.membershipId },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          duration: true,
          affiliateCommissionRate: true,
          commissionType: true
        }
      });
    }

    // If no membershipId, try to get from metadata
    const meta = tx.metadata || {};
    if (!membership && meta.membershipId) {
      membership = await prisma.membership.findUnique({
        where: { id: meta.membershipId },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          duration: true,
          affiliateCommissionRate: true,
          commissionType: true
        }
      });
    }

    if (membership) {
      console.log(`\n📦 Membership/Paket:`);
      console.log(`   Name: ${membership.name}`);
      console.log(`   Duration: ${membership.duration} hari`);
      console.log(`   Price: ${await formatCurrency(membership.price)}`);
    } else {
      console.log(`\n⚠️  WARNING: No membership found!`);
      issueCount++;
      if (meta.membershipType) {
        console.log(`   Metadata has: ${meta.membershipType}`);
      }
    }

    // Transaction details
    console.log(`\n💰 Transaction:`);
    console.log(`   TX ID: ${tx.id}`);
    console.log(`   Amount: ${await formatCurrency(tx.amount)}`);
    console.log(`   Type: ${tx.type}`);
    console.log(`   Date: ${new Date(tx.createdAt).toLocaleString('id-ID')}`);
    console.log(`   Payment Method: ${meta.paymentMethodType || tx.paymentMethod || 'Unknown'}`);

    // Commission details
    console.log(`\n🎯 Affiliate Commission:`);
    if (tx.affiliateId) {
      const affiliate = await prisma.user.findUnique({
        where: { id: tx.affiliateId },
        select: { id: true, name: true, email: true }
      });

      let commissionRate = membership?.affiliateCommissionRate || 0;
      let commissionType = membership?.commissionType || 'PERCENTAGE';

      // Calculate commission
      let commissionAmount = 0;
      if (commissionType === 'FLAT') {
        commissionAmount = Math.min(Number(commissionRate), Number(tx.amount));
      } else {
        commissionAmount = (Number(tx.amount) * Number(commissionRate)) / 100;
      }

      console.log(`   Affiliate: ${affiliate?.name || 'Unknown'}`);
      console.log(`   Email: ${affiliate?.email}`);
      console.log(`   Commission Rate: ${commissionRate}${commissionType === 'PERCENTAGE' ? '%' : ' IDR'}`);
      console.log(`   Type: ${commissionType}`);
      console.log(`   Amount: ${await formatCurrency(commissionAmount)}`);

      // Check if wallet has been credited
      const wallet = await prisma.wallet.findUnique({
        where: { userId: tx.affiliateId }
      });

      const walletTx = await prisma.walletTransaction.findFirst({
        where: {
          reference: tx.id,
          type: 'COMMISSION'
        }
      });

      if (walletTx) {
        console.log(`   ✅ Wallet credited: ${await formatCurrency(walletTx.amount)}`);
      } else {
        console.log(`   ❌ WARNING: NOT credited to wallet!`);
        issueCount++;
      }
    } else {
      console.log(`   No affiliate for this transaction`);
    }

    // Check membership activation
    console.log(`\n✨ Membership Activation:`);
    const userMembership = await prisma.userMembership.findFirst({
      where: {
        userId: tx.userId,
        isActive: true
      }
    });

    if (userMembership) {
      const membershipData = await prisma.membership.findUnique({
        where: { id: userMembership.membershipId },
        select: { name: true, slug: true }
      });
      console.log(`   ✅ Active: ${membershipData?.name || 'Unknown'}`);
      console.log(`   Started: ${new Date(userMembership.startedAt || userMembership.createdAt).toLocaleString('id-ID')}`);
      const expiresDate = userMembership.expiresAt ? new Date(userMembership.expiresAt).toLocaleString('id-ID') : 'N/A';
      console.log(`   Expires: ${expiresDate}`);
    } else {
      console.log(`   ⚠️  WARNING: No active membership found!`);
      issueCount++;
    }

    // Check groups
    const groups = await prisma.groupMember.findMany({
      where: { userId: tx.userId }
    });

    console.log(`\n👥 Groups Joined:`);
    if (groups.length > 0) {
      for (const gm of groups) {
        const groupData = await prisma.group.findUnique({
          where: { id: gm.groupId },
          select: { name: true, slug: true }
        });
        console.log(`   ✅ ${groupData?.name || 'Unknown'}`);
      }
    } else {
      console.log(`   ⚠️  No groups joined`);
    }

    // Check courses
    const courses = await prisma.courseEnrollment.findMany({
      where: { userId: tx.userId }
    });

    console.log(`\n📚 Courses Enrolled:`);
    if (courses.length > 0) {
      for (const ce of courses) {
        const courseData = await prisma.course.findUnique({
          where: { id: ce.courseId },
          select: { title: true, slug: true }
        });
        console.log(`   ✅ ${courseData?.title || 'Unknown'}`);
      }
    } else {
      console.log(`   ⚠️  No courses enrolled`);
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'═'.repeat(60)}`);
  console.log(`Total transactions audited: ${transactions.length}`);
  console.log(`Issues found: ${issueCount}`);

  if (issueCount === 0) {
    console.log('\n✅ All transactions look good!');
  } else {
    console.log(`\n⚠️  Found ${issueCount} issues that need attention!`);
  }

  console.log('\n');
  await prisma.$disconnect();
}

auditTransactions().catch(error => {
  console.error('ERROR:', error.message);
  process.exit(1);
});
