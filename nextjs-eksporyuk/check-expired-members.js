const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== MEMBER YANG SUDAH EXPIRED ===\n');
  
  const now = new Date();
  
  // Check user memberships yang sudah lewat endDate
  const expiredMemberships = await prisma.userMembership.findMany({
    where: {
      endDate: {
        lt: now
      }
    },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true }
      },
      membership: {
        select: { name: true, price: true, duration: true }
      }
    },
    orderBy: {
      endDate: 'desc'
    }
  });
  
  console.log(`📅 MEMBERSHIP YANG SUDAH EXPIRED (endDate < now):`);
  console.log(`   Total: ${expiredMemberships.length} memberships\n`);
  
  // Group by status
  const byStatus = {};
  expiredMemberships.forEach(um => {
    byStatus[um.status] = (byStatus[um.status] || 0) + 1;
  });
  
  console.log(`   By Status:`);
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`     ${status}: ${count}`);
  });
  
  // Unique users
  const uniqueExpiredUsers = new Set(expiredMemberships.map(um => um.userId)).size;
  console.log(`\n   Unique Users: ${uniqueExpiredUsers}`);
  
  // By membership plan
  console.log(`\n   By Membership Plan:`);
  const byPlan = {};
  expiredMemberships.forEach(um => {
    const planName = um.membership.name;
    if (!byPlan[planName]) {
      byPlan[planName] = { count: 0, duration: um.membership.duration };
    }
    byPlan[planName].count++;
  });
  
  Object.entries(byPlan).forEach(([plan, data]) => {
    console.log(`     ${plan} (${data.duration}): ${data.count}`);
  });
  
  // By user role
  console.log(`\n   By User Role:`);
  const byRole = {};
  expiredMemberships.forEach(um => {
    byRole[um.user.role] = (byRole[um.user.role] || 0) + 1;
  });
  
  Object.entries(byRole).sort((a, b) => b[1] - a[1]).forEach(([role, count]) => {
    console.log(`     ${role}: ${count}`);
  });
  
  // Sample expired users yang masih MEMBER_PREMIUM
  const expiredButPremium = expiredMemberships.filter(um => um.user.role === 'MEMBER_PREMIUM');
  
  console.log(`\n\n⚠️  USERS EXPIRED TAPI MASIH ROLE MEMBER_PREMIUM:`);
  console.log(`   Total: ${expiredButPremium.length}`);
  
  if (expiredButPremium.length > 0) {
    console.log(`\n   Sample (first 10):`);
    expiredButPremium.slice(0, 10).forEach(um => {
      const daysExpired = Math.floor((now - um.endDate) / (1000 * 60 * 60 * 24));
      console.log(`     - ${um.user.email}`);
      console.log(`       Plan: ${um.membership.name} | Expired: ${daysExpired} hari lalu`);
      console.log(`       Status: ${um.status} | Role: ${um.user.role}`);
      console.log();
    });
  }
  
  // Expired in last 30 days
  const last30days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const recentExpired = expiredMemberships.filter(um => um.endDate >= last30days);
  
  console.log(`\n📊 EXPIRED DALAM 30 HARI TERAKHIR:`);
  console.log(`   Total: ${recentExpired.length} memberships`);
  console.log(`   Unique Users: ${new Set(recentExpired.map(um => um.userId)).size}`);
  
  // Expired more than 1 year ago
  const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
  const oldExpired = expiredMemberships.filter(um => um.endDate < oneYearAgo);
  
  console.log(`\n📊 EXPIRED LEBIH DARI 1 TAHUN:`);
  console.log(`   Total: ${oldExpired.length} memberships`);
  console.log(`   Unique Users: ${new Set(oldExpired.map(um => um.userId)).size}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
