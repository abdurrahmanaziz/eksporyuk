import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

interface Props {
  params: {
    id: string
  }
}

/**
 * GET /api/admin/branded-templates/[id]
 * Get single branded template by ID
 */
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.brandedTemplate.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        usages: {
          select: {
            id: true,
            userId: true,
            userRole: true,
            context: true,
            success: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            usages: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
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
 * PATCH /api/admin/branded-templates/[id]
 * Update branded template (partial update)
 */
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingTemplate = await prisma.brandedTemplate.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if system template (cannot be deleted/modified)
    if (existingTemplate.isSystem) {
      return NextResponse.json(
        { error: 'Cannot modify system template' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      type,
      roleTarget,
      subject,
      content,
      ctaText,
      ctaLink,
      priority,
      isDefault,
      isActive,
      tags,
      variables,
      previewData,
      customBranding
    } = body

    // Generate new slug if name changed
    let slug = existingTemplate.slug
    if (name && name !== existingTemplate.name) {
      const baseSlug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      let newSlug = baseSlug
      let counter = 1
      
      while (await prisma.brandedTemplate.findFirst({ 
        where: { 
          slug: newSlug,
          id: { not: params.id }
        } 
      })) {
        newSlug = `${baseSlug}-${counter}`
        counter++
      }
      slug = newSlug
    }

    // If setting as default, unset other defaults in same category
    if (isDefault && !existingTemplate.isDefault) {
      await prisma.brandedTemplate.updateMany({
        where: {
          category: category || existingTemplate.category,
          type: type || existingTemplate.type,
          isDefault: true,
          id: { not: params.id }
        },
        data: {
          isDefault: false
        }
      })
    }

    const template = await prisma.brandedTemplate.update({
      where: { id: params.id },
      data: {
        ...(name && { name, slug }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(type && { type }),
        ...(roleTarget !== undefined && { roleTarget }),
        ...(subject && { subject }),
        ...(content && { content }),
        ...(ctaText !== undefined && { ctaText }),
        ...(ctaLink !== undefined && { ctaLink }),
        ...(priority && { priority }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
        ...(tags && { tags }),
        ...(variables !== undefined && { variables }),
        ...(previewData !== undefined && { previewData }),
        ...(customBranding !== undefined && { customBranding })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('[Branded Template API] PATCH Error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/branded-templates/[id]
 * Update branded template (full update - alias for PATCH)
 */
export async function PUT(request: NextRequest, { params }: Props) {
  return PATCH(request, { params })
}

/**
 * DELETE /api/admin/branded-templates/[id]
 * Delete branded template
 */
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.brandedTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if system template (cannot be deleted)
    if (template.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system template' },
        { status: 403 }
      )
    }

    // Check if template is being used
    const usageCount = await prisma.brandedTemplateUsage.count({
      where: { templateId: params.id }
    })

    if (usageCount > 0) {
      // Soft delete - just deactivate
      await prisma.brandedTemplate.update({
        where: { id: params.id },
        data: { isActive: false }
      })

      return NextResponse.json({
        success: true,
        message: 'Template deactivated due to existing usage history'
      })
    } else {
      // Hard delete - no usage history
      await prisma.brandedTemplate.delete({
        where: { id: params.id }
      })

      return NextResponse.json({
        success: true,
        message: 'Template deleted permanently'
      })
    }

  } catch (error) {
    console.error('[Branded Template API] DELETE Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}