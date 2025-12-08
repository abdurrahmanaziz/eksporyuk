const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 FIXING PRO MEMBERSHIP...\n')
  
  // Update Pro membership to be a general checkout page (no specific pricing)
  const updated = await prisma.membership.update({
    where: { slug: 'pro' },
    data: {
      features: [], // Empty array = show all membership options
      price: 0, // No specific price
      originalPrice: 0,
      discount: 0,
      duration: 'LIFETIME', // Keep duration for reference
      description: 'Pilih paket membership yang sesuai dengan kebutuhan Anda'
    }
  })
  
  console.log('✅ Pro Membership updated successfully!')
  console.log(JSON.stringify(updated, null, 2))
  
  console.log('\n📋 Changes:')
  console.log('- features: null → []')
  console.log('- price: 1998000 → 0')
  console.log('- originalPrice: 1074000 → 0')
  console.log('- discount: 35 → 0')
  console.log('- description: Updated')
  
  console.log('\n✅ Now /checkout/pro will show all membership options!')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
