import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { dashboardType } = await request.json()
    
    if (!dashboardType) {
      return NextResponse.json({ error: 'Dashboard type required' }, { status: 400 })
    }
    
    // Save user preference (optional feature)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferredDashboard: dashboardType
      }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error saving dashboard preference:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}