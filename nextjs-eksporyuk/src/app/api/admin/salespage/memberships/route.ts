import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic';
// GET - Fetch memberships for pricing section
export async function GET() {
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        isPopular: true,
      },
      orderBy: {
        price: 'asc'
      }
    })
    
    return NextResponse.json(memberships)
  } catch (error) {
    console.error('Error fetching memberships for pricing:', error)
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 })
  }
}
