import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { automationExecutionService } from '@/lib/services/automationExecutionService'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

interface RouteParams {
  params: Promise<{
    id: string
  }>
}


export const dynamic = 'force-dynamic';
/**
 * POST /api/affiliate/optin-forms/[id]/submit
 * Submit optin form (public endpoint)
 * Features: Validation, Spam Protection, Duplicate Detection
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, email, phone, whatsapp, website } = body

    // SPAM PROTECTION 1: Honeypot field check
    // If 'website' field is filled (hidden field), it's likely a bot
    if (website && website.trim() !== '') {
      console.warn('[SPAM] Honeypot field filled:', { email, website })
      // Return success to avoid alerting bot
      return NextResponse.json({ 
        message: 'Terima kasih! Data Anda telah kami terima.' 
      })
    }

    // Get optin form
    const optinForm = await prisma.affiliateOptinForm.findFirst({
      where: { 
        id, 
        isActive: true 
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

    // SPAM PROTECTION 2: Duplicate email detection (24 jam terakhir)
    if (email) {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const existingLead = await prisma.affiliateLead.findFirst({
        where: {
          optinFormId: optinForm.id,
          email: email.toLowerCase().trim(),
          createdAt: {
            gte: last24Hours
          }
        }
      })

      if (existingLead) {
        console.warn('[SPAM] Duplicate submission within 24h:', { email, formId: optinForm.id })
        // Return gentle message
        return NextResponse.json({ 
          error: 'Email ini sudah terdaftar. Silakan cek email Anda atau gunakan email lain.',
        }, { status: 400 })
      }
    }

    // SPAM PROTECTION 3: Check for suspicious patterns in name/email
    const suspiciousPatterns = [
      /test/i,
      /asdf/i,
      /qwerty/i,
      /admin/i,
      /dummy/i,
      /sample/i,
      /example/i
    ]
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(name || '') || pattern.test(email || '')
    )
    
    if (isSuspicious) {
      console.warn('[SPAM] Suspicious pattern detected:', { name, email })
      // Still allow but mark for review
    }

    // Create lead
    const lead = await prisma.affiliateLead.create({
      data: {
        id: createId(),
        affiliateId: optinForm.affiliateId,
        optinFormId: optinForm.id,
        name: name || '',
        email: email ? email.toLowerCase().trim() : null,
        phone: phone || null,
        whatsapp: whatsapp || phone || null,
        source: 'optin',
        status: 'new',
        notes: isSuspicious ? '⚠️ Flagged: Suspicious pattern detected' : null,
        updatedAt: new Date()
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
