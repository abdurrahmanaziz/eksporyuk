import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * Required fields for member profile completion
 * Note: phone/whatsapp cukup salah satu yang terisi
 * Avatar bersifat opsional (tidak wajib untuk profile completion)
 */
const REQUIRED_PROFILE_FIELDS = {
  name: { label: 'Nama Lengkap', required: true },
  avatar: { label: 'Foto Profil', required: false }, // Opsional
  phone: { label: 'Nomor Telepon', required: false }, // Salah satu dengan WhatsApp
  whatsapp: { label: 'WhatsApp', required: false }, // Salah satu dengan Phone  
  province: { label: 'Provinsi', required: true },
  city: { label: 'Kota/Kabupaten', required: true },
}

/**
 * Check if a user has completed their profile
 * Logic:
 * - name, province, city WAJIB
 * - phone ATAU whatsapp cukup salah satu
 * - avatar opsional
 */
export function checkProfileCompletion(user: any) {
  const missingFields: string[] = []
  
  // Nama wajib
  if (!user.name || user.name.trim() === '') {
    missingFields.push('name')
  }
  
  // Avatar opsional - tidak dihitung sebagai missing field
  // if (!user.avatar) {
  //   missingFields.push('avatar')
  // }
  
  // Phone ATAU WhatsApp - cukup salah satu
  const hasPhone = user.phone && user.phone.trim() !== ''
  const hasWhatsapp = user.whatsapp && user.whatsapp.trim() !== ''
  if (!hasPhone && !hasWhatsapp) {
    missingFields.push('whatsapp') // Tampilkan sebagai 'whatsapp' saja
  }
  
  // Provinsi wajib
  if (!user.province || user.province.trim() === '') {
    missingFields.push('province')
  }
  
  // Kota wajib
  if (!user.city || user.city.trim() === '') {
    missingFields.push('city')
  }
  
  // Total required fields yang dihitung: name, whatsapp (OR phone), province, city = 4
  const totalRequired = 4
  const completedCount = totalRequired - missingFields.length
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completedFields: ['name', 'whatsapp', 'province', 'city'].filter(f => !missingFields.includes(f)),
    totalRequired,
    completedCount,
  }
}

/**
 * GET /api/member/onboarding
 * Get onboarding progress for current member
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Skip onboarding for ADMIN, MENTOR, FOUNDER roles - they don't need member onboarding
    const skipRoles = ['ADMIN', 'MENTOR', 'FOUNDER', 'CO_FOUNDER']
    if (skipRoles.includes(session.user.role as string)) {
      return NextResponse.json({
        success: true,
        data: {
          profileCompleted: true,
          onboardingCompleted: true,
          skipOnboarding: true,
          profile: {
            isComplete: true,
            missingFields: [],
            completedCount: 6,
            totalRequired: 6,
            progress: 100,
          },
          steps: {
            profileCompleted: true,
            hasMembership: true,
            hasJoinedGroup: true,
            hasEnrolledCourse: true,
          },
          totalProgress: 100,
          membership: null,
        }
      })
    }

    // Get user with membership data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        whatsapp: true,
        province: true,
        city: true,
        district: true,
        address: true,
        bio: true,
        profileCompleted: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Manually fetch related data
    const [userMemberships, courseEnrollments, groupMemberships, pendingTransactions] = await Promise.all([
      prisma.userMembership.findMany({
        where: {
          userId: user.id,
          isActive: true,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          membershipId: true,
          startDate: true,
          endDate: true,
          status: true,
        },
        take: 1,
      }),
      prisma.courseEnrollment.findMany({
        where: { userId: user.id },
        select: { id: true },
        take: 1
      }),
      prisma.groupMember.findMany({
        where: { userId: user.id },
        select: { id: true },
        take: 1
      }),
      // Check for pending transactions (membership)
      prisma.transaction.findFirst({
        where: {
          userId: user.id,
          type: 'MEMBERSHIP',
          status: 'PENDING',
          expiredAt: { gt: new Date() }, // Not expired yet
        },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          paymentUrl: true,
          expiredAt: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    ])

    // Fetch membership details if exists
    let activeMembership = null
    if (userMemberships.length > 0) {
      const membershipData = await prisma.membership.findUnique({
        where: { id: userMemberships[0].membershipId },
        select: {
          id: true,
          name: true,
          slug: true,
          duration: true,
        }
      })
      activeMembership = {
        ...userMemberships[0],
        membership: membershipData
      }
    }

    // Check profile completion
    const profileCheck = checkProfileCompletion(user)
    
    // Check onboarding steps
    const hasCompletedProfile = profileCheck.isComplete
    const hasMembership = !!activeMembership
    const hasJoinedGroup = groupMemberships.length > 0
    const hasEnrolledCourse = courseEnrollments.length > 0

    // Calculate progress (profile is 50%, rest are bonuses)
    const profileProgress = Math.round((profileCheck.completedCount / profileCheck.totalRequired) * 50)
    const membershipProgress = hasMembership ? 20 : 0
    const groupProgress = hasJoinedGroup ? 15 : 0
    const courseProgress = hasEnrolledCourse ? 15 : 0
    const totalProgress = Math.min(100, profileProgress + membershipProgress + groupProgress + courseProgress)

    // Overall completion - profile is MANDATORY
    const onboardingCompleted = hasCompletedProfile

    // If profile completed but flag not set, update it
    if (hasCompletedProfile && !user.profileCompleted) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileCompleted: true }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        // Main flag - profile must be complete to access content
        profileCompleted: hasCompletedProfile,
        onboardingCompleted,
        
        // Profile details
        profile: {
          isComplete: profileCheck.isComplete,
          missingFields: profileCheck.missingFields,
          completedCount: profileCheck.completedCount,
          totalRequired: profileCheck.totalRequired,
          progress: profileProgress,
        },
        
        // Onboarding steps
        steps: {
          profileCompleted: hasCompletedProfile,
          hasMembership,
          hasJoinedGroup,
          hasEnrolledCourse,
        },
        
        // Progress
        totalProgress,
        
        // Membership info
        membership: activeMembership ? {
          id: activeMembership.id,
          name: activeMembership.membership.name,
          slug: activeMembership.membership.slug,
          duration: activeMembership.membership.duration,
          startDate: activeMembership.startDate,
          endDate: activeMembership.endDate,
        } : null,

        // Pending Transaction (untuk menampilkan "Bayar Tagihan" jika ada)
        pendingTransaction: pendingTransactions ? {
          id: pendingTransactions.id,
          invoiceNumber: pendingTransactions.invoiceNumber,
          amount: pendingTransactions.amount,
          paymentUrl: pendingTransactions.paymentUrl,
          expiredAt: pendingTransactions.expiredAt,
          createdAt: pendingTransactions.createdAt,
          membershipName: (pendingTransactions.metadata as any)?.membershipName || 'Membership',
        } : null,

        // User profile data for form
        user: {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
          whatsapp: user.whatsapp,
          province: user.province,
          city: user.city,
          district: user.district,
          address: user.address,
          bio: user.bio,
        }
      }
    })

  } catch (error) {
    console.error('Error fetching member onboarding data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/member/onboarding
 * Update member profile for onboarding completion
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, avatar, phone, whatsapp, province, city, district, address, bio } = body

    // Validate required fields
    const errors: string[] = []
    if (!name || name.trim() === '') errors.push('Nama lengkap wajib diisi')
    if (!avatar) errors.push('Foto profil wajib diupload')
    if (!phone) errors.push('Nomor telepon wajib diisi')
    if (!whatsapp) errors.push('Nomor WhatsApp wajib diisi')
    if (!province) errors.push('Provinsi wajib dipilih')
    if (!city) errors.push('Kota/Kabupaten wajib dipilih')

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validasi gagal', errors },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        avatar,
        phone,
        whatsapp,
        province,
        city,
        district: district || null,
        address: address || null,
        bio: bio || null,
        profileCompleted: true,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        phone: true,
        whatsapp: true,
        province: true,
        city: true,
        profileCompleted: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil dilengkapi! Sekarang Anda dapat mengakses semua fitur.',
      user: updatedUser,
    })

  } catch (error) {
    console.error('Error updating member profile:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
