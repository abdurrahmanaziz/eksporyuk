const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testNotificationFlow() {
  console.log('🧪 Testing Transaction Notification System\n')
  console.log('='.repeat(80))
  
  // Find 1 pending transaction untuk testing
  const pendingTx = await prisma.transaction.findFirst({
    where: { status: 'PENDING' },
    include: {
      user: true,
      membership: { include: { membership: true } },
      product: true,
      course: true
    }
  })
  
  if (!pendingTx) {
    console.log('\n❌ No pending transaction found for testing')
    console.log('   Create a pending transaction first\n')
    await prisma.$disconnect()
    return
  }
  
  console.log('\n✅ Found Pending Transaction for Test:')
  console.log(`   ID: ${pendingTx.id}`)
  console.log(`   User: ${pendingTx.user.name} (${pendingTx.user.email})`)
  console.log(`   Amount: Rp ${Number(pendingTx.amount).toLocaleString('id-ID')}`)
  console.log(`   Type: ${pendingTx.type}`)
  
  let itemName = ''
  if (pendingTx.membership?.membership) {
    itemName = pendingTx.membership.membership.name
  } else if (pendingTx.product) {
    itemName = pendingTx.product.name
  } else if (pendingTx.course) {
    itemName = pendingTx.course.title
  }
  console.log(`   Item: ${itemName}`)
  
  console.log('\n' + '='.repeat(80))
  console.log('\n📋 MANUAL TEST INSTRUCTIONS:\n')
  console.log('1. Open browser and login as ADMIN')
  console.log('2. Go to: http://localhost:3000/admin/sales')
  console.log('3. Find transaction from:', pendingTx.user.email)
  console.log('4. Select the transaction checkbox')
  console.log('5. Test status changes:\n')
  console.log('   a) Click "Konfirmasi" (SUCCESS) → Check:')
  console.log('      - Email received (transaction-success template)')
  console.log('      - In-app notification appears')
  console.log('      - Pusher real-time update (refresh page)')
  console.log('      - OneSignal push notification (if configured)')
  console.log('      - WhatsApp message (if phone exists)\n')
  console.log('   b) Click "Batalkan" (FAILED) → Check:')
  console.log('      - Email received (transaction-failed template)')
  console.log('      - Xendit invoice expired (check Xendit dashboard)')
  console.log('      - All notifications sent\n')
  console.log('   c) Click "Pending" → Check:')
  console.log('      - Email received (transaction-pending template)')
  console.log('      - All notifications sent\n')
  
  console.log('='.repeat(80))
  console.log('\n🔍 Check Email Templates:')
  
  const templates = await prisma.brandedTemplate.findMany({
    where: { 
      slug: { in: ['transaction-success', 'transaction-pending', 'transaction-failed'] } 
    },
    select: { slug: true, name: true, isActive: true }
  })
  
  templates.forEach(t => {
    console.log(`   ${t.isActive ? '✅' : '❌'} ${t.slug} - ${t.name}`)
  })
  
  console.log('\n='.repeat(80))
  console.log('\n💡 EXPECTED BEHAVIOR:\n')
  console.log('SUCCESS Action:')
  console.log('  ✅ Transaction status → SUCCESS')
  console.log('  ✅ UserMembership activated (if membership)')
  console.log('  ✅ CourseEnrollment created (if course)')
  console.log('  ✅ UserProduct created (if product)')
  console.log('  ✅ Email sent using transaction-success template')
  console.log('  ✅ In-app notification created')
  console.log('  ✅ Pusher event: user-{userId} / transaction-update')
  console.log('  ✅ OneSignal push sent')
  console.log('  ✅ WhatsApp sent (if phone exists)\n')
  
  console.log('FAILED Action:')
  console.log('  ✅ Transaction status → FAILED')
  console.log('  ✅ Xendit invoice expired (if externalId exists)')
  console.log('  ✅ Email sent using transaction-failed template')
  console.log('  ✅ All notifications sent\n')
  
  console.log('PENDING Action:')
  console.log('  ✅ Transaction status → PENDING')
  console.log('  ✅ Email sent using transaction-pending template')
  console.log('  ✅ All notifications sent\n')
  
  console.log('='.repeat(80))
  console.log('\n📊 Integration Status:\n')
  
  const integrations = await prisma.integrationConfig.findMany({
    where: { 
      service: { in: ['xendit', 'mailketing', 'onesignal', 'pusher', 'starsender'] } 
    },
    select: { service: true, isActive: true }
  })
  
  integrations.forEach(i => {
    console.log(`   ${i.isActive ? '✅' : '❌'} ${i.service.toUpperCase()}`)
  })
  
  console.log('\n' + '='.repeat(80))
  console.log('\n🚀 Ready to test! Start dev server and follow instructions above.\n')
  
  await prisma.$disconnect()
}

testNotificationFlow().catch(console.error)
