import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch all follow-up templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can view templates
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const where = { ownerType: 'admin' }

    const templates = await prisma.followUpTemplate.findMany({
      where,
      orderBy: { triggerHours: 'asc' }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST - Create new follow-up template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can create templates
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      triggerHours,
      message,
      channel,
      isActive,
      useMailkiting,
      useStarsender,
      useOnesignal,
      usePusher
    } = body

    // Validation
    if (!name || !triggerHours || !message || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const template = await prisma.followUpTemplate.create({
      data: {
        name,
        triggerHours: parseInt(triggerHours),
        message,
        channel,
        isActive: isActive !== undefined ? isActive : true,
        useMailkiting: useMailkiting || false,
        useStarsender: useStarsender || false,
        useOnesignal: useOnesignal || false,
        usePusher: usePusher || false,
        createdBy: session.user.id,
        ownerId: null,
        ownerType: 'admin'
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
