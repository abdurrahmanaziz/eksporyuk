import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user - no relations available for userMemberships, transactions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Get active membership separately
    const activeMembership = await prisma.userMembership.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    })
    
    if (!activeMembership) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active membership' 
      }, { status: 404 })
    }

    // Get recent transactions separately
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: user.id,
        status: 'SUCCESS',
        type: 'MEMBERSHIP' 
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Get learning progress (simulated for now)
    const progressData = {
      completedModules: Math.floor(Math.random() * 12) + 1,
      totalModules: 12,
      completedQuizzes: Math.floor(Math.random() * 8) + 1,
      totalQuizzes: 8,
      certificatesEarned: Math.floor(Math.random() * 3),
      lastAccessDate: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      membership: {
        id: activeMembership.id,
        status: activeMembership.status,
        startDate: activeMembership.startDate,
        endDate: activeMembership.endDate,
        user: {
          name: user.name,
          email: user.email
        }
      },
      progress: progressData,
      recentTransactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt,
        type: t.type
      }))
    })

  } catch (error) {
    console.error('Member API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    switch (action) {
      case 'update_progress':
        // Update learning progress
        // This would integrate with your learning management system
        return NextResponse.json({
          success: true,
          message: 'Progress updated successfully'
        })

      case 'mark_module_complete':
        // Mark a module as completed
        const { moduleId } = data
        
        // Here you would update module completion in your LMS
        // For now, just return success
        return NextResponse.json({
          success: true,
          message: 'Module marked as complete'
        })

      case 'request_certificate':
        // Generate certificate request
        const { courseId } = data
        
        // Logic to generate and send certificate
        return NextResponse.json({
          success: true,
          message: 'Certificate request submitted'
        })

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Member update error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}