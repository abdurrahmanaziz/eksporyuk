/**
 * Script untuk FIX dashboard theme colors di Neon database
 * Nilai warna sebelumnya menyebabkan tampilan berantakan
 * Run: node fix-dashboard-theme.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Proper dashboard theme values (dark sidebar, light content area)
const fixedDashboardTheme = {
  dashboardSidebarBg: '#1f2937',          // Dark gray sidebar
  dashboardSidebarText: '#9ca3af',        // Light gray text
  dashboardSidebarActiveText: '#ffffff',  // White active text
  dashboardSidebarActiveBg: '#2563eb',    // Blue active bg
  dashboardSidebarHoverBg: '#374151',     // Darker gray hover
  dashboardHeaderBg: '#ffffff',           // White header
  dashboardHeaderText: '#1f2937',         // Dark text
  dashboardBodyBg: '#f3f4f6',             // Light gray body
  dashboardCardBg: '#ffffff',             // White cards
  dashboardCardBorder: '#e5e7eb',         // Light border
  dashboardCardHeaderBg: '#f9fafb',       // Very light gray
  dashboardTextPrimary: '#111827',        // Very dark text (readable!)
  dashboardTextSecondary: '#4b5563',      // Medium gray text
  dashboardTextMuted: '#9ca3af',          // Light gray muted
  dashboardBorderColor: '#e5e7eb',        // Light border
  dashboardSuccessColor: '#10b981',       // Green
  dashboardWarningColor: '#f59e0b',       // Orange
  dashboardDangerColor: '#ef4444',        // Red
  dashboardInfoColor: '#3b82f6'           // Blue
}

async function main() {
  try {
    console.log('🔧 Fixing dashboard theme colors in Neon database...\n')
    
    // Get current settings
    const currentSettings = await prisma.settings.findUnique({
      where: { id: 1 }
    })
    
    if (!currentSettings) {
      console.log('❌ Settings not found!')
      return
    }
    
    console.log('📋 Current (broken) values:')
    console.log(`   dashboardTextPrimary: ${currentSettings.dashboardTextPrimary} (should be dark!)`)
    console.log(`   dashboardCardBg: ${currentSettings.dashboardCardBg}`)
    console.log(`   dashboardBodyBg: ${currentSettings.dashboardBodyBg}`)
    console.log(`   dashboardSidebarBg: ${currentSettings.dashboardSidebarBg}`)
    
    // Force update ALL dashboard theme values
    console.log('\n⚙️ Updating with proper values...')
    
    await prisma.settings.update({
      where: { id: 1 },
      data: fixedDashboardTheme
    })
    
    // Verify
    const updatedSettings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: {
        dashboardSidebarBg: true,
        dashboardSidebarText: true,
        dashboardTextPrimary: true,
        dashboardTextSecondary: true,
        dashboardCardBg: true,
        dashboardBodyBg: true,
      }
    })
    
    console.log('\n✅ Fixed! New values:')
    Object.entries(updatedSettings).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`)
    })
    
    console.log('\n🎉 Dashboard theme colors have been fixed!')
    console.log('   Clear browser cache and refresh the production site.')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
