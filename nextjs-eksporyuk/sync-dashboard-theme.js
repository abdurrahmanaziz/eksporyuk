/**
 * Script untuk sync dashboard theme defaults ke Neon database
 * Run: node sync-dashboard-theme.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Default dashboard theme values
const defaultDashboardTheme = {
  dashboardSidebarBg: '#1a1c23',
  dashboardSidebarText: '#9ca3af',
  dashboardSidebarActiveText: '#ffffff',
  dashboardSidebarActiveBg: '#2563eb',
  dashboardSidebarHoverBg: '#374151',
  dashboardHeaderBg: '#ffffff',
  dashboardHeaderText: '#1f2937',
  dashboardBodyBg: '#f3f4f6',
  dashboardCardBg: '#ffffff',
  dashboardCardBorder: '#e5e7eb',
  dashboardCardHeaderBg: '#f9fafb',
  dashboardTextPrimary: '#111827',
  dashboardTextSecondary: '#4b5563',
  dashboardTextMuted: '#9ca3af',
  dashboardBorderColor: '#e5e7eb',
  dashboardSuccessColor: '#10b981',
  dashboardWarningColor: '#f59e0b',
  dashboardDangerColor: '#ef4444',
  dashboardInfoColor: '#3b82f6'
}

async function main() {
  try {
    console.log('📦 Connecting to database...')
    
    // Get current settings
    const settings = await prisma.settings.findUnique({
      where: { id: 1 }
    })
    
    if (!settings) {
      console.log('❌ Settings not found! Creating with defaults...')
      await prisma.settings.create({
        data: {
          id: 1,
          siteTitle: 'Eksporyuk',
          ...defaultDashboardTheme
        }
      })
      console.log('✅ Created settings with dashboard theme defaults')
    } else {
      console.log('📋 Current dashboard theme values:')
      Object.keys(defaultDashboardTheme).forEach(key => {
        console.log(`   ${key}: ${settings[key] || '(null)'}`)
      })
      
      // Check if any value is null
      const nullFields = Object.keys(defaultDashboardTheme).filter(key => !settings[key])
      
      if (nullFields.length > 0) {
        console.log(`\n⚠️ Found ${nullFields.length} null fields, updating with defaults...`)
        
        // Only update null fields
        const updateData = {}
        nullFields.forEach(key => {
          updateData[key] = defaultDashboardTheme[key]
        })
        
        await prisma.settings.update({
          where: { id: 1 },
          data: updateData
        })
        
        console.log('✅ Updated null fields with defaults:')
        nullFields.forEach(key => {
          console.log(`   ${key}: ${defaultDashboardTheme[key]}`)
        })
      } else {
        console.log('\n✅ All dashboard theme fields already have values')
      }
    }
    
    // Verify final state
    const finalSettings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: Object.keys(defaultDashboardTheme).reduce((acc, key) => {
        acc[key] = true
        return acc
      }, {})
    })
    
    console.log('\n📊 Final dashboard theme values:')
    Object.entries(finalSettings).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
