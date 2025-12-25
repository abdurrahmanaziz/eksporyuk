import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PUT - Update follow-up template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Check ownership
    const existing = await prisma.followUpTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Admin bisa edit semua, Affiliate hanya miliknya
    if (session.user.role !== 'ADMIN' && existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const template = await prisma.followUpTemplate.update({
      where: { id },
      data: {
        name: body.name,
        triggerHours: parseInt(body.triggerHours),
        message: body.message,
        channel: body.channel,
        isActive: body.isActive !== undefined ? body.isActive : true,
        useMailkiting: body.useMailkiting || false,
        useStarsender: body.useStarsender || false,
        useOnesignal: body.useOnesignal || false,
        usePusher: body.usePusher || false
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE - Delete follow-up template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check ownership
    const existing = await prisma.followUpTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Admin bisa hapus semua, Affiliate hanya miliknya
    if (session.user.role !== 'ADMIN' && existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.followUpTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
