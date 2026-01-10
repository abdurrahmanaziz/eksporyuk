const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Read the CSV file
const csvPath = '/Users/abdurrahmanaziz/Downloads/export-orders-EKSPOR-YUK-2025-12-10-05-53-49.csv';
const content = fs.readFileSync(csvPath, 'utf8');

const records = parse(content, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log('=== CSV ANALYSIS ===\n');
console.log('Total rows:', records.length);
console.log('\nColumns:', Object.keys(records[0]).join(', '));

// Analyze affiliates
const affiliates = new Map();
let selfReferralCount = 0;
let noAffiliateCount = 0;

records.forEach(row => {
  // Note: CSV columns are swapped - affiliate has ID, affiliate_id has name
  const affId = row.affiliate; // This actually contains the WP user ID
  const affName = row.affiliate_id; // This actually contains the name
  const customerName = row.name;
  const price = parseFloat(row.price) || 0;
  
  if (!affName || affId === '0') {
    noAffiliateCount++;
    return;
  }
  
  // Check self-referral
  if (customerName?.toLowerCase().trim() === affName?.toLowerCase().trim()) {
    selfReferralCount++;
    console.log(`⚠️  Self-referral: ${customerName} bought with affiliate ${affName}`);
    return;
  }
  
  if (!affiliates.has(affName)) {
    affiliates.set(affName, { id: affId, count: 0, revenue: 0 });
  }
  affiliates.get(affName).count++;
  affiliates.get(affName).revenue += price;
});

console.log('\n=== SUMMARY ===');
console.log('Total orders:', records.length);
console.log('With affiliate:', records.length - noAffiliateCount);
console.log('No affiliate:', noAffiliateCount);
console.log('Self-referral (akan di-skip):', selfReferralCount);

console.log('\n=== TOP 15 AFFILIATES FROM CSV ===');
const sorted = [...affiliates.entries()].sort((a, b) => b[1].count - a[1].count);
sorted.slice(0, 15).forEach(([name, data], i) => {
  const commission = Math.round(data.revenue * 0.30);
  console.log(`${i + 1}. ${name}`);
  console.log(`   ID: ${data.id} | Orders: ${data.count} | Revenue: Rp ${data.revenue.toLocaleString('id-ID')} | Commission (30%): Rp ${commission.toLocaleString('id-ID')}`);
});

console.log('\n=== CHECKING AGAINST DATABASE ===');

// Now check if these affiliates exist in our database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAffiliates() {
  for (const [name, data] of sorted.slice(0, 15)) {
    const user = await prisma.user.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' }
      },
      include: { affiliateProfile: true }
    });
    
    if (user) {
      const hasProfile = user.affiliateProfile ? '✅ Has affiliate profile' : '❌ NO affiliate profile';
      const earnings = user.affiliateProfile?.totalEarnings || 0;
      console.log(`${name}: User found (${user.email}) - ${hasProfile} - Stored: Rp ${earnings.toLocaleString('id-ID')}`);
    } else {
      console.log(`${name}: ❌ User NOT FOUND`);
    }
  }
  
  await prisma.$disconnect();
}

checkAffiliates();
