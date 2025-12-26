#!/usr/bin/env node
/**
 * STEP 2: Import Transactions dari Sejoli (sesuai PRD)
 * - 1 transaksi = 1 produk
 * - Harga dari product.price
 * - Status completed
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importTransactions() {
  console.log('💳 STEP 2: Import Transactions dari Sejoli');
  console.log('='.repeat(50));
  
  // Cari atau buat admin
  const bcrypt = require('bcryptjs');
  const adminPass = await bcrypt.hash('Admin123!', 10);
  
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@eksporyuk.com',
        username: 'admineksporyuk',
        name: 'Administrator',
        password: adminPass,
        role: 'ADMIN',
        emailVerified: true,
      }
    });
  }
  
  let product = await prisma.product.findFirst({ where: { slug: 'kelas-ekspor-sejoli' } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        id: 'sejoli-product-001',
        name: 'Kelas Ekspor Sejoli',
        slug: 'kelas-ekspor-sejoli',
        description: 'Imported from Sejoli',
        price: 899000,
        productType: 'DIGITAL',
        productStatus: 'PUBLISHED',
        commissionType: 'FLAT',
        affiliateCommissionRate: 300000,
        updatedAt: new Date(),
        User: { connect: { id: admin.id } }
      }
    });
  }
  
  console.log('✅ Admin dan Product ready\n');
  
  // Baca orders
  const filepath = path.join(__dirname, 'scripts/sejoli-migration/exports/orders_export.tsv');
  const content = fs.readFileSync(filepath, 'utf-8');
  const rows = content.split('\n').filter(line => line.trim());
  
  const sejoliCount = rows.length - 1;
  console.log(`📂 Sejoli orders: ${sejoliCount}`);
  
  // Build email -> userId map
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailMap = new Map();
  users.forEach(u => emailMap.set(u.email.toLowerCase(), u.id));
  
  const orderIdSet = new Set();
  let imported = 0;
  let skipped = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split('\t');
    // orderId, createdAt, productId, productName, userId, userEmail, affiliateId, grandTotal, status, paymentMethod
    const [orderId, createdAt, , , , userEmail, , grandTotal, status] = cols;
    
    // Hanya completed
    if (status !== 'completed') {
      skipped++;
      continue;
    }
    
    // Cegah duplikat
    if (orderIdSet.has(orderId)) {
      skipped++;
      continue;
    }
    orderIdSet.add(orderId);
    
    // Cari userId dari email
    const userId = emailMap.get(userEmail?.toLowerCase()) || admin.id;
    
    let orderDate = new Date('2022-01-01');
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) orderDate = d;
    }
    
    try {
      await prisma.transaction.create({
        data: {
          id: `sejoli-tx-${orderId}`,
          externalId: `sejoli-${orderId}`,
          userId: userId,
          type: 'PRODUCT',
          productId: product.id,
          amount: parseFloat(grandTotal) || 0,
          status: 'SUCCESS',
          paymentMethod: 'sejoli_import',
          description: `Sejoli Order #${orderId}`,
          createdAt: orderDate,
          updatedAt: orderDate,
        }
      });
      imported++;
      
      if (imported % 1000 === 0) {
        console.log(`   ✅ ${imported}/${sejoliCount}...`);
      }
    } catch (e) {
      skipped++;
    }
  }
  
  const dbCount = await prisma.transaction.count();
  console.log(`\n✅ SELESAI!`);
  console.log(`   Sejoli orders (completed): ${imported}`);
  console.log(`   Skipped (non-completed/duplikat): ${skipped}`);
  console.log(`   Di DB: ${dbCount}`);
  
  await prisma.$disconnect();
}

importTransactions();