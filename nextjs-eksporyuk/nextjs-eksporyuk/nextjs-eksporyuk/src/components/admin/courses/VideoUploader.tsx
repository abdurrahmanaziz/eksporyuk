'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, Video, X, CheckCircle, AlertCircle, Loader2,
  Film, Clock, HardDrive
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface VideoUploaderProps {
  courseId: string
  moduleId: string
  lessonId: string
  currentVideoUrl?: string
  onUploadComplete?: (videoUrl: string, duration?: number) => void
  onDelete?: () => void
}

export function VideoUploader({
  courseId,
  moduleId,
  lessonId,
  currentVideoUrl,
  onUploadComplete,
  onDelete
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(currentVideoUrl || null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!validTypes.includes(file.type)) {
      setError('Format video tidak didukung. Gunakan MP4, WebM, OGG, atau MOV')
      return
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Ukuran file terlalu besar. Maksimal 500MB')
      return
    }

    setError(null)
    setVideoFile(file)

    // Create preview
    const url = URL.createObjectURL(file)
    setVideoPreview(url)

    // Extract duration
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      setVideoDuration(Math.floor(video.duration))
    }
    video.src = url
  }

  const handleUpload = async () => {
    if (!videoFile) {
      setError('Pilih file video terlebih dahulu')
      return
    }

    try {
      setUploading(true)
      setError(null)
      setProgress(0)

      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedName = videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${courseId}/${lessonId}/${timestamp}-${sanitizedName}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('course-videos')
        .upload(fileName, videoFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setProgress(percentCompleted)
          }
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(data.path)

      // Save to database via API
      const response = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/video/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            videoUrl: urlData.publicUrl,
            videoId: data.path,
            duration: videoDuration
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save video')
      }

      toast.success('Video berhasil diupload!')
      
      if (onUploadComplete) {
        onUploadComplete(urlData.publicUrl, videoDuration || undefined)
      }

      // Reset form
      setVideoFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Upload gagal'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDelete = async () => {
    if (!currentVideoUrl) return

    if (!confirm('Hapus video ini? Tindakan tidak dapat dibatalkan.')) {
      return
    }

    try {
      setDeleting(true)

      const response = await fetch(
        `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/video/upload`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete video')
      }

      toast.success('Video berhasil dihapus')
      setVideoPreview(null)
      
      if (onDelete) {
        onDelete()
      }
    } catch (err) {
      console.error('Delete error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus video'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Current Video Preview */}
        {videoPreview && !videoFile && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Video Saat Ini</h4>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Hapus Video
                  </>
                )}
              </Button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={videoPreview}
                controls
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            
            {!videoFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Upload Video</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      MP4, WebM, OGG, MOV (max 500MB)
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Video Preview */}
                    <div className="w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0">
                      <video
                        src={videoPreview || undefined}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{videoFile.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(videoFile.size)}
                            </span>
                            {videoDuration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(videoDuration)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setVideoFile(null)
                            setVideoPreview(currentVideoUrl || null)
                            setVideoDuration(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ''
                            }
                          }}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Upload Progress */}
                      {uploading && (
                        <div className="mt-3 space-y-2">
                          <Progress value={progress} />
                          <p className="text-xs text-center text-muted-foreground">
                            Uploading... {progress}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          {videoFile && !uploading && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload Video
            </Button>
          )}

          {/* Info */}
          <Alert>
            <Film className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Format: MP4 (direkomendasikan), WebM, OGG, MOV</li>
                <li>Ukuran maksimal: 500MB</li>
                <li>Resolusi: 720p atau 1080p untuk kualitas terbaik</li>
                <li>Video akan otomatis tersimpan di cloud storage</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
