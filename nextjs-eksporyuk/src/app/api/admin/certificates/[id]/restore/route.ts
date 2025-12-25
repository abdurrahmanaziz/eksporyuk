import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PATCH /api/admin/certificates/[id]/restore - Restore certificate (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const certificateId = params.id

    // Update certificate to valid
    const certificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        isValid: true
      }
    })

    return NextResponse.json({
      message: 'Certificate restored successfully',
      certificate
    })

  } catch (error) {
    console.error('Failed to restore certificate:', error)
    return NextResponse.json(
      { error: 'Failed to restore certificate' },
      { status: 500 }
    )
  }
}
