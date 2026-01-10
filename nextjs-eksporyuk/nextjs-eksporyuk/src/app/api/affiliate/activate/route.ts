import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

/**
 * POST /api/affiliate/activate
 * Activate affiliate for existing users - available to ALL roles
 * Creates affiliate profile and enables affiliate menu access
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`[Affiliate Activate] User ${userId} (${session.user.role}) requesting affiliate activation`)

    // Check if user already has affiliate profile
    const existingProfile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      select: { id: true, isActive: true, affiliateCode: true }
    })

    if (existingProfile) {
      if (existingProfile.isActive) {
        return NextResponse.json({ 
          error: 'Anda sudah terdaftar sebagai affiliate',
          affiliateCode: existingProfile.affiliateCode
        }, { status: 400 })
      } else {
        // Reactivate existing profile
        await prisma.affiliateProfile.update({
          where: { userId },
          data: { isActive: true }
        })

        // Enable affiliate menu
        await prisma.user.update({
          where: { id: userId },
          data: { affiliateMenuEnabled: true }
        })

        console.log(`[Affiliate Activate] Reactivated affiliate profile for user ${userId}`)
        return NextResponse.json({
          success: true,
          message: 'Affiliate profile berhasil diaktifkan kembali',
          affiliateCode: existingProfile.affiliateCode
        })
      }
    }

    // Generate unique affiliate code based on user role
    let baseCode = 'EKS' // Default
    switch (session.user.role) {
      case 'MEMBER_PREMIUM':
        baseCode = 'PREMIUM'
        break
      case 'MENTOR':
        baseCode = 'MENTOR'
        break
      case 'ADMIN':
        baseCode = 'ADMIN'
        break
      default:
        baseCode = 'EKS'
    }

    let affiliateCode = baseCode + Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Ensure uniqueness
    let codeExists = await prisma.affiliateProfile.findFirst({
      where: { affiliateCode }
    })
    
    while (codeExists) {
      affiliateCode = baseCode + Math.random().toString(36).substring(2, 8).toUpperCase()
      codeExists = await prisma.affiliateProfile.findFirst({
        where: { affiliateCode }
      })
    }

    // Create affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.create({
      data: {
        id: `affiliate-${userId}-${Date.now()}`,
        userId,
        affiliateCode,
        isActive: true,
        tier: 'BRONZE',
        totalEarnings: 0,
        totalReferrals: 0
      }
    })

    // Add AFFILIATE role to UserRole table for multi-role support
    try {
      await prisma.userRole.create({
        data: {
          id: `${userId}-AFFILIATE-${Date.now()}`,
          userId,
          role: 'AFFILIATE'
        }
      })
    } catch (e) {
      // Role might already exist, ignore error
      console.log(`[Affiliate Activate] AFFILIATE role already exists for user ${userId}`)
    }

    // Enable affiliate menu access
    await prisma.user.update({
      where: { id: userId },
      data: { affiliateMenuEnabled: true }
    })

    console.log(`[Affiliate Activate] Successfully created affiliate profile for user ${userId} with code ${affiliateCode}`)

    return NextResponse.json({
      success: true,
      message: 'Selamat! Anda berhasil mengaktifkan fitur affiliate',
      affiliateCode: affiliateProfile.affiliateCode,
      profile: {
        id: affiliateProfile.id,
        affiliateCode: affiliateProfile.affiliateCode,
        tier: affiliateProfile.tier,
        isActive: affiliateProfile.isActive
      }
    })

  } catch (error: any) {
    console.error('[Affiliate Activate] Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengaktifkan affiliate. Silakan coba lagi.', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/affiliate/activate
 * Check if user can activate affiliate and get current status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check current affiliate status
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      select: { 
        id: true, 
        isActive: true, 
        affiliateCode: true, 
        tier: true,
        totalEarnings: true,
        totalReferrals: true,
        createdAt: true 
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true, 
        affiliateMenuEnabled: true,
        name: true,
        email: true
      }
    })

    return NextResponse.json({
      success: true,
      canActivate: !affiliateProfile || !affiliateProfile.isActive,
      currentStatus: {
        hasProfile: !!affiliateProfile,
        isActive: affiliateProfile?.isActive || false,
        affiliateCode: affiliateProfile?.affiliateCode || null,
        tier: affiliateProfile?.tier || null,
        totalEarnings: affiliateProfile?.totalEarnings || 0,
        totalReferrals: affiliateProfile?.totalReferrals || 0,
        activatedAt: affiliateProfile?.createdAt || null
      },
      userInfo: {
        role: user?.role,
        name: user?.name,
        email: user?.email,
        affiliateMenuEnabled: user?.affiliateMenuEnabled || false
      }
    })

  } catch (error: any) {
    console.error('[Affiliate Activate] GET Error:', error)
    return NextResponse.json(
      { error: 'Gagal mengecek status affiliate', details: error.message },
      { status: 500 }
    )
  }
}