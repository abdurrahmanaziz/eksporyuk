const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testEmailWithLogo() {
  try {
    console.log('🧪 Testing email template with logo...\n')
    
    // Import the sendBrandedEmail function
    const { sendBrandedEmail } = require('./src/lib/email-template-helper.ts')
    
    // Send test email
    const result = await sendBrandedEmail(
      'test@example.com', // Change to your real email
      'monthly-newsletter',
      {
        userName: 'John Doe (Test)',
        monthYear: 'Desember 2024',
        monthlyHighlights: '• Fitur branded templates sudah live\n• Logo email sudah tampil\n• HTML wrapper otomatis',
        newCourses: '• Kursus Ekspor 101\n• Kursus Digital Marketing',
        exportTips: 'Gunakan email templates untuk komunikasi profesional',
        successStory: 'Member kami berhasil ekspor ke 10 negara!',
        upcomingEvents: '• Webinar Ekspor - 30 Desember\n• Workshop Marketing - 5 Januari',
        specialAnnouncement: 'Promo akhir tahun - diskon 50%!'
      }
    )
    
    console.log('\n✅ Email sent!')
    console.log('Result:', result)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testEmailWithLogo()
