import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/upload-helper'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    const updateData: any = {}

    // Handle legality file upload to Vercel Blob
    if (legalityFile && legalityFile.size > 0) {
      const result = await uploadFile(legalityFile, {
        folder: `suppliers/${id}`,
        prefix: 'legality',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      })
      updateData.legalityDoc = result.url
    }

    // Handle NIB file upload to Vercel Blob
    if (nibFile && nibFile.size > 0) {
      const result = await uploadFile(nibFile, {
        folder: `suppliers/${id}`,
        prefix: 'nib',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      })
      updateData.nibDoc = result.url
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
