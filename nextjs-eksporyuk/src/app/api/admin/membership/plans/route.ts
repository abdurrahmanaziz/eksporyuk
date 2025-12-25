import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch membership plans for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil data via SQL mentah agar aman dari enum lama
    const rawMemberships = await prisma.$queryRawUnsafe<Array<{
      id: string;
      name: string;
      slug: string | null;
      description: string | null;
      duration: string;
      price: any;
      isActive: boolean;
      createdAt: Date;
    }>>(`SELECT id, name, slug, description, duration, price, "isActive", "createdAt" FROM "Membership" ORDER BY "createdAt" DESC`)

    // Hitung jumlah ACTIVE userMemberships per plan
    const memberships = await Promise.all(
      rawMemberships.map(async (m) => {
        const activeCount = await prisma.userMembership.count({
          where: { membershipId: m.id, status: 'ACTIVE' }
        })
        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.description || '',
          duration: m.duration,
          price: m.price,
          isActive: m.isActive,
          _count: {
            userMemberships: activeCount
          }
        }
      })
    )

    return NextResponse.json({
      memberships
    })

  } catch (error) {
    console.error('Error fetching membership plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}