/**
 * Test Lead Magnet System
 * Run: node test-lead-magnet.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testLeadMagnetSystem() {
  console.log('🧪 Testing Lead Magnet System...\n')
  
  try {
    // Test 1: Check if LeadMagnet model exists
    console.log('✅ Test 1: LeadMagnet model exists')
    const leadMagnetCount = await prisma.leadMagnet.count()
    console.log(`   Found ${leadMagnetCount} lead magnets\n`)
    
    // Test 2: Create test lead magnet
    console.log('✅ Test 2: Creating test lead magnet...')
    const testLeadMagnet = await prisma.leadMagnet.create({
      data: {
        title: 'Test Ebook - Panduan Export',
        description: 'Panduan lengkap export untuk pemula',
        type: 'PDF',
        fileUrl: 'https://example.com/ebook.pdf',
        thumbnailUrl: 'https://example.com/cover.jpg',
        isActive: true,
        createdBy: 'test-admin'
      }
    })
    console.log(`   Created: ${testLeadMagnet.title} (ID: ${testLeadMagnet.id})\n`)
    
    // Test 3: Fetch all lead magnets
    console.log('✅ Test 3: Fetching all lead magnets...')
    const allLeadMagnets = await prisma.leadMagnet.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { optinForms: true }
        }
      }
    })
    console.log(`   Total: ${allLeadMagnets.length}`)
    allLeadMagnets.forEach(lm => {
      console.log(`   - ${lm.title} (${lm.type}) - Used by ${lm._count.optinForms} forms`)
    })
    console.log('')
    
    // Test 4: Update lead magnet
    console.log('✅ Test 4: Updating lead magnet...')
    const updated = await prisma.leadMagnet.update({
      where: { id: testLeadMagnet.id },
      data: {
        description: 'Updated description - Panduan export terbaru'
      }
    })
    console.log(`   Updated description: ${updated.description}\n`)
    
    // Test 5: Check optin form with lead magnet
    console.log('✅ Test 5: Checking optin forms with lead magnets...')
    const formsWithLeadMagnet = await prisma.affiliateOptinForm.findMany({
      where: {
        leadMagnetId: { not: null }
      },
      include: {
        leadMagnet: true
      },
      take: 5
    })
    console.log(`   Forms with lead magnets: ${formsWithLeadMagnet.length}`)
    formsWithLeadMagnet.forEach(form => {
      console.log(`   - ${form.formName}: ${form.leadMagnet?.title} (${form.leadMagnet?.type})`)
    })
    console.log('')
    
    // Test 6: Fetch active lead magnets only
    console.log('✅ Test 6: Fetching active lead magnets only...')
    const activeLeadMagnets = await prisma.leadMagnet.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`   Active lead magnets: ${activeLeadMagnets.length}\n`)
    
    // Test 7: Delete test lead magnet
    console.log('✅ Test 7: Deleting test lead magnet...')
    await prisma.leadMagnet.delete({
      where: { id: testLeadMagnet.id }
    })
    console.log(`   Deleted: ${testLeadMagnet.title}\n`)
    
    console.log('🎉 All tests passed!\n')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testLeadMagnetSystem()
