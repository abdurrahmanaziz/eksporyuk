import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { sendBrandedEmail, previewTemplate, extractTemplateVariables } from '@/lib/email-template-helper'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admin can access this
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const slug = searchParams.get('slug')
    
    // List all templates
    if (action === 'list' || !action) {
      const templates = await prisma.brandedTemplate.findMany({
        where: { type: 'EMAIL' },
        orderBy: { createdAt: 'desc' }
      })
      
      return NextResponse.json({
        success: true,
        count: templates.length,
        templates: templates.map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          subject: t.subject,
          category: t.category,
          isActive: t.isActive,
          variables: extractTemplateVariables(t.content, t.subject),
          createdAt: t.createdAt
        }))
      })
    }
    
    // Get template details
    if (action === 'get' && slug) {
      const template = await prisma.brandedTemplate.findUnique({
        where: { slug }
      })
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        template: {
          ...template,
          variables: extractTemplateVariables(template.content, template.subject)
        }
      })
    }
    
    // Preview template
    if (action === 'preview' && slug) {
      // Get sample variables from query params
      const variables: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        if (key !== 'action' && key !== 'slug') {
          variables[key] = value
        }
      })
      
      const preview = await previewTemplate(slug, variables)
      
      return NextResponse.json({
        success: true,
        preview
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('❌ Template API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admin can send test emails
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { action, slug, to, variables } = body
    
    if (action === 'send-test' && slug && to) {
      // Send test email using template
      await sendBrandedEmail(to, slug, variables || {})
      
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${to} using template '${slug}'`
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('❌ Template send error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
