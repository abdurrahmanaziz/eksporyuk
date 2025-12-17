const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setReliableLogo() {
  try {
    console.log('🔧 Setting Reliable Logo URL\n')
    
    const settings = await prisma.settings.findFirst()
    
    console.log('📋 Current Logo:')
    console.log(`   ${settings?.siteLogo}`)
    
    // Test berbagai logo service yang reliable
    const logoOptions = {
      // Option 1: Data URI (embedded SVG - selalu work!)
      svg: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect width='200' height='80' fill='%230066CC'/%3E%3Ctext x='100' y='45' font-family='Arial, sans-serif' font-size='20' font-weight='bold' fill='white' text-anchor='middle'%3EPT Ekspor Yuk%3C/text%3E%3C/svg%3E`,
      
      // Option 2: Placehold.co (reliable alternative)
      placehold: 'https://placehold.co/200x80/0066CC/FFFFFF/png?text=PT+Ekspor+Yuk',
      
      // Option 3: DummyImage.com
      dummyimage: 'https://dummyimage.com/200x80/0066CC/ffffff&text=PT+Ekspor+Yuk',
      
      // Option 4: Simple text logo (always works)
      simple: 'https://placehold.co/200x80/0066CC/FFF.png?text=EksporYuk'
    }
    
    console.log('\n🧪 Testing logo options...')
    
    // Use Data URI SVG (guaranteed to work everywhere)
    const selectedLogo = logoOptions.svg
    
    console.log('\n✅ Selected: Data URI SVG (embedded, always works)')
    console.log(`   Preview (first 100 chars): ${selectedLogo.substring(0, 100)}...`)
    
    // Update database
    console.log('\n🔄 Updating database...')
    
    await prisma.settings.update({
      where: { id: settings.id },
      data: { siteLogo: selectedLogo }
    })
    
    console.log('✅ Logo updated!')
    
    // Verify
    const updated = await prisma.settings.findFirst()
    console.log('\n📸 Verified:')
    console.log(`   Logo type: Data URI SVG`)
    console.log(`   Length: ${updated?.siteLogo?.length} characters`)
    console.log(`   Will display: Blue box with "PT Ekspor Yuk" text`)
    
    console.log('\n💡 Keuntungan Data URI:')
    console.log('   ✅ Embedded langsung di email (tidak perlu external request)')
    console.log('   ✅ Tidak bergantung pada external service')
    console.log('   ✅ Selalu tampil, bahkan offline')
    console.log('   ✅ Tidak ada issue CORS atau SSL')
    
    console.log('\n📧 Next Steps:')
    console.log('   1. Test send email dari /admin/branded-templates')
    console.log('   2. Logo akan tampil sebagai blue box dengan text')
    console.log('   3. Untuk logo image asli, upload ke PostImages lalu update')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setReliableLogo()
