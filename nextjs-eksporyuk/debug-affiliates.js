/**
 * DEBUG: Check why affiliates not found
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function debugAffiliates() {
  console.log('\n=== DEBUG AFFILIATES ===\n');
  
  try {
    // Load Sejoli data
    const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
    const raw = fs.readFileSync(sejoliPath, 'utf-8');
    const sejoliData = JSON.parse(raw);
    
    // Get top affiliates from transactions
    const txWithAffiliate = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      select: { metadata: true }
    });
    
    // Count by affiliate ID
    const countByAffId = new Map();
    txWithAffiliate.forEach(tx => {
      const meta = tx.metadata || {};
      const affId = meta.affiliateId || meta.affiliate_id || meta.sejoliAffiliateId;
      if (affId && affId !== '0' && affId !== 0) {
        const count = countByAffId.get(String(affId)) || 0;
        countByAffId.set(String(affId), count + 1);
      }
    });
    
    // Sort by count
    const sorted = [...countByAffId.entries()].sort((a, b) => b[1] - a[1]);
    
    console.log('Top 20 affiliates by transaction count:\n');
    
    // Create Sejoli map
    const sejoliAffMap = new Map();
    sejoliData.affiliates.forEach(a => sejoliAffMap.set(String(a.ID), a));
    
    // Get database users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    const userByEmail = new Map();
    users.forEach(u => {
      if (u.email) userByEmail.set(u.email.toLowerCase(), u);
    });
    
    // Get existing profiles
    const profiles = await prisma.affiliateProfile.findMany({
      include: { user: { select: { email: true, name: true } } }
    });
    const profileByEmail = new Map();
    profiles.forEach(p => {
      if (p.user?.email) profileByEmail.set(p.user.email.toLowerCase(), p);
    });
    
    for (const [affId, count] of sorted.slice(0, 20)) {
      const sejoliAff = sejoliAffMap.get(affId);
      const email = sejoliAff?.user_email?.toLowerCase();
      const user = email ? userByEmail.get(email) : null;
      const profile = email ? profileByEmail.get(email) : null;
      
      console.log(`Sejoli ID: ${affId}`);
      console.log(`  Transactions: ${count}`);
      console.log(`  Name: ${sejoliAff?.display_name || 'N/A'}`);
      console.log(`  Email: ${sejoliAff?.user_email || 'N/A'}`);
      console.log(`  User in DB: ${user ? 'YES' : 'NO'}`);
      console.log(`  Profile exists: ${profile ? 'YES' : 'NO'}`);
      console.log('');
    }
    
    // Check specific case
    console.log('\n--- CHECKING TOP AFFILIATE ID 53 ---');
    const aff53 = sejoliAffMap.get('53');
    console.log('Sejoli data:', aff53);
    
    if (aff53?.user_email) {
      const userCheck = await prisma.user.findFirst({
        where: { email: { equals: aff53.user_email, mode: 'insensitive' } }
      });
      console.log('User search result:', userCheck);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAffiliates();
