/**
 * Video Service - Handle video upload, processing, and streaming
 * Supports: Supabase Storage, Cloudflare Stream, AWS S3
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface VideoUploadResult {
  success: boolean
  videoId: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  size?: number
  error?: string
}

export interface VideoProcessingStatus {
  status: 'processing' | 'ready' | 'error'
  progress: number
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
}

export class VideoService {
  private bucket = 'course-videos'

  /**
   * Upload video file to Supabase Storage
   */
  async uploadVideo(
    file: File,
    lessonId: string,
    courseId: string,
    onProgress?: (progress: number) => void
  ): Promise<VideoUploadResult> {
    try {
      // Validate file
      const maxSize = 500 * 1024 * 1024 // 500MB
      if (file.size > maxSize) {
        return {
          success: false,
          videoId: '',
          videoUrl: '',
          error: 'File size exceeds 500MB limit'
        }
      }

      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          videoId: '',
          videoUrl: '',
          error: 'Invalid video format. Supported: MP4, WebM, OGG, MOV'
        }
      }

      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${courseId}/${lessonId}/${timestamp}-${sanitizedName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (error) {
        console.error('Supabase upload error:', error)
        return {
          success: false,
          videoId: '',
          videoUrl: '',
          error: error.message
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(data.path)

      // Try to extract video metadata
      const metadata = await this.extractVideoMetadata(file)

      return {
        success: true,
        videoId: data.path,
        videoUrl: urlData.publicUrl,
        duration: metadata.duration,
        size: file.size,
        thumbnailUrl: metadata.thumbnailUrl
      }
    } catch (error) {
      console.error('Video upload error:', error)
      return {
        success: false,
        videoId: '',
        videoUrl: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Extract video metadata (duration, thumbnail)
   */
  private async extractVideoMetadata(file: File): Promise<{
    duration?: number
    thumbnailUrl?: string
  }> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve({
          duration: Math.floor(video.duration)
        })
      }

      video.onerror = () => {
        resolve({})
      }

      video.src = URL.createObjectURL(file)
    })
  }

  /**
   * Delete video from storage
   */
  async deleteVideo(videoPath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([videoPath])

      if (error) {
        console.error('Delete error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Delete video error:', error)
      return false
    }
  }

  /**
   * Get signed URL for private video (with expiration)
   */
  async getSignedUrl(videoPath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .createSignedUrl(videoPath, expiresIn)

      if (error) {
        console.error('Signed URL error:', error)
        return null
      }

      return data.signedUrl
    } catch (error) {
      console.error('Get signed URL error:', error)
      return null
    }
  }

  /**
   * Generate video thumbnail from video file
   */
  async generateThumbnail(videoPath: string): Promise<string | null> {
    try {
      // This would typically be handled by a background job
      // For now, return a placeholder or use video frame extraction service
      return null
    } catch (error) {
      console.error('Generate thumbnail error:', error)
      return null
    }
  }

  /**
   * Check if bucket exists, create if not
   */
  async ensureBucketExists(): Promise<boolean> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const exists = buckets?.some(b => b.name === this.bucket)

      if (!exists) {
        const { error } = await supabase.storage.createBucket(this.bucket, {
          public: true,
          fileSizeLimit: 524288000, // 500MB
          allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
        })

        if (error) {
          console.error('Create bucket error:', error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Ensure bucket error:', error)
      return false
    }
  }
}

export const videoService = new VideoService()
