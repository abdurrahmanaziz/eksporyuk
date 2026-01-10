import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

/**
 * POST /api/upload/payment-proof
 * Upload payment proof image to Vercel Blob storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const transactionId = formData.get('transactionId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'File diperlukan' },
        { status: 400 }
      )
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID diperlukan' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file harus JPG, PNG, atau WebP' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `payment-proof/${transactionId}-${timestamp}.${ext}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: blob.pathname
    })
  } catch (error) {
    console.error('[Upload Payment Proof] Error:', error)
    return NextResponse.json(
      { error: 'Gagal upload file' },
      { status: 500 }
    )
  }
}
