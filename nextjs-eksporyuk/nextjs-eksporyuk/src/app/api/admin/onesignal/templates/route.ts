import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get all notification templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('[Templates GET] Session user:', session?.user?.email, 'Role:', session?.user?.role)

    if (!session?.user) {
      console.log('[Templates GET] No session found')
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) {
      console.log('[Templates GET] Forbidden - Invalid role:', session.user.role)
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    console.log('[Templates GET] Fetching templates...')
    const templates = await prisma.oneSignalTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    console.log('[Templates GET] Found', templates.length, 'templates')

    return NextResponse.json({
      success: true,
      templates
    })
  } catch (error) {
    console.error('[OneSignal Templates] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, title, message, url, imageUrl, targetType, targetValue } = body

    if (!name || !title || !message) {
      return NextResponse.json({ error: 'Name, title, and message are required' }, { status: 400 })
    }

    const template = await prisma.oneSignalTemplate.create({
      data: {
        name,
        title,
        message,
        url: url || null,
        imageUrl: imageUrl || null,
        targetType: targetType || 'all',
        targetValue: targetValue || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      template
    })
  } catch (error) {
    console.error('[OneSignal Templates] Create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, title, message, url, imageUrl, targetType, targetValue } = body

    if (!id || !name || !title || !message) {
      return NextResponse.json({ error: 'ID, name, title, and message are required' }, { status: 400 })
    }

    const template = await prisma.oneSignalTemplate.update({
      where: { id },
      data: {
        name,
        title,
        message,
        url: url || null,
        imageUrl: imageUrl || null,
        targetType: targetType || 'all',
        targetValue: targetValue || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      template
    })
  } catch (error) {
    console.error('[OneSignal Templates] Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    await prisma.oneSignalTemplate.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('[OneSignal Templates] Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
