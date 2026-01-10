import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/databases/suppliers/sync-profiles - Get verified profiles not in Supplier database
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all verified supplier profiles
    const verifiedProfiles = await prisma.supplierProfile.findMany({
      where: {
        isVerified: true,
        isSuspended: false,
      },
      orderBy: {
        verifiedAt: 'desc',
      },
    })

    // Enrich with user data manually
    const userIds = verifiedProfiles.map(p => p.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))
    
    const profilesWithUser = verifiedProfiles.map(p => ({
      ...p,
      user: userMap.get(p.userId) || null
    }))

    // Get all suppliers in database
    const existingSuppliers = await prisma.supplier.findMany({
      select: {
        email: true,
        companyName: true,
      },
    })

    // Filter out profiles that are already in Supplier database
    // Match by email or company name
    const existingEmails = new Set(existingSuppliers.map((s) => s.email?.toLowerCase()))
    const existingCompanies = new Set(existingSuppliers.map((s) => s.companyName.toLowerCase()))

    const profilesNotInDatabase = profilesWithUser.filter((profile) => {
      const emailMatch = profile.email && existingEmails.has(profile.email.toLowerCase())
      const companyMatch = existingCompanies.has(profile.companyName.toLowerCase())
      return !emailMatch && !companyMatch
    })

    return NextResponse.json({
      profiles: profilesNotInDatabase,
      total: profilesNotInDatabase.length,
    })
  } catch (error) {
    console.error('Error fetching sync profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/databases/suppliers/sync-profiles - Sync profile to Supplier database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { profileId } = body

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    // Get the supplier profile
    const profileData = await prisma.supplierProfile.findUnique({
      where: { id: profileId },
    })

    if (!profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profileData.isVerified) {
      return NextResponse.json({ error: 'Profile is not verified' }, { status: 400 })
    }

    // Fetch related data manually
    const [user, products] = await Promise.all([
      prisma.user.findUnique({ where: { id: profileData.userId } }),
      prisma.supplierProduct.findMany({ where: { supplierId: profileData.id } })
    ])

    // Check if already exists in Supplier database
    const existing = await prisma.supplier.findFirst({
      where: {
        OR: [
          { email: profileData.email || undefined },
          { companyName: profileData.companyName },
        ],
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Supplier already exists in database' }, { status: 409 })
    }

    // Create products string from published products
    const publishedProducts = products?.filter((p: any) => p.status === 'PUBLISHED') || []
    const productsList =
      publishedProducts.length > 0
        ? publishedProducts.map((p: any) => p.title).join(', ')
        : profileData.businessCategory || 'Various Products'

    // Sync to Supplier database
    const supplier = await prisma.supplier.create({
      data: {
        id: createId(),
        companyName: profileData.companyName,
        province: profileData.province,
        city: profileData.city,
        address: profileData.address,
        contactPerson: profileData.contactPerson,
        email: profileData.email,
        phone: profileData.phone,
        whatsapp: profileData.whatsapp,
        website: profileData.website,
        businessType: profileData.businessCategory,
        products: productsList,
        capacity: null, // Can be added later
        certifications: null, // Can be added later
        legalityDoc: profileData.legalityDoc,
        nibDoc: profileData.nibDoc,
        isVerified: true, // Auto-verify since profile is verified
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
        rating: profileData.rating || 0,
        totalDeals: 0,
        tags: profileData.businessCategory,
        notes: `Synced from SupplierProfile (ID: ${profileData.id}) on ${new Date().toISOString()}`,
        addedBy: session.user.id,
        viewCount: profileData.viewCount,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      supplier,
      message: 'Supplier profile synced to database successfully',
    })
  } catch (error) {
    console.error('Error syncing profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
