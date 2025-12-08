import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user's membership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userMemberships: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        transactions: {
          where: { 
            status: 'SUCCESS',
            type: 'MEMBERSHIP' 
          },
          orderBy: { createdAt: 'desc' },
          include: {
            membership: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    const activeMembership = user.userMemberships[0]
    
    if (!activeMembership) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active membership' 
      }, { status: 404 })
    }

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
      recentTransactions: user.transactions.slice(0, 5).map(t => ({
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