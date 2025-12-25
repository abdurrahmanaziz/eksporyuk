import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch pending leads for affiliate
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow AFFILIATE, ADMIN, FOUNDER, CO_FOUNDER roles
    const allowedRoles = ['AFFILIATE', 'ADMIN', 'FOUNDER', 'CO_FOUNDER']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied. Affiliate access required.' }, { status: 403 })
    }

    // Get all pending transactions where this affiliate is the referrer
    const leads = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        // Check if metadata contains this affiliate's ID
        // This assumes affiliate info is stored in metadata during checkout
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerWhatsapp: true,
        amount: true,
        createdAt: true,
        metadata: true,
        type: true,
        // Include membership with reminder settings
        membership: {
          select: {
            membership: {
              select: {
                name: true,
                reminders: true
              }
            }
          }
        },
        // Include product with reminder settings
        product: {
          select: {
            name: true,
            reminders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter by affiliate ID in metadata
    const affiliateLeads = leads.filter(lead => {
      const metadata = lead.metadata as any
      return metadata?.affiliateId === session.user.id || 
             metadata?.referredBy === session.user.id ||
             metadata?.affiliate?.id === session.user.id
    })

    return NextResponse.json({ 
      success: true,
      leads: affiliateLeads,
      count: affiliateLeads.length
    })
  } catch (error) {
    console.error('Error fetching affiliate leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
