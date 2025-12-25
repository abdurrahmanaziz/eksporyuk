import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PUT /api/admin/integrations/[id] - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, apiKey, apiSecret, webhookUrl, isActive, settings } = body
    const integrationId = params.id

    // Upsert integration
    const integration = await prisma.integration.upsert({
      where: { id: integrationId },
      create: {
        id: integrationId,
        name,
        displayName: body.displayName || name,
        description: body.description || '',
        apiKey: apiKey || '',
        apiSecret: apiSecret || null,
        webhookUrl: webhookUrl || null,
        isActive: isActive || false,
        settings: settings || {}
      },
      update: {
        apiKey: apiKey || '',
        apiSecret: apiSecret || null,
        webhookUrl: webhookUrl || null,
        isActive: isActive || false,
        settings: settings || {}
      }
    })

    return NextResponse.json({
      success: true,
      integration
    })

  } catch (error: any) {
    console.error('Update integration error:', error)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}

// GET /api/admin/integrations/[id] - Get specific integration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id }
    })

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      integration
    })

  } catch (error: any) {
    console.error('Get integration error:', error)
    return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 })
  }
}