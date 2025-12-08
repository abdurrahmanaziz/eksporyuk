import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const legalityFile = formData.get('legalityFile') as File | null
    const nibFile = formData.get('nibFile') as File | null

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'suppliers', id)
    
    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const updateData: any = {}

    // Handle legality file upload
    if (legalityFile) {
      const legalityFileName = `legality-${Date.now()}.${legalityFile.name.split('.').pop()}`
      const legalityPath = join(uploadDir, legalityFileName)
      const bytes = await legalityFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(legalityPath, buffer)
      updateData.legalityDoc = `/uploads/suppliers/${id}/${legalityFileName}`
    }

    // Handle NIB file upload
    if (nibFile) {
      const nibFileName = `nib-${Date.now()}.${nibFile.name.split('.').pop()}`
      const nibPath = join(uploadDir, nibFileName)
      const bytes = await nibFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(nibPath, buffer)
      updateData.nibDoc = `/uploads/suppliers/${id}/${nibFileName}`
    }

    // Update supplier with file paths
    if (Object.keys(updateData).length > 0) {
      await prisma.supplier.update({
        where: { id },
        data: updateData,
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Files uploaded successfully',
      files: updateData
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
