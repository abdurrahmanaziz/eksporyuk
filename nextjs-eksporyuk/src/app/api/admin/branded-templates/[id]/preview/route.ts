import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createSimpleBrandedEmail, createSampleData, getBrandConfig } from '@/lib/branded-template-engine'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


interface Props {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/admin/branded-templates/[id]/preview
 * Generate preview of branded template with sample data
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const template = await prisma.brandedTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const body = await request.json()
    const { customData } = body

    // Use custom data if provided, otherwise use sample data
    const previewData = customData || template.previewData || createSampleData()

    // Generate email preview with simple design
    if (template.type === 'EMAIL') {
      const brandConfig = await getBrandConfig()
      const customBranding: any = template.customBranding || {}
      const backgroundDesign = customBranding.backgroundDesign || 'simple'
      
      const htmlContent = createSimpleBrandedEmail(
        template.subject,
        template.content,
        template.ctaText || undefined,
        template.ctaLink || undefined,
        backgroundDesign,
        previewData,
        brandConfig
      )

      return NextResponse.json({
        success: true,
        data: {
          type: 'EMAIL',
          subject: template.subject,
          content: template.content,
          ctaText: template.ctaText,
          ctaLink: template.ctaLink,
          backgroundDesign: backgroundDesign,
          htmlPreview: htmlContent,
          previewData
        }
      })
    }

    // Generate WhatsApp preview
    if (template.type === 'WHATSAPP') {
      const { processShortcodes } = await import('@/lib/branded-template-engine')
      
      const processedContent = processShortcodes(template.content, previewData)
      const processedCtaText = template.ctaText ? processShortcodes(template.ctaText, previewData) : undefined
      const processedCtaLink = template.ctaLink ? processShortcodes(template.ctaLink, previewData) : undefined

      return NextResponse.json({
        success: true,
        data: {
          type: 'WHATSAPP',
          content: template.content,
          ctaText: template.ctaText,
          ctaLink: template.ctaLink,
          processedContent,
          processedCtaText,
          processedCtaLink,
          previewData,
          characterCount: processedContent.length,
          maxLength: 4096
        }
      })
    }

    return NextResponse.json(
      { error: 'Unsupported template type' },
      { status: 400 }
    )

  } catch (error) {
    console.error('[Branded Template Preview API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/branded-templates/[id]/preview
 * Get template with default preview data
 */
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const template = await prisma.brandedTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const sampleData = createSampleData()

    return NextResponse.json({
      success: true,
      data: {
        template,
        sampleData
      }
    })

  } catch (error) {
    console.error('[Branded Template Preview API] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preview data' },
      { status: 500 }
    )
  }
}