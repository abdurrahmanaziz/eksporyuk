/**
 * API untuk manage Role-Mailketing List mapping
 * Admin dapat mengatur list Mailketing mana yang akan digunakan untuk setiap role
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET - Ambil semua role-list mappings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get all mappings
    const mappings = await prisma.roleMailketingList.findMany({
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Get count of users per role for context
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    })

    const roleCountMap = roleCounts.reduce((acc, item) => {
      acc[item.role] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Group mappings by role
    const groupedMappings = mappings.reduce((acc, mapping) => {
      if (!acc[mapping.role]) {
        acc[mapping.role] = {
          role: mapping.role,
          userCount: roleCountMap[mapping.role] || 0,
          lists: []
        }
      }
      acc[mapping.role].lists.push(mapping)
      return acc
    }, {} as Record<string, { role: string, userCount: number, lists: typeof mappings }>)

    // Add roles without mappings
    const allRoles: Role[] = ['ADMIN', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE']
    allRoles.forEach(role => {
      if (!groupedMappings[role]) {
        groupedMappings[role] = {
          role,
          userCount: roleCountMap[role] || 0,
          lists: []
        }
      }
    })

    return NextResponse.json({
      success: true,
      mappings: Object.values(groupedMappings),
      totalMappings: mappings.length,
      roles: allRoles
    })

  } catch (error: any) {
    console.error('❌ Error fetching role-list mappings:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Gagal mengambil data mappings'
    }, { status: 500 })
  }
}

// POST - Tambah mapping baru
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
    const { 
      role, 
      mailketingListId, 
      mailketingListName,
      autoAddOnRegister = true,
      autoAddOnUpgrade = true,
      description
    } = body

    // Validate required fields
    if (!role || !mailketingListId || !mailketingListName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Role, List ID, dan List Name wajib diisi'
      }, { status: 400 })
    }

    // Validate role
    const validRoles: Role[] = ['ADMIN', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE']
    if (!validRoles.includes(role as Role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Role tidak valid'
      }, { status: 400 })
    }

    // Check if mapping already exists
    const existing = await prisma.roleMailketingList.findUnique({
      where: {
        role_mailketingListId: {
          role: role as Role,
          mailketingListId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'Mapping untuk role dan list ini sudah ada'
      }, { status: 400 })
    }

    // Create mapping
    const mapping = await prisma.roleMailketingList.create({
      data: {
        role: role as Role,
        mailketingListId,
        mailketingListName,
        autoAddOnRegister,
        autoAddOnUpgrade,
        description
      }
    })

    console.log(`✅ Created role-list mapping: ${role} -> ${mailketingListName} (${mailketingListId})`)

    return NextResponse.json({
      success: true,
      message: 'Mapping berhasil dibuat',
      mapping
    })

  } catch (error: any) {
    console.error('❌ Error creating role-list mapping:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Gagal membuat mapping'
    }, { status: 500 })
  }
}

// DELETE - Hapus mapping
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID mapping wajib diisi'
      }, { status: 400 })
    }

    // Delete mapping
    await prisma.roleMailketingList.delete({
      where: { id }
    })

    console.log(`✅ Deleted role-list mapping: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Mapping berhasil dihapus'
    })

  } catch (error: any) {
    console.error('❌ Error deleting role-list mapping:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Gagal menghapus mapping'
    }, { status: 500 })
  }
}

// PATCH - Update mapping
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { id, isActive, autoAddOnRegister, autoAddOnUpgrade, description } = body

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID mapping wajib diisi'
      }, { status: 400 })
    }

    // Update mapping
    const mapping = await prisma.roleMailketingList.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(autoAddOnRegister !== undefined && { autoAddOnRegister }),
        ...(autoAddOnUpgrade !== undefined && { autoAddOnUpgrade }),
        ...(description !== undefined && { description })
      }
    })

    console.log(`✅ Updated role-list mapping: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Mapping berhasil diupdate',
      mapping
    })

  } catch (error: any) {
    console.error('❌ Error updating role-list mapping:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Gagal mengupdate mapping'
    }, { status: 500 })
  }
}
