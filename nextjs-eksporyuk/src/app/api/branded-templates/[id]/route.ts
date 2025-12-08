import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createBrandedEmail, processShortcodes, TemplateData } from '@/lib/branded-template-engine'

interface Props {
  params: {
    id: string
  }
}

/**
 * GET /api/branded-templates/[id]
 * Get single branded template for use
 */
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.brandedTemplate.findUnique({
      where: { 
        id: params.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        type: true,
        roleTarget: true,
        subject: true,
        content: true,
        ctaText: true,
        ctaLink: true,
        priority: true,
        isDefault: true,
        tags: true,
        variables: true,
        usageCount: true,
        createdAt: true
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check role access
    if (template.roleTarget && 
        template.roleTarget !== 'ALL' && 
        template.roleTarget !== session.user.role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('[Branded Template API] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/branded-templates/[id]
 * Use template - generate content with provided data and track usage
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.brandedTemplate.findUnique({
      where: { 
        id: params.id,
        isActive: true
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check role access
    if (template.roleTarget && 
        template.roleTarget !== 'ALL' && 
        template.roleTarget !== session.user.role) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { data: templateData, context } = body

    try {
      let result: any = {
        templateId: template.id,
        templateName: template.name,
        type: template.type
      }

      if (template.type === 'EMAIL') {
        // Generate email content
        const htmlContent = createBrandedEmail(
          template.subject,
          template.content,
          template.ctaText || undefined,
          template.ctaLink || undefined,
          templateData as TemplateData
        )

        result = {
          ...result,
          subject: processShortcodes(template.subject, templateData),
          content: processShortcodes(template.content, templateData),
          ctaText: template.ctaText ? processShortcodes(template.ctaText, templateData) : null,
          ctaLink: template.ctaLink ? processShortcodes(template.ctaLink, templateData) : null,
          htmlContent
        }
      } else if (template.type === 'WHATSAPP') {
        // Generate WhatsApp content
        const processedContent = processShortcodes(template.content, templateData)
        const processedCtaText = template.ctaText ? processShortcodes(template.ctaText, templateData) : null
        const processedCtaLink = template.ctaLink ? processShortcodes(template.ctaLink, templateData) : null

        result = {
          ...result,
          content: processedContent,
          ctaText: processedCtaText,
          ctaLink: processedCtaLink,
          characterCount: processedContent.length
        }
      }

      // Track usage
      await Promise.all([
        prisma.brandedTemplateUsage.create({
          data: {
            templateId: template.id,
            userId: session.user.id,
            userRole: session.user.role,
            context: context || 'MANUAL',
            success: true,
            metadata: {
              templateType: template.type,
              category: template.category,
              hasCustomData: !!templateData
            }
          }
        }),
        prisma.brandedTemplate.update({
          where: { id: template.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date()
          }
        })
      ])

      return NextResponse.json({
        success: true,
        data: result
      })

    } catch (processingError) {
      // Track failed usage
      await prisma.brandedTemplateUsage.create({
        data: {
          templateId: template.id,
          userId: session.user.id,
          userRole: session.user.role,
          context: context || 'MANUAL',
          success: false,
          error: processingError instanceof Error ? processingError.message : 'Processing failed',
          metadata: {
            templateType: template.type,
            category: template.category
          }
        }
      })

      throw processingError
    }

  } catch (error) {
    console.error('[Branded Template Usage API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process template' },
      { status: 500 }
    )
  }
}