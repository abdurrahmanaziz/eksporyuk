import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { getNextMemberCode, assignMemberCode } from '@/lib/member-code'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// POST - Update all users without memberCode
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin-equivalent role (allow ADMIN/FOUNDER/CO_FOUNDER)
    const allowedRoles = ['ADMIN', 'FOUNDER', 'CO_FOUNDER']
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const dbRole = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (dbRole && dbRole.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'ADMIN' },
      })
    }

    // Find all users without memberCode
    const usersWithoutCode = await prisma.user.findMany({
      where: {
        OR: [
          { memberCode: null },
          { memberCode: '' }
        ]
      },
      orderBy: { createdAt: 'asc' }, // Assign in order of registration
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    if (usersWithoutCode.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Semua user sudah memiliki Member ID',
        updated: 0,
        users: []
      })
    }

    // Update each user with a new memberCode
    const updatedUsers = []
    
    for (const user of usersWithoutCode) {
      try {
        const newCode = await assignMemberCode(user.id)
        updatedUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          memberCode: newCode
        })
      } catch (err) {
        console.error(`Failed to assign code to user ${user.id}:`, err)
      }
    }

    console.log(`[Update Member Codes] Updated ${updatedUsers.length} users with new member codes`)

    return NextResponse.json({
      success: true,
      message: `Berhasil update ${updatedUsers.length} Member ID`,
      updated: updatedUsers.length,
      users: updatedUsers
    })
  } catch (error) {
    console.error('Error updating member codes:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update member codes' 
    }, { status: 500 })
  }
}

// GET - Check how many users don't have memberCode
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin-equivalent role (allow ADMIN/FOUNDER/CO_FOUNDER)
    const allowedRoles = ['ADMIN', 'FOUNDER', 'CO_FOUNDER']
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const dbRole = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (dbRole && dbRole.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'ADMIN' },
      })
    }

    // Count users without memberCode
    const countWithoutCode = await prisma.user.count({
      where: {
        OR: [
          { memberCode: null },
          { memberCode: '' }
        ]
      }
    })

    const totalUsers = await prisma.user.count()

    return NextResponse.json({
      success: true,
      totalUsers,
      usersWithoutMemberCode: countWithoutCode,
      usersWithMemberCode: totalUsers - countWithoutCode
    })
  } catch (error) {
    console.error('Error checking member codes:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to check member codes' 
    }, { status: 500 })
  }
}
