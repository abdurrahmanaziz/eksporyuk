import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// Helper to get or create CourseSettings
async function getOrCreateCourseSettings() {
  let courseSettings = await prisma.courseSettings.findFirst()
  
  if (!courseSettings) {
    courseSettings = await prisma.courseSettings.create({
      data: {
        id: randomUUID(),
        defaultAffiliateCommission: 10,
        minWithdrawalAmount: 50000,
        updatedAt: new Date()
      }
    })
  }
  
  return courseSettings
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get main settings for affiliate flags
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          affiliateAutoApprove: false,
          affiliateCommissionEnabled: true,
          updatedAt: new Date()
        }
      })
    }

    // Get CourseSettings for commission and withdrawal amounts
    const courseSettings = await getOrCreateCourseSettings()

    return NextResponse.json({ 
      success: true, 
      settings: {
        affiliateAutoApprove: settings.affiliateAutoApprove ?? false,
        affiliateCommissionEnabled: settings.affiliateCommissionEnabled ?? true,
        defaultAffiliateCommission: courseSettings.defaultAffiliateCommission ?? 10,
        minWithdrawalAmount: Number(courseSettings.minWithdrawalAmount) ?? 50000,
      }
    })
  } catch (error) {
    console.error('Error fetching affiliate settings:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[AFFILIATE SETTINGS API] Received data:', body)

    const {
      affiliateAutoApprove,
      affiliateCommissionEnabled,
      defaultAffiliateCommission,
      minWithdrawalAmount,
    } = body

    // Update Settings table for boolean flags
    const settingsUpdateData: any = {}
    
    if (affiliateAutoApprove !== undefined) {
      settingsUpdateData.affiliateAutoApprove = Boolean(affiliateAutoApprove)
    }
    if (affiliateCommissionEnabled !== undefined) {
      settingsUpdateData.affiliateCommissionEnabled = Boolean(affiliateCommissionEnabled)
    }

    if (Object.keys(settingsUpdateData).length > 0) {
      // Add updatedAt for the update
      settingsUpdateData.updatedAt = new Date()
      
      // Check if settings exists first
      const existingSettings = await prisma.settings.findUnique({ where: { id: 1 } })
      
      if (existingSettings) {
        await prisma.settings.update({
          where: { id: 1 },
          data: settingsUpdateData
        })
      } else {
        // Create with all required fields
        await prisma.settings.create({
          data: {
            ...settingsUpdateData,
            updatedAt: new Date()
          }
        })
      }
    }

    // Update CourseSettings for commission and withdrawal amounts
    const courseUpdateData: any = {}
    
    if (defaultAffiliateCommission !== undefined && defaultAffiliateCommission !== null) {
      const commission = parseFloat(String(defaultAffiliateCommission))
      if (!isNaN(commission) && commission >= 0 && commission <= 100) {
        courseUpdateData.defaultAffiliateCommission = commission
      }
    }
    
    if (minWithdrawalAmount !== undefined && minWithdrawalAmount !== null) {
      const amount = parseInt(String(minWithdrawalAmount))
      if (!isNaN(amount) && amount >= 0) {
        courseUpdateData.minWithdrawalAmount = amount
      }
    }

    if (Object.keys(courseUpdateData).length > 0) {
      // Get existing CourseSettings or create new one
      const existingCourseSettings = await prisma.courseSettings.findFirst()
      
      if (existingCourseSettings) {
        await prisma.courseSettings.update({
          where: { id: existingCourseSettings.id },
          data: courseUpdateData
        })
      } else {
        await prisma.courseSettings.create({
          data: {
            id: randomUUID(),
            defaultAffiliateCommission: courseUpdateData.defaultAffiliateCommission ?? 10,
            minWithdrawalAmount: courseUpdateData.minWithdrawalAmount ?? 50000,
            updatedAt: new Date()
          }
        })
      }
    }

    // Fetch updated settings to return
    const updatedSettings = await prisma.settings.findFirst()
    const updatedCourseSettings = await prisma.courseSettings.findFirst()

    console.log('[AFFILIATE SETTINGS API] Settings saved successfully')

    return NextResponse.json({ 
      success: true, 
      settings: {
        affiliateAutoApprove: updatedSettings?.affiliateAutoApprove ?? false,
        affiliateCommissionEnabled: updatedSettings?.affiliateCommissionEnabled ?? true,
        defaultAffiliateCommission: updatedCourseSettings?.defaultAffiliateCommission ?? 10,
        minWithdrawalAmount: Number(updatedCourseSettings?.minWithdrawalAmount) ?? 50000,
      }
    })
  } catch (error) {
    console.error('Error saving affiliate settings:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
