import { prisma } from './prisma'

/**
 * Safe Prisma queries that handle missing columns gracefully
 */

export const safePrisma = {
  // Safe Settings query
  async findSettings() {
    try {
      return await prisma.settings.findUnique({
        where: { id: 1 }
      })
    } catch (error: any) {
      console.error('Settings query error:', error)
      
      // If column not found, return basic settings structure
      if (error.code === 'P2022') {
        console.log('Database schema mismatch, returning fallback settings...')
        return {
          id: 1,
          siteTitle: 'Eksporyuk',
          siteDescription: 'Platform Ekspor Indonesia',
          siteLogo: null,
          siteFavicon: null,
          primaryColor: '#3B82F6',
          secondaryColor: '#1F2937',
          buttonPrimaryBg: '#3B82F6',
          buttonPrimaryText: '#FFFFFF',
          buttonSecondaryBg: '#6B7280',
          buttonSecondaryText: '#FFFFFF',
          buttonSuccessBg: '#10B981',
          buttonSuccessText: '#FFFFFF',
          buttonDangerBg: '#EF4444',
          buttonDangerText: '#FFFFFF',
          buttonBorderRadius: '0.5rem',
          headerText: null,
          footerText: null,
          contactEmail: null,
          contactPhone: null,
          whatsappNumber: null,
          instagramUrl: null,
          facebookUrl: null,
          linkedinUrl: null,
          maintenanceMode: false,
          defaultLanguage: 'id',
          bannerImage: null,
          // Dashboard Theme Colors defaults
          dashboardSidebarBg: '#1e293b',
          dashboardSidebarText: '#e2e8f0',
          dashboardSidebarActiveText: '#ffffff',
          dashboardSidebarActiveBg: '#3b82f6',
          dashboardSidebarHoverBg: '#334155',
          dashboardHeaderBg: '#ffffff',
          dashboardHeaderText: '#1f2937',
          dashboardBodyBg: '#f1f5f9',
          dashboardCardBg: '#ffffff',
          dashboardCardBorder: '#e2e8f0',
          dashboardCardHeaderBg: '#f8fafc',
          dashboardTextPrimary: '#1f2937',
          dashboardTextSecondary: '#64748b',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
      
      throw error
    }
  },

  // Safe User query with optional fields
  async findUser(where: any, select?: any) {
    try {
      return await prisma.user.findUnique({ where, select })
    } catch (error: any) {
      console.error('User query error:', error)
      
      // If column not found, retry with basic fields
      if (error.code === 'P2022') {
        console.log('Using fallback user query...')
        const basicSelect = {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          avatar: true,
          username: true,
          whatsapp: true,
          emailVerified: true,
          isSuspended: true,
          suspendReason: true,
          isActive: true,
        }
        
        return await prisma.user.findUnique({
          where,
          select: select ? { ...basicSelect, ...select } : basicSelect
        })
      }
      
      throw error
    }
  }
}

export default safePrisma