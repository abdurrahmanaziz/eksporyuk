/**
 * File Upload Utility untuk Community Posts & Comments
 * Support untuk: images, videos, documents (PDF, DOC, XLS, dll)
 * 
 * Security:
 * - Validate file types
 * - Validate file sizes
 * - Store with unique names
 * - Clean path traversal attempts
 */

export const UPLOAD_CONFIG = {
  // Image constraints
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  
  // Video constraints
  videos: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedExtensions: ['.mp4', '.webm', '.mov', '.avi', '.mkv']
  },
  
  // Document constraints
  documents: {
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/octet-stream', // For some files that browser reports as generic
    ],
    allowedExtensions: [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
      '.zip', '.rar', '.7z'
    ]
  },
  
  // Comment limits
  comment: {
    maxImages: 4,
    maxVideos: 1,
    maxDocuments: 1
  },
  
  // Post limits
  post: {
    maxImages: 5,
    maxVideos: 1,
    maxDocuments: 2
  }
}

interface FileValidationResult {
  valid: boolean
  error?: string
  mimetype?: string
  size?: number
}

/**
 * Validate file untuk image upload
 */
export function validateImageFile(file: File | FormDataEntryValue): FileValidationResult {
  if (!(file instanceof File)) {
    return { valid: false, error: 'Invalid file' }
  }

  // Check size
  if (file.size > UPLOAD_CONFIG.images.maxSize) {
    return { valid: false, error: `Ukuran gambar terlalu besar. Max: 5MB, Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB` }
  }

  // Check MIME type
  if (!UPLOAD_CONFIG.images.allowedTypes.includes(file.type)) {
    return { valid: false, error: `Format gambar tidak didukung. Gunakan: JPG, PNG, GIF, WebP` }
  }

  return { valid: true, mimetype: file.type, size: file.size }
}

/**
 * Validate file untuk video upload
 */
export function validateVideoFile(file: File | FormDataEntryValue): FileValidationResult {
  if (!(file instanceof File)) {
    return { valid: false, error: 'Invalid file' }
  }

  // Check size
  if (file.size > UPLOAD_CONFIG.videos.maxSize) {
    return { valid: false, error: `Ukuran video terlalu besar. Max: 100MB, Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB` }
  }

  // Check MIME type
  if (!UPLOAD_CONFIG.videos.allowedTypes.includes(file.type)) {
    return { valid: false, error: `Format video tidak didukung. Gunakan: MP4, WebM, MOV` }
  }

  return { valid: true, mimetype: file.type, size: file.size }
}

/**
 * Validate file untuk document upload
 */
export function validateDocumentFile(file: File | FormDataEntryValue): FileValidationResult {
  if (!(file instanceof File)) {
    return { valid: false, error: 'Invalid file' }
  }

  // Check size
  if (file.size > UPLOAD_CONFIG.documents.maxSize) {
    return { valid: false, error: `Ukuran dokumen terlalu besar. Max: 25MB, Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB` }
  }

  // Check MIME type
  if (!UPLOAD_CONFIG.documents.allowedTypes.includes(file.type)) {
    return { valid: false, error: `Format dokumen tidak didukung. Gunakan: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV` }
  }

  return { valid: true, mimetype: file.type, size: file.size }
}

/**
 * Get file extension dari filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.substring(lastDot).toLowerCase()
}

/**
 * Generate unique filename dengan timestamp dan random string
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = getFileExtension(originalFilename)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const safeName = originalFilename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50)
  
  return `${safeName.replace(ext, '')}_${timestamp}_${random}${ext}`
}

/**
 * Validate comment file uploads
 */
export function validateCommentFiles(
  images?: File[],
  videos?: File[],
  documents?: File[]
): FileValidationResult {
  // Check image count
  if (images && images.length > UPLOAD_CONFIG.comment.maxImages) {
    return { valid: false, error: `Max ${UPLOAD_CONFIG.comment.maxImages} gambar per komentar` }
  }

  // Check video count
  if (videos && videos.length > UPLOAD_CONFIG.comment.maxVideos) {
    return { valid: false, error: `Max ${UPLOAD_CONFIG.comment.maxVideos} video per komentar` }
  }

  // Check document count
  if (documents && documents.length > UPLOAD_CONFIG.comment.maxDocuments) {
    return { valid: false, error: `Max ${UPLOAD_CONFIG.comment.maxDocuments} dokumen per komentar` }
  }

  // Validate each file
  if (images) {
    for (const img of images) {
      const validation = validateImageFile(img)
      if (!validation.valid) return validation
    }
  }

  if (videos) {
    for (const vid of videos) {
      const validation = validateVideoFile(vid)
      if (!validation.valid) return validation
    }
  }

  if (documents) {
    for (const doc of documents) {
      const validation = validateDocumentFile(doc)
      if (!validation.valid) return validation
    }
  }

  return { valid: true }
}

/**
 * Validate post file uploads
 */
export function validatePostFiles(
  images?: File[],
  videos?: File[],
  documents?: File[]
): FileValidationResult {
  // Check image count
  if (images && images.length > UPLOAD_CONFIG.post.maxImages) {
    return { valid: false, error: `Max ${UPLOAD_CONFIG.post.maxImages} gambar per postingan` }
  }

  // Check video count
  if (videos && videos.length > UPLOAD_CONFIG.post.maxVideos) {
    return { valid: false, error: `Max ${UPLOAD_CONFIG.post.maxVideos} video per postingan` }
  }

  // Check document count
  if (documents && documents.length > UPLOAD_CONFIG.post.maxDocuments) {
    return { valid: false, error: `Max ${UPLOAD_CONFIG.post.maxDocuments} dokumen per postingan` }
  }

  // Validate each file
  if (images) {
    for (const img of images) {
      const validation = validateImageFile(img)
      if (!validation.valid) return validation
    }
  }

  if (videos) {
    for (const vid of videos) {
      const validation = validateVideoFile(vid)
      if (!validation.valid) return validation
    }
  }

  if (documents) {
    for (const doc of documents) {
      const validation = validateDocumentFile(doc)
      if (!validation.valid) return validation
    }
  }

  return { valid: true }
}

/**
 * Get file icon class untuk display
 */
export function getFileIcon(filename: string): string {
  const ext = getFileExtension(filename).toLowerCase()
  
  const iconMap: Record<string, string> = {
    '.pdf': '📄',
    '.doc': '📝',
    '.docx': '📝',
    '.xls': '📊',
    '.xlsx': '📊',
    '.ppt': '🎯',
    '.pptx': '🎯',
    '.txt': '📃',
    '.csv': '📊',
    '.zip': '🗜️',
    '.rar': '🗜️'
  }
  
  return iconMap[ext] || '📎'
}

/**
 * Format file size untuk display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
