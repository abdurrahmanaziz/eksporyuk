const fs = require('fs');

// Parse files
const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8').trim().split('\n').slice(1);
const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8').trim().split('\n').slice(1);
const commissionsRaw = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8').trim().split('\n').slice(1);

// Load local user emails (exported earlier as missing-emails.txt are the MISSING ones)
// We need to find completed orders from users NOT in local DB

// Load sejoli users
const sejoliUserById = {};
usersRaw.forEach(line => {
  const p = line.split('\t');
  sejoliUserById[p[0]] = { id: p[0], email: p[2]?.toLowerCase().trim(), name: p[3], login: p[1] };
});

// Load commission lookup
const commissionByOrder = {};
commissionsRaw.forEach(line => {
  const p = line.split('\t');
  if (p[4] === 'added') {
    commissionByOrder[p[0]] = { affId: p[1], commission: parseFloat(p[3]) || 0 };
  }
});

// Load missing emails
const missingEmails = new Set(fs.readFileSync('missing-emails.txt', 'utf-8').trim().split('\n').filter(Boolean));

console.log(`Missing emails: ${missingEmails.size}`);

// Find completed orders from missing users
let missingCompletedOrders = [];
let missingOmset = 0;
let missingKomisi = 0;

ordersRaw.forEach(line => {
  const p = line.split('\t');
  if (p.length < 10) return;
  
  const orderId = p[0];
  const userId = p[2];
  const grandTotal = parseFloat(p[6]) || 0;
  const status = p[7];
  
  const sejoliUser = sejoliUserById[userId];
  if (!sejoliUser?.email) return;
  
  if (missingEmails.has(sejoliUser.email) && status === 'completed') {
    const comm = commissionByOrder[orderId];
    missingCompletedOrders.push({
      orderId,
      userId,
      email: sejoliUser.email,
      name: sejoliUser.name,
      login: sejoliUser.login,
      grandTotal,
      commission: comm?.commission || 0
    });
    missingOmset += grandTotal;
    missingKomisi += comm?.commission || 0;
  }
});

console.log(`\nCompleted orders from missing users: ${missingCompletedOrders.length}`);
console.log(`Missing Omset: Rp ${missingOmset.toLocaleString('id-ID')}`);
console.log(`Missing Komisi: Rp ${missingKomisi.toLocaleString('id-ID')}`);

// Expected 
const expectedOmset = 4122334962;
const expectedKomisi = 1245421000;
const currentOmset = 3952858347;
const currentKomisi = 1192821000;

console.log(`\nExpected Gap Omset: Rp ${(expectedOmset - currentOmset).toLocaleString('id-ID')}`);
console.log(`Actual Missing Omset: Rp ${missingOmset.toLocaleString('id-ID')}`);
console.log(`Match: ${missingOmset === (expectedOmset - currentOmset) ? '✅' : '❌'}`);

// Extract unique users to create
const usersToCreate = [];
const seenEmails = new Set();

missingCompletedOrders.forEach(o => {
  if (!seenEmails.has(o.email)) {
    seenEmails.add(o.email);
    usersToCreate.push({
      email: o.email,
      name: o.name,
      login: o.login,
      sejoliUserId: o.userId
    });
  }
});

console.log(`\nUnique users to create: ${usersToCreate.length}`);

// Save users to create
fs.writeFileSync('users-to-create.json', JSON.stringify(usersToCreate, null, 2));
console.log(`Saved to users-to-create.json`);

// Sample
console.log('\nSample (first 10):');
usersToCreate.slice(0, 10).forEach((u, i) => {
  console.log(`${i+1}. ${u.email} - ${u.name}`);
});
