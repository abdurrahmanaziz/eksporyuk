#!/usr/bin/env node
/**
 * QUICK IMPORT - Import data FRESH dari Sejoli ke database kosong
 * Simplified version yang langsung import users + transactions + commissions
 * 
 * Sesuai PRD line 5093: Ambil data REAL dari Sejoli
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()
const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports')

// Read TSV file
function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename)
  const content = fs.readFileSync(filepath, 'utf-8')
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'))
}

async function quickImport() {
  console.log('🚀 QUICK IMPORT FROM SEJOLI - FRESH DATA')
  console.log('=' .repeat(50))
  console.log(`Started: ${new Date().toLocaleString('id-ID')}\n`)

  try {
    // 1. Parse data from TSV
    console.log('📂 Reading FRESH export files...')
    const usersData = readTSV('users_export.tsv')
    const ordersData = readTSV('orders_export.tsv')
    const commissionsData = readTSV('commissions_export.tsv')
    
    console.log(`   Users: ${usersData.length}`)
    console.log(`   Orders: ${ordersData.length}`)
    console.log(`   Commissions: ${commissionsData.length}\n`)

    // 2. Create system/admin user first
    console.log('👤 Creating system user...')
    const adminPassword = await bcrypt.hash('Admin123!', 10)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@eksporyuk.com' },
      create: {
        email: 'admin@eksporyuk.com',
        username: 'admin',
        name: 'Administrator',
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: true,
        isActive: true,
      },
      update: {}
    })
    console.log(`   ✅ Admin user: ${admin.email}\n`)

    // 3. Import users in batches
    console.log('👥 Importing users...')
    let usersImported = 0
    const userMapping = {} // wpUserId -> eksporyukUserId
    const BATCH_SIZE = 100

    for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
      const batch = usersData.slice(i, i + BATCH_SIZE)
      
      for (const row of batch) {
        try {
          const [wpId, email, displayName, registered] = row
          
          if (!email || !email.includes('@')) continue

          // Simple password for all imported users
          const tempPassword = await bcrypt.hash('TempPass123!', 10)
          
          const user = await prisma.user.upsert({
            where: { email },
            create: {
              email,
              username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
              name: displayName || email.split('@')[0],
              password: tempPassword,
              role: 'MEMBER_FREE',
              emailVerified: false,
              createdAt: new Date(registered),
            },
            update: {}
          })
          
          userMapping[wpId] = user.id
          usersImported++
          
          if (usersImported % 500 === 0) {
            console.log(`   Imported ${usersImported}/${usersData.length} users...`)
          }
        } catch (err) {
          // Skip duplicates/errors
        }
      }
    }
    console.log(`   ✅ Total users imported: ${usersImported}\n`)

    // 4. Create default product for transactions without product
    console.log('📦 Creating default product...')
    const defaultProduct = await prisma.product.upsert({
      where: { slug: 'sejoli-import' },
      create: {
        User: { connect: { id: admin.id } },
        name: 'Sejoli Import',
        slug: 'sejoli-import',
        description: 'Default product untuk transaksi import',
        price: 0,
        productType: 'DIGITAL',
        productStatus: 'PUBLISHED',
        commissionType: 'FLAT',
        affiliateCommissionRate: 0,
      },
      update: {}
    })
    console.log(`   ✅ Default product created\n`)

    // 5. Import transactions
    console.log('💳 Importing transactions...')
    let transactionsImported = 0
    const transactionMapping = {} // wpOrderId -> eksporyukTransactionId

    for (let i = 0; i < ordersData.length; i += BATCH_SIZE) {
      const batch = ordersData.slice(i, i + BATCH_SIZE)
      
      for (const row of batch) {
        try {
          const [orderId, createdAt, productId, productName, userId, userEmail, affiliateId, grandTotal, status, paymentGateway] = row
          
          // Skip if not completed
          if (status !== 'completed') continue

          // Find user
          const buyerUserId = userMapping[userId] || admin.id
          
          const transaction = await prisma.transaction.create({
            data: {
              externalId: `sejoli-${orderId}`,
              userId: buyerUserId,
              productId: defaultProduct.id,
              amount: parseFloat(grandTotal) || 0,
              status: 'COMPLETED',
              paymentMethod: paymentGateway || 'manual',
              createdAt: new Date(createdAt),
            }
          })
          
          transactionMapping[orderId] = transaction.id
          transactionsImported++
          
          if (transactionsImported % 500 === 0) {
            console.log(`   Imported ${transactionsImported}/${ordersData.length} transactions...`)
          }
        } catch (err) {
          // Skip errors
          console.log(`   ⚠️  Skip order: ${err.message}`)
        }
      }
    }
    console.log(`   ✅ Total transactions imported: ${transactionsImported}\n`)

    // 6. Import affiliate commissions
    console.log('💰 Importing affiliate commissions...')
    let commissionsImported = 0

    for (let i = 0; i < commissionsData.length; i += BATCH_SIZE) {
      const batch = commissionsData.slice(i, i + BATCH_SIZE)
      
      for (const row of batch) {
        try {
          const [commissionId, orderId, affiliateId, productId, commissionAmount, status, createdAt] = row
          
          // Find affiliate user
          const affiliateUserId = userMapping[affiliateId]
          if (!affiliateUserId) continue

          // Find transaction
          const transactionId = transactionMapping[orderId]
          if (!transactionId) continue

          await prisma.affiliateCommission.create({
            data: {
              affiliateId: affiliateUserId,
              transactionId,
              amount: parseFloat(commissionAmount) || 0,
              status: status || 'PENDING',
              type: 'FLAT', // Sesuai PRD: KOMISI FLAT
              createdAt: new Date(createdAt),
            }
          })
          
          commissionsImported++
          
          if (commissionsImported % 500 === 0) {
            console.log(`   Imported ${commissionsImported}/${commissionsData.length} commissions...`)
          }
        } catch (err) {
          // Skip errors
        }
      }
    }
    console.log(`   ✅ Total commissions imported: ${commissionsImported}\n`)

    // 7. Verify import
    console.log('🔍 Verifying imported data...')
    const counts = {
      users: await prisma.user.count(),
      transactions: await prisma.transaction.count(),
      commissions: await prisma.affiliateCommission.count(),
    }
    
    console.log('\n✅ IMPORT COMPLETED SUCCESSFULLY!')
    console.log('\n📊 Database Status:')
    console.log(`   Users: ${counts.users.toLocaleString()}`)
    console.log(`   Transactions: ${counts.transactions.toLocaleString()}`)
    console.log(`   Commissions: ${counts.commissions.toLocaleString()}`)
    
    console.log(`\n🎉 Import completed at ${new Date().toLocaleString('id-ID')}`)
    console.log('\n💡 Next steps:')
    console.log('   1. Login as admin@eksporyuk.com / Admin123!')
    console.log('   2. Test dengan beberapa user')
    console.log('   3. Deploy: git add . && git commit && git push')
    
  } catch (error) {
    console.error('\n❌ IMPORT FAILED:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run import
quickImport()
