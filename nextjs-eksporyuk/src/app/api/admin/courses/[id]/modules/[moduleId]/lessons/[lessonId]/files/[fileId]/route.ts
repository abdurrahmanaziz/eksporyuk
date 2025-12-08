import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// DELETE - Remove a file
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; moduleId: string; lessonId: string; fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { fileId } = params

    await prisma.lessonFile.delete({
      where: { id: fileId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE lesson file error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
