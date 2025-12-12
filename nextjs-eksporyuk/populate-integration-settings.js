const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function populateIntegrationSettings() {
  console.log('\n🔧 POPULATING INTEGRATION SETTINGS TO DATABASE\n')
  
  const settings = [
    // Mailketing (Email)
    { key: 'MAILKETING_API_KEY', value: '', description: 'Mailketing API Key untuk email service' },
    { key: 'MAILKETING_SENDER_EMAIL', value: 'noreply@eksporyuk.com', description: 'Email pengirim default' },
    { key: 'MAILKETING_SENDER_NAME', value: 'EksporYuk', description: 'Nama pengirim default' },
    { key: 'MAILKETING_REPLY_TO_EMAIL', value: 'support@eksporyuk.com', description: 'Email untuk balasan' },
    { key: 'MAILKETING_FORWARD_EMAIL', value: 'admin@eksporyuk.com', description: 'Email CC admin' },
    
    // Xendit (Payment)
    { key: 'XENDIT_SECRET_KEY', value: '', description: 'Xendit Secret Key untuk payment gateway' },
    { key: 'XENDIT_WEBHOOK_TOKEN', value: '', description: 'Token untuk validasi webhook dari Xendit' },
    { key: 'XENDIT_ENVIRONMENT', value: 'development', description: 'Environment: development atau production' },
    { key: 'XENDIT_VA_COMPANY_CODE', value: '88088', description: 'Company code untuk Virtual Account' },
    
    // StarSender (WhatsApp)
    { key: 'STARSENDER_API_KEY', value: '', description: 'StarSender API Key' },
    { key: 'STARSENDER_DEVICE_ID', value: '', description: 'StarSender Device ID' },
    
    // OneSignal (Push Notifications)
    { key: 'ONESIGNAL_APP_ID', value: '', description: 'OneSignal App ID' },
    { key: 'ONESIGNAL_API_KEY', value: '', description: 'OneSignal REST API Key' },
    
    // Pusher (Real-time)
    { key: 'PUSHER_APP_ID', value: '', description: 'Pusher App ID' },
    { key: 'PUSHER_KEY', value: '', description: 'Pusher Key' },
    { key: 'PUSHER_SECRET', value: '', description: 'Pusher Secret' },
    { key: 'PUSHER_CLUSTER', value: 'ap1', description: 'Pusher Cluster Region' },
    
    // Google OAuth
    { key: 'GOOGLE_CLIENT_ID', value: '', description: 'Google OAuth Client ID' },
    { key: 'GOOGLE_CLIENT_SECRET', value: '', description: 'Google OAuth Client Secret' },
    
    // Giphy
    { key: 'GIPHY_API_KEY', value: '', description: 'Giphy API Key untuk GIF search' },
  ]
  
  let created = 0
  let updated = 0
  let skipped = 0
  
  for (const setting of settings) {
    try {
      const existing = await prisma.setting.findUnique({
        where: { key: setting.key }
      })
      
      if (existing) {
        if (existing.value && existing.value !== '') {
          console.log(`⏭️  ${setting.key}: Already has value, skipping`)
          skipped++
        } else {
          await prisma.setting.update({
            where: { key: setting.key },
            data: { 
              value: setting.value,
              description: setting.description,
              type: 'INTEGRATION'
            }
          })
          console.log(`✅ ${setting.key}: Updated with default value`)
          updated++
        }
      } else {
        await prisma.setting.create({
          data: {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            type: 'INTEGRATION',
            category: getCategoryFromKey(setting.key)
          }
        })
        console.log(`✨ ${setting.key}: Created with default value`)
        created++
      }
    } catch (error) {
      console.error(`❌ ${setting.key}: Failed - ${error.message}`)
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`   Created: ${created}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${settings.length}`)
  
  console.log('\n⚠️  IMPORTANT - Set API Keys:')
  console.log('   Visit: http://localhost:3000/admin/integrations')
  console.log('   Configure API keys for services you want to use')
  console.log('')
  console.log('   Priority for forgot password:')
  console.log('   - MAILKETING_API_KEY (Required for email sending)')
  
  await prisma.$disconnect()
}

function getCategoryFromKey(key) {
  if (key.startsWith('MAILKETING')) return 'EMAIL'
  if (key.startsWith('XENDIT')) return 'PAYMENT'
  if (key.startsWith('STARSENDER')) return 'MESSAGING'
  if (key.startsWith('ONESIGNAL')) return 'NOTIFICATION'
  if (key.startsWith('PUSHER')) return 'REALTIME'
  if (key.startsWith('GOOGLE')) return 'AUTH'
  if (key.startsWith('GIPHY')) return 'CONTENT'
  return 'GENERAL'
}

populateIntegrationSettings().catch(console.error)
