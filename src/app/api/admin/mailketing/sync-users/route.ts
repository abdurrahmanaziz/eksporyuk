/**
 * API untuk sync users ke Mailketing lists
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { syncAllUsersToLists, addUserToRoleLists } from '@/lib/services/mailketing-list-service'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

// POST - Sync users to lists
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { action, userId, role } = body

    if (action === 'sync-all') {
      // Sync all users to their role lists
      console.log('🔄 Starting full sync of all users to Mailketing lists...')
      const result = await syncAllUsersToLists()
      
      return NextResponse.json({
        success: result.success,
        message: `Sync selesai: ${result.processed} users, ${result.added} additions, ${result.errors} errors`,
        ...result
      })
    }

    if (action === 'sync-user' && userId) {
      // Sync single user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })

      if (!user) {
        return NextResponse.json({ 
          success: false, 
          error: 'User tidak ditemukan' 
        }, { status: 404 })
      }

      const result = await addUserToRoleLists(userId, user.role as Role, { isRegistration: true })
      
      return NextResponse.json({
        success: result.success,
        message: result.listsAdded.length > 0 
          ? `Berhasil menambahkan ke ${result.listsAdded.length} list` 
          : 'Tidak ada list baru yang ditambahkan',
        ...result
      })
    }

    if (action === 'sync-role' && role) {
      // Sync all users with specific role
      const users = await prisma.user.findMany({
        where: { role: role as Role },
        select: { id: true }
      })

      let added = 0
      let errors = 0

      for (const user of users) {
        const result = await addUserToRoleLists(user.id, role as Role, { isRegistration: true })
        added += result.listsAdded.length
        errors += result.errors.length
      }

      return NextResponse.json({
        success: errors === 0,
        message: `Sync ${users.length} users dengan role ${role}: ${added} additions, ${errors} errors`,
        processed: users.length,
        added,
        errors
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Action tidak valid' 
    }, { status: 400 })

  } catch (error: any) {
    console.error('❌ Error in sync API:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Gagal melakukan sync'
    }, { status: 500 })
  }
}
