import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { automationExecutionService } from '@/lib/services/automationExecutionService'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/affiliate/optin-forms/[id]/submit
 * Submit optin form (public endpoint)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, email, phone, whatsapp } = body

    // Get optin form
    const optinForm = await prisma.affiliateOptinForm.findUnique({
      where: { id, isActive: true },
      include: {
        affiliate: {
          include: {
            user: true
          }
        }
      }
    })

    if (!optinForm) {
      return NextResponse.json(
        { error: 'Optin form not found or inactive' },
        { status: 404 }
      )
    }

    // Validate required fields based on form settings
    if (optinForm.collectName && !name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (optinForm.collectEmail && !email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    if (optinForm.collectPhone && !phone && !whatsapp) {
      return NextResponse.json(
        { error: 'Phone or WhatsApp is required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Create lead
    const lead = await prisma.affiliateLead.create({
      data: {
        affiliateId: optinForm.affiliateId,
        optinFormId: optinForm.id,
        name: name || '',
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || phone || null,
        source: 'optin',
        status: 'new'
      }
    })

    // Increment submission count
    await prisma.affiliateOptinForm.update({
      where: { id: optinForm.id },
      data: {
        submissionCount: { increment: 1 }
      }
    })

    // Auto-trigger AFTER_OPTIN automation (non-blocking)
    automationExecutionService.triggerAutomation({
      leadId: lead.id,
      affiliateId: optinForm.affiliateId,
      triggerType: 'AFTER_OPTIN',
      triggerData: {
        optinFormId: optinForm.id,
        optinFormTitle: optinForm.formName,
        submittedAt: new Date().toISOString(),
      },
    }).catch((error) => {
      console.error('Failed to trigger AFTER_OPTIN automation:', error);
      // Don't block the response if automation trigger fails
    });

    // Build response
    let response: any = {
      message: optinForm.successMessage,
      success: true
    }

    // Add redirect info if configured
    if (optinForm.redirectType === 'url' && optinForm.redirectUrl) {
      response.redirectUrl = optinForm.redirectUrl
    } else if (optinForm.redirectType === 'whatsapp' && optinForm.redirectWhatsapp) {
      // Format WhatsApp link
      const waNumber = optinForm.redirectWhatsapp.replace(/[^0-9]/g, '')
      response.redirectUrl = `https://wa.me/${waNumber}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error submitting optin form:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
