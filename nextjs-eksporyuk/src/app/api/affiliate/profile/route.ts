import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        username: true,
        phone: true,
        whatsapp: true,
        bio: true,
        address: true,
        city: true,
        province: true,
        profileCompleted: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Get bank account from latest payout
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    const latestPayout = await prisma.payout.findFirst({
      where: {
        walletId: wallet?.id,
        bankName: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const bankAccount = latestPayout ? {
      bankName: latestPayout.bankName || '',
      accountName: latestPayout.accountName || '',
      accountNumber: latestPayout.accountNumber || '',
    } : null

    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com'
    
    // Bio Page URL - uses username or shortLinkUsername
    const bioUsername = user.username || affiliateProfile.shortLinkUsername || affiliateProfile.affiliateCode.toLowerCase()
    const bioPageUrl = `${baseUrl}/bio/${bioUsername}`
    
    // Referral URL - append affiliate code to homepage
    const referralUrl = `${baseUrl}?ref=${affiliateProfile.affiliateCode}`

    return NextResponse.json({
      user,
      affiliate: {
        affiliateCode: affiliateProfile.affiliateCode,
        bioPageUrl: bioPageUrl,
        referralUrl: referralUrl,
        tier: affiliateProfile.tier,
        commissionRate: Number(affiliateProfile.commissionRate),
        totalClicks: affiliateProfile.totalClicks,
        totalConversions: affiliateProfile.totalConversions,
        totalEarnings: Number(affiliateProfile.totalEarnings),
        isActive: affiliateProfile.isActive,
      },
      bankAccount,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 POST /api/affiliate/profile called')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📄 Request body:', body)
    
    const { avatar, name, phone, whatsapp, bio, address, city, province, bankAccount } = body

    // Update user profile
    const updateData: Record<string, unknown> = {}
    if (avatar !== undefined) updateData.avatar = avatar
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp
    if (bio !== undefined) updateData.bio = bio
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (province !== undefined) updateData.province = province

    // Mark profile as completed if key fields are filled
    if (name && phone && whatsapp) {
      updateData.profileCompleted = true
    }

    console.log('📝 Updating user with data:', updateData)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    console.log('✅ User updated successfully')

    // Handle bank account data if provided
    let bankAccountSaved = false
    if (bankAccount && bankAccount.bankName && bankAccount.accountName && bankAccount.accountNumber) {
      console.log('🏦 Processing bank account data:', bankAccount)
      
      try {
        // Get or create wallet
        let wallet = await prisma.wallet.findUnique({
          where: { userId: session.user.id },
        })

        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: {
              userId: session.user.id,
              balance: 0,
            },
          })
          console.log('💳 Created new wallet')
        }

        // Get the most recent payout record with bank info for this wallet (regardless of status)
        const existingBankPayout = await prisma.payout.findFirst({
          where: {
            walletId: wallet.id,
            bankName: { not: null },
          },
          orderBy: { createdAt: 'desc' },
        })

        if (existingBankPayout) {
          // Update the existing payout record with new bank details
          await prisma.payout.update({
            where: { id: existingBankPayout.id },
            data: {
              bankName: bankAccount.bankName,
              accountName: bankAccount.accountName,
              accountNumber: bankAccount.accountNumber,
              notes: 'Bank account info for affiliate - updated',
              updatedAt: new Date(),
            },
          })
          console.log('🏦 Bank account info updated')
        } else {
          // Create a new payout record to store bank info
          await prisma.payout.create({
            data: {
              walletId: wallet.id,
              amount: 0,
              status: 'PAID', // Set as paid so it won't show in payout list
              bankName: bankAccount.bankName,
              accountName: bankAccount.accountName,
              accountNumber: bankAccount.accountNumber,
              notes: 'Bank account info for affiliate',
              paidAt: new Date(),
            },
          })
          console.log('🏦 Bank account info created')
        }
        
        bankAccountSaved = true
      } catch (bankError) {
        console.error('❌ Error saving bank account:', bankError)
      }
    }

    // Create or update affiliate profile completion status
    try {
      const profileComplete = !!(name && phone && whatsapp)
      const bankComplete = bankAccountSaved
      
      // Check if affiliate profile exists
      const existingProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: session.user.id }
      })

      if (existingProfile) {
        // Update existing profile
        await prisma.affiliateProfile.update({
          where: { userId: session.user.id },
          data: {
            profileCompleted: profileComplete,
            profileCompletedAt: profileComplete ? new Date() : null,
          }
        })
        console.log('✅ Affiliate profile updated - profileComplete:', profileComplete, 'bankComplete:', bankComplete)
      } else {
        // Create new affiliate profile
        const affiliateCode = `EY${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        const shortLink = `eksporyuk.com/${affiliateCode.toLowerCase()}`
        // @ts-ignore - new fields may not be in cached types
        await prisma.affiliateProfile.create({
          data: {
            userId: session.user.id,
            affiliateCode: affiliateCode,
            shortLink: shortLink,
            tier: 1,
            commissionRate: 10,
            isActive: true,
            profileCompleted: profileComplete,
            profileCompletedAt: profileComplete ? new Date() : null,
          }
        })
        console.log('✅ Affiliate profile created - profileComplete:', profileComplete, 'bankComplete:', bankComplete)
      }
    } catch (affiliateUpdateError) {
      console.log('⚠️ Could not update affiliate profile:', affiliateUpdateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Profile and bank account updated successfully',
      user: updatedUser,
      bankAccountSaved
    })
  } catch (error) {
    console.error('❌ Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bankAccount, name, phone, whatsapp, bio, address, city, province } = body

    // Update user profile if any profile fields provided
    if (name || phone || whatsapp || bio || address || city || province) {
      const updateData: Record<string, unknown> = {}
      if (name !== undefined) updateData.name = name
      if (phone !== undefined) updateData.phone = phone
      if (whatsapp !== undefined) updateData.whatsapp = whatsapp
      if (bio !== undefined) updateData.bio = bio
      if (address !== undefined) updateData.address = address
      if (city !== undefined) updateData.city = city
      if (province !== undefined) updateData.province = province

      // Mark profile as completed if key fields are filled
      if (name && phone && whatsapp) {
        updateData.profileCompleted = true
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      })
    }

    // Skip bank account update if not provided
    if (!bankAccount) {
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
      })
    }

    if (!bankAccount.bankName || !bankAccount.accountName || !bankAccount.accountNumber) {
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully (bank info incomplete, skipped)',
      })
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          balance: 0,
        },
      })
    }

    // Get the most recent payout record with bank info for this wallet
    const latestPayout = await prisma.payout.findFirst({
      where: {
        walletId: wallet.id,
        bankName: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Update existing or create new bank info record
    if (latestPayout) {
      // Update the existing record with new bank details
      await prisma.payout.update({
        where: { id: latestPayout.id },
        data: {
          bankName: bankAccount.bankName,
          accountName: bankAccount.accountName,
          accountNumber: bankAccount.accountNumber,
          notes: 'Bank account info update',
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new record if none exists
      await prisma.payout.create({
        data: {
          walletId: wallet.id,
          amount: 0,
          status: 'PAID', // Set as paid so it won't show in payout list
          bankName: bankAccount.bankName,
          accountName: bankAccount.accountName,
          accountNumber: bankAccount.accountNumber,
          notes: 'Bank account info update',
          paidAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
