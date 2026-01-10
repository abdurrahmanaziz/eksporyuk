import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { createBrandedEmailAsync } from '@/lib/branded-template-engine'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/branded-templates/render
 * Render branded template HTML preview
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, slug, variables } = body

    // Get template
    let template
    if (templateId) {
      template = await prisma.brandedTemplate.findUnique({
        where: { id: templateId }
      })
    } else if (slug) {
      template = await prisma.brandedTemplate.findFirst({
        where: { slug }
      })
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Prepare variables with defaults
    const mergedVariables = {
      name: session.user.name || 'Admin User',
      email: session.user.email,
      userId: session.user.id,
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com',
      date: new Date().toLocaleDateString('id-ID'),
      ...(template.variables as any),
      ...variables
    }

    // Generate HTML
    const htmlContent = await createBrandedEmailAsync({
      subject: template.subject,
      content: template.content,
      variables: mergedVariables,
      ctaText: template.ctaText,
      ctaLink: template.ctaLink
    })

    return NextResponse.json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          subject: template.subject,
          category: template.category,
          type: template.type
        },
        html: htmlContent,
        variables: mergedVariables
      }
    })

  } catch (error) {
    console.error('[Branded Templates Render API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to render template', details: String(error) },
      { status: 500 }
    )
  }
}
