const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMissing() {
  // Get existing tx
  const existing = await prisma.transaction.findMany({
    select: { metadata: true }
  });
  
  const existingIds = new Set(
    existing.map(tx => String(tx.metadata?.sejoliOrderId)).filter(id => id && id !== 'undefined')
  );
  
  console.log('Existing sejoliOrderIds:', existingIds.size);
  
  // Load TSV
  const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8');
  const orderLines = ordersRaw.split('\n').slice(1).filter(l => l.trim());
  
  // Find missing
  const missing = [];
  for (const line of orderLines) {
    const parts = line.split('\t');
    const orderId = parts[0];
    
    if (!existingIds.has(orderId)) {
      const status = parts[7]?.trim();
      const date = parts[8]?.trim();
      missing.push({ orderId, status, date });
    }
  }
  
  console.log('Missing orders:', missing.length);
  console.log('\nBy status:');
  
  const byStatus = {};
  for (const m of missing) {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
  }
  
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log('  ', status, ':', count);
  });
  
  // Show December missing
  const decMissing = missing.filter(m => m.date?.startsWith('2025-12'));
  console.log('\nDecember missing:', decMissing.length);
  
  const decCompleted = decMissing.filter(m => m.status === 'completed');
  console.log('December COMPLETED missing:', decCompleted.length);
  
  console.log('\nFirst 10 December completed:');
  decCompleted.slice(0, 10).forEach(m => {
    console.log('  Order', m.orderId, '-', m.date);
  });
  
  await prisma.$disconnect();
}

checkMissing();
