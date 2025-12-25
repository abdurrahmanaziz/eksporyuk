import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { generateBrandedEmail } from '@/lib/reminder-templates'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/affiliate/follow-ups/leads
 * Get affiliate's leads that need follow up
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get affiliate's pending transactions (leads)
    const transactionsQuery = prisma.transaction.findMany({
      where: {
        affiliateId: affiliate.id,
        status: status as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        membership: {
          include: {
            membership: {
              select: {
                id: true,
                name: true,
                price: true,
                checkoutSlug: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
    
    const countQuery = prisma.transaction.count({
      where: {
        affiliateId: affiliate.id,
        status: status as any,
      }
    })
    
    const [transactions, total] = await Promise.all([transactionsQuery, countQuery]) as [any[], number]

    // Get follow-up templates for each membership
    const membershipIds = [...new Set(
      transactions
        .map(t => t.membership?.membershipId)
        .filter(Boolean)
    )]

    let followUpTemplates: any[] = []
    try {
      followUpTemplates = await (prisma as any).membershipFollowUp.findMany({
        where: {
          membershipId: { in: membershipIds as string[] },
          isActive: true
        },
        orderBy: { sequenceOrder: 'asc' }
      })
    } catch (e) {
      // Model doesn't exist yet
    }

    const templatesByMembership = followUpTemplates.reduce((acc, t) => {
      if (!acc[t.membershipId]) acc[t.membershipId] = []
      acc[t.membershipId].push(t)
      return acc
    }, {} as Record<string, any[]>)

    // Format leads with personalized templates
    const leads = transactions.map(t => {
      const membershipId = t.membership?.membershipId
      const daysSinceOrder = Math.floor(
        (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const customerName = t.customerName || t.user?.name || 'Pelanggan'
      const firstName = customerName.split(' ')[0]
      
      // Personalize templates with lead data
      const templates = (membershipId ? templatesByMembership[membershipId] || [] : []).map((template: any) => {
        const replacements: Record<string, string> = {
          '{name}': customerName,
          '{first_name}': firstName,
          '{email}': t.customerEmail || t.user?.email || '',
          '{phone}': t.customerPhone || t.user?.phone || '',
          '{whatsapp}': t.customerWhatsapp || t.customerPhone || '',
          '{plan_name}': t.membership?.membership?.name || '',
          '{plan_price}': `Rp ${Number(t.membership?.membership?.price || 0).toLocaleString('id-ID')}`,
          '{affiliate_name}': affiliate.user?.name || '',
          '{affiliate_whatsapp}': affiliate.whatsapp || '',
          '{payment_link}': t.paymentUrl || '',
          '{order_date}': new Date(t.createdAt).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
          '{days_since_order}': `${daysSinceOrder} hari`,
          '{deadline}': new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
        }

        // Replace shortcodes in template
        let emailSubject = template.emailSubject
        let emailBody = template.emailBody
        let whatsappMessage = template.whatsappMessage || ''

        Object.entries(replacements).forEach(([code, value]) => {
          const regex = new RegExp(code.replace(/[{}]/g, '\\$&'), 'g')
          emailSubject = emailSubject.replace(regex, value)
          emailBody = emailBody.replace(regex, value)
          whatsappMessage = whatsappMessage.replace(regex, value)
        })

        return {
          id: template.id,
          title: template.title,
          description: template.description,
          emailSubject,
          emailBody,
          emailCTA: template.emailCTA,
          emailCTALink: (template.emailCTALink || '').replace('{payment_link}', t.paymentUrl || ''),
          whatsappMessage,
          sequenceOrder: template.sequenceOrder,
        }
      })

      return {
        id: t.id,
        customer: {
          name: customerName,
          email: t.customerEmail || t.user?.email || '',
          phone: t.customerPhone || t.user?.phone || '',
          whatsapp: t.customerWhatsapp || t.customerPhone || '',
        },
        membership: t.membership?.membership ? {
          id: t.membership.membership.id,
          name: t.membership.membership.name,
          price: Number(t.membership.membership.price),
        } : null,
        amount: Number(t.amount),
        status: t.status,
        paymentUrl: t.paymentUrl,
        orderDate: t.createdAt,
        daysSinceOrder,
        followUpTemplates: templates,
      }
    })

    return NextResponse.json({
      leads,
      affiliate: {
        id: affiliate.id,
        name: affiliate.user?.name,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching affiliate leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
