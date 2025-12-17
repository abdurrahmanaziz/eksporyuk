import { sendBrandedEmail } from './src/lib/branded-template-helpers.js'

async function testEmailSend() {
  console.log('🧪 Testing branded email send...\n')
  
  try {
    // Test send welcome email
    await sendBrandedEmail({
      templateSlug: 'welcome-email-new-member',
      recipientEmail: 'test@example.com',
      recipientName: 'Test User',
      data: {
        membershipLevel: 'Premium',
        joinDate: new Date().toLocaleDateString('id-ID'),
        dashboardLink: 'https://app.eksporyuk.com/dashboard'
      },
      userId: null
    })
    
    console.log('\n✅ Email sent successfully!')
    console.log('📧 Check test@example.com inbox')
    console.log('📝 Should include:')
    console.log('   - Logo from /admin/branded-templates settings')
    console.log('   - Footer with company info from settings')
    console.log('   - Proper branding and colors')
    
  } catch (error) {
    console.error('\n❌ Error sending email:', error)
  }
}

testEmailSend()
