/**
 * POST /api/chat/upload
 * Upload file/image/video to chat
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { chatService } from '@/lib/services/chatService'
import { uploadFile } from '@/lib/upload-helper'

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const roomId = formData.get('roomId') as string
    const replyToId = formData.get('replyToId') as string | null
    
    if (!file || !roomId) {
      return NextResponse.json(
        { error: 'File and roomId required' },
        { status: 400 }
      )
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit', message: 'Ukuran file maksimal 10MB' },
        { status: 400 }
      )
    }
    
    // Determine file type and validate
    const mimeType = file.type
    let messageType: 'IMAGE' | 'VIDEO' | 'FILE'
    let attachmentType: string
    
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      messageType = 'IMAGE'
      attachmentType = 'image'
    } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      messageType = 'VIDEO'
      attachmentType = 'video'
    } else if (ALLOWED_FILE_TYPES.includes(mimeType)) {
      messageType = 'FILE'
      attachmentType = 'file'
    } else {
      return NextResponse.json(
        { error: 'File type not allowed', message: 'Tipe file tidak diizinkan' },
        { status: 400 }
      )
    }
    
    // Upload to Vercel Blob (production) or local (development)
    const result = await uploadFile(file, {
      folder: `chat/${roomId}`,
      prefix: 'chat',
      maxSize: MAX_FILE_SIZE,
      allowedTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_FILE_TYPES],
    })
    
    // Create message
    const message = await chatService.sendMessage({
      roomId,
      senderId: session.user.id,
      content: file.name,
      type: messageType.toLowerCase(),
      attachmentUrl: result.url,
      attachmentType,
      attachmentSize: file.size,
      attachmentName: file.name,
      replyToId: replyToId || undefined,
    })
    
    return NextResponse.json({
      success: true,
      message,
      url: result.url,
      storage: result.storage,
    })
  } catch (error: any) {
    console.error('[API] Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', message: error.message },
      { status: 500 }
    )
  }
}
