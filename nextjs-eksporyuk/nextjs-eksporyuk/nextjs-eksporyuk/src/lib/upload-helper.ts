/**
 * Unified Upload Helper - Supports Vercel Blob (production) and local storage (development)
 * 
 * Usage:
 * import { uploadFile } from '@/lib/upload-helper'
 * const { url } = await uploadFile(file, 'avatars')
 */

import { put } from '@vercel/blob'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// Check if Vercel Blob is configured
const isVercelBlobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN

export interface UploadResult {
  success: boolean
  url: string
  filename: string
  storage: 'vercel-blob' | 'local'
}

export interface UploadOptions {
  /** Folder path within uploads (e.g., 'avatars', 'courses', 'covers') */
  folder: string
  /** Custom filename prefix (default: timestamp) */
  prefix?: string
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number
  /** Allowed MIME types (default: images only) */
  allowedTypes?: string[]
}

const DEFAULT_OPTIONS: Partial<UploadOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
}

/**
 * Upload file to Vercel Blob (production) or local storage (development)
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // Validate file size
  if (opts.maxSize && file.size > opts.maxSize) {
    throw new Error(`File size exceeds maximum allowed (${opts.maxSize / 1024 / 1024}MB)`)
  }

  // Validate file type
  if (opts.allowedTypes && opts.allowedTypes.length > 0) {
    if (!opts.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed. Allowed: ${opts.allowedTypes.join(', ')}`)
    }
  }

  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop() || 'bin'
  const prefix = opts.prefix || 'file'
  const filename = `${prefix}-${timestamp}.${extension}`
  const blobPath = `${opts.folder}/${filename}`

  if (isVercelBlobConfigured) {
    // Upload to Vercel Blob (cloud storage - persists in production!)
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    console.log(`[Upload] File uploaded to Vercel Blob: ${blob.url}`)

    return {
      success: true,
      url: blob.url,
      filename,
      storage: 'vercel-blob'
    }
  } else {
    // Fallback to local storage for development
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', opts.folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // For local dev, use localhost URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${appUrl}/uploads/${opts.folder}/${filename}`

    console.log(`[Upload] File uploaded locally: ${url}`)

    return {
      success: true,
      url,
      filename,
      storage: 'local'
    }
  }
}

/**
 * Upload file from buffer (for server-side processing)
 */
export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  folder: string,
  contentType: string = 'application/octet-stream'
): Promise<UploadResult> {
  const blobPath = `${folder}/${filename}`

  if (isVercelBlobConfigured) {
    const blob = await put(blobPath, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType,
    })

    console.log(`[Upload] Buffer uploaded to Vercel Blob: ${blob.url}`)

    return {
      success: true,
      url: blob.url,
      filename,
      storage: 'vercel-blob'
    }
  } else {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const url = `${appUrl}/uploads/${folder}/${filename}`

    console.log(`[Upload] Buffer uploaded locally: ${url}`)

    return {
      success: true,
      url,
      filename,
      storage: 'local'
    }
  }
}

/**
 * Check if we're using Vercel Blob
 */
export function isUsingVercelBlob(): boolean {
  return isVercelBlobConfigured
}
