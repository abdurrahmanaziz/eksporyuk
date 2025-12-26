#!/usr/bin/env node
/**
 * SUPER FAST IMPORT - Batch insert dengan createMany
 * Import 18K users dalam hitungan menit bukan jam
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()
const EXPORTS_DIR = path.join(__dirname, 'scripts/sejoli-migration/exports')

function readTSV(filename) {
  const filepath = path.join(EXPORTS_DIR, filename)
  const content = fs.readFileSync(filepath, 'utf-8')
  return content.split('\n').filter(line => line.trim()).map(line => line.split('\t'))
}

async function superFastImport() {
  console.log('⚡ SUPER FAST IMPORT FROM SEJOLI')
  console.log('=' .repeat(50))
  
  const startTime = Date.now()

  try {
    // Parse data
    console.log('📂 Reading TSV files...')
    const usersData = readTSV('users_export.tsv').slice(1) // Skip header
    const ordersData = readTSV('orders_export.tsv').slice(1)
    const commissionsData = readTSV('commissions_export.tsv').slice(1)
    
    console.log(`   ${usersData.length} users, ${ordersData.length} orders, ${commissionsData.length} commissions\n`)

    // 1. Batch create admin user
    console.log('👤 Creating admin...')
    const adminHash = await bcrypt.hash('Admin123!', 10)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@eksporyuk.com' },
      create: {
        email: 'admin@eksporyuk.com',
        username: 'admin',
        name: 'Administrator',
        password: adminHash,
        role: 'ADMIN',
        emailVerified: true,
      },
      update: {}
    })
    console.log('   ✅ Admin created\n')

    // 2. SUPER FAST: Create users with createMany
    console.log('👥 Batch importing users...')
    const tempPassword = await bcrypt.hash('TempPass123!', 10)
    
    const userBatches = []
    const BATCH_SIZE = 1000
    
    for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
      const batch = usersData.slice(i, i + BATCH_SIZE)
      const userBatch = []
      
      for (const [wpId, email, displayName, registered] of batch) {
        if (!email || !email.includes('@')) continue
        
        // Validasi dan normalize tanggal
        let createdAt = new Date('2022-01-01')
        if (registered && registered.trim()) {
          const testDate = new Date(registered)
          if (!isNaN(testDate.getTime())) {
            createdAt = testDate
          }
        }
        
        userBatch.push({
          email,
          username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50),
          name: (displayName || email.split('@')[0]).substring(0, 100),
          password: tempPassword,
          role: 'MEMBER_FREE',
          emailVerified: false,
          createdAt: createdAt,
        })
      }
      
      if (userBatch.length > 0) {
        await prisma.user.createMany({
          data: userBatch,
          skipDuplicates: true
        })
        console.log(`   ✅ Batch ${i/BATCH_SIZE + 1}: ${userBatch.length} users imported`)
      }
    }

    const userCount = await prisma.user.count()
    console.log(`   ✅ Total users: ${userCount}\n`)

    // 3. Create default product
    console.log('📦 Creating default product...')
    const product = await prisma.product.upsert({
      where: { id: 'sejoli-default-product' },
      create: {
        id: 'sejoli-default-product',
        creatorId: admin.id,
        name: 'Sejoli Import Product',
        slug: 'sejoli-import',
        description: 'Default product for imported transactions',
        price: 899000,
        productType: 'DIGITAL',
        productStatus: 'PUBLISHED',
        commissionType: 'FLAT',
        affiliateCommissionRate: 300000,
        updatedAt: new Date(),
      },
      update: {}
    })
    console.log('   ✅ Product created\n')

    // 4. SKIP Batch import transactions FOR NOW
    console.log('💳 Skipping transactions for now...\n')

    // 5. Final status
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2)
    
    console.log('🎉 IMPORT COMPLETED!')
    console.log(`   Duration: ${duration} minutes`)
    console.log(`   Speed: ${Math.round(userCount / duration)} users/minute\n`)

    console.log('💡 Next steps:')
    console.log('   1. Login: admin@eksporyuk.com / Admin123!')
    console.log('   2. Test beberapa user')
    console.log('   3. Deploy: git add . && git commit && git push')
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

superFastImport()