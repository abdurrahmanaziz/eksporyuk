const fs = require('fs');

// Load data
const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);
const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);
const commissionsRaw = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);

// Parse users
const sejoliUsers = new Map();
usersRaw.forEach(line => {
  const [id, login, email, name] = line.split('\t');
  sejoliUsers.set(id, { id, login, email, name });
});

// Parse commissions
const commissions = new Map();
commissionsRaw.forEach(line => {
  const [orderId, affId, commission, status] = line.split('\t');
  if (status === 'added') {
    commissions.set(orderId, { affId, commission: parseInt(commission) });
  }
});

// Parse orders and find skipped
let skippedOrders = [];
let skippedOmset = 0;
let skippedKomisi = 0;

ordersRaw.forEach(line => {
  const parts = line.split('\t');
  const orderId = parts[0];
  const userId = parts[2];
  const grandTotal = parseInt(parts[4]) || 0;
  const status = parts[5];
  
  // Check if user exists in sejoli_users
  if (!sejoliUsers.has(userId)) {
    const comm = commissions.get(orderId);
    skippedOrders.push({
      orderId,
      userId,
      grandTotal,
      status,
      commission: comm?.commission || 0
    });
    if (status === 'completed') {
      skippedOmset += grandTotal;
      skippedKomisi += comm?.commission || 0;
    }
  }
});

console.log('📊 ANALISIS ORDERS YANG DI-SKIP:');
console.log('═'.repeat(60));
console.log(`Total Orders Skipped: ${skippedOrders.length}`);
console.log(`Completed yang di-skip: ${skippedOrders.filter(o => o.status === 'completed').length}`);
console.log(`Skipped Omset: Rp ${skippedOmset.toLocaleString('id-ID')}`);
console.log(`Skipped Komisi: Rp ${skippedKomisi.toLocaleString('id-ID')}`);
console.log('');

// Expected total = Screenshot values
const expectedOmset = 4122334962;
const expectedKomisi = 1245421000;

console.log('📈 VERIFIKASI:');
console.log(`Omset Expected: Rp ${expectedOmset.toLocaleString('id-ID')}`);
console.log(`Omset Imported: Rp ${(expectedOmset - skippedOmset).toLocaleString('id-ID')}`);
console.log(`Omset Skipped: Rp ${skippedOmset.toLocaleString('id-ID')}`);
console.log('');

// Sample of skipped orders
console.log('📋 Sample Orders yang di-skip (10 pertama):');
skippedOrders.slice(0, 10).forEach((o, i) => {
  console.log(`${i+1}. Order #${o.orderId}: User ID ${o.userId}, Status: ${o.status}, Amount: Rp ${o.grandTotal.toLocaleString('id-ID')}`);
});
console.log('');

// Find unique missing user IDs
const missingUserIds = [...new Set(skippedOrders.map(o => o.userId))];
console.log(`Unique Missing User IDs: ${missingUserIds.length}`);
console.log(`Missing User IDs: ${missingUserIds.slice(0, 20).join(', ')}${missingUserIds.length > 20 ? '...' : ''}`);
