import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Generate dokumen baru
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check jika user adalah member
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        userMemberships: { 
          where: { membership: { isActive: true } }
        } 
      }
    })

    // Jika bukan member dan tidak ada active membership, tolak
    const isMember = user?.userMemberships && user.userMemberships.length > 0
    if (!isMember && session.user.role === 'MEMBER_FREE') {
      return NextResponse.json({
        error: 'Member-only feature',
        message: 'Fitur ini hanya tersedia untuk member. Silakan gabung komunitas!'
      }, { status: 403 })
    }

    const body = await req.json()
    const { templateId, title, documentNo, data } = body

    if (!templateId || !title || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get template
    const template = await prisma.exportDocument.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Generate HTML dari template dengan data
    let documentHtml = template.templateHtml
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      documentHtml = documentHtml.replace(new RegExp(placeholder, 'g'), String(value || ''))
    })

    // Create generated document
    const doc = await prisma.generatedDocument.create({
      data: {
        userId: session.user.id,
        templateId,
        title,
        documentNo,
        documentData: data,
        documentHtml,
        status: 'GENERATED'
      }
    })

    // Update template usage count
    await prisma.exportDocument.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Error generating document:', error)
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 })
  }
}
