'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { 
  Send, X, Loader2, Image as ImageIcon, 
  Video, File, AtSign, Users, Trash2
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from './avatar'
import { Button } from './button'
import { Textarea } from './textarea'
import { toast } from 'sonner'
import { 
  validateImageFile, 
  validateVideoFile, 
  validateDocumentFile,
  formatFileSize,
  getFileIcon
} from '@/lib/file-upload'

interface CommentInputProps {
  postId: string
  groupId?: string
  parentId?: string
  onCommentAdded?: () => void
  onCancel?: () => void
}

interface MentionUser {
  id: string
  name: string
  username: string | null
  avatar: string | null
}

interface MediaFile {
  url: string
  type: 'image' | 'video' | 'document'
  name: string
  size: number
}

/**
 * Enhanced Comment Input Component
 * Support: Text, Images, Videos, Documents, User Mentions, @all/@member tags
 * 
 * Features:
 * - User mention autocomplete (@username)
 * - @all and @member tags untuk notify semua group members
 * - Image upload dengan preview (max 4 images)
 * - Video upload (max 1 video)
 * - Document upload (max 1 document)
 * - Clean security validation
 * - Fast response time
 */
export default function CommentInput({
  postId,
  groupId,
  parentId,
  onCommentAdded,
  onCancel
}: CommentInputProps) {
  const { data: session } = useSession()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // State
  const [content, setContent] = useState('')
  const [images, setImages] = useState<MediaFile[]>([])
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [documents, setDocuments] = useState<MediaFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  
  // Mention autocomplete
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionLoading, setMentionLoading] = useState(false)
  
  // Tag flags
  const [taggedAll, setTaggedAll] = useState(false)
  const [taggedMembers, setTaggedMembers] = useState(false)

  // Text area auto-grow
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [content])

  // Handle mention search
  const handleMentionSearch = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setMentionResults([])
      setShowMentions(false)
      return
    }

    setMentionLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        limit: '10',
        ...(groupId && { groupId })
      })
      
      const response = await fetch(`/api/users/search?${params}`)
      const data = await response.json()
      
      if (data.users) {
        setMentionResults(data.users)
        setShowMentions(true)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setMentionLoading(false)
    }
  }, [groupId])

  // Handle content change and detect mention trigger
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setContent(text)

    // Detect @mention pattern
    const lastAt = text.lastIndexOf('@')
    if (lastAt !== -1) {
      const afterAt = text.substring(lastAt + 1)
      const nextSpace = afterAt.indexOf(' ')
      const isEnd = nextSpace === -1
      
      if (isEnd && afterAt.length > 0) {
        setMentionSearch(afterAt)
        handleMentionSearch(afterAt)
      } else if (nextSpace > 0) {
        // User finished typing, close suggestions
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
      setMentionSearch('')
    }
  }

  // Handle user selection from mention dropdown
  const selectMention = (user: MentionUser) => {
    const lastAt = content.lastIndexOf('@')
    if (lastAt !== -1) {
      const beforeAt = content.substring(0, lastAt)
      const afterAt = content.substring(lastAt + 1)
      const spacePos = afterAt.indexOf(' ')
      const afterMention = spacePos > -1 ? afterAt.substring(spacePos) : ''
      
      const newContent = `${beforeAt}@${user.username} ${afterMention}`.trimEnd()
      setContent(newContent)
    }
    
    setShowMentions(false)
    setMentionSearch('')
    setMentionResults([])
  }

  // Handle @all tag
  const handleTagAll = async () => {
    if (!groupId) {
      toast.error('Tag @all hanya tersedia di grup')
      return
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/members`)
      const data = await response.json()
      
      if (data.members && data.members.length > 0) {
        const mentions = data.members.map((m: MentionUser) => m.username).filter(Boolean)
        setContent(prev => {
          const newContent = prev.trim() + (prev.trim() ? ' ' : '') + `@all (${data.count} members)`
          return newContent
        })
        setTaggedAll(true)
        toast.success(`Tag @all diterapkan (${data.count} members akan dinotifikasi)`)
      }
    } catch (error) {
      console.error('Error tagging all:', error)
      toast.error('Gagal menerapkan tag @all')
    }
  }

  // Handle @member tag
  const handleTagMembers = async () => {
    if (!groupId) {
      toast.error('Tag @member hanya tersedia di grup')
      return
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/members`)
      const data = await response.json()
      
      if (data.members && data.members.length > 0) {
        setContent(prev => {
          const newContent = prev.trim() + (prev.trim() ? ' ' : '') + `@member (${data.count} members)`
          return newContent
        })
        setTaggedMembers(true)
        toast.success(`Tag @member diterapkan (${data.count} members akan dinotifikasi)`)
      }
    } catch (error) {
      console.error('Error tagging members:', error)
      toast.error('Gagal menerapkan tag @member')
    }
  }

  // Handle image upload - upload ke server untuk mendapatkan URL permanen
  const handleImageUpload = async (files: File[]) => {
    setUploadingMedia(true)
    try {
      for (const file of files) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
          toast.error(validation.error)
          continue
        }

        // Create progress tracking for this file
        const fileId = `img-${Date.now()}-${Math.random()}`
        setUploadProgress(prev => ({ ...prev, [fileId]: 10 }))

        try {
          // Upload ke server untuk mendapatkan URL permanen
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'image')

          setUploadProgress(prev => ({ ...prev, [fileId]: 30 }))

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          setUploadProgress(prev => ({ ...prev, [fileId]: 80 }))

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Upload gagal')
          }

          const data = await response.json()
          const url = data.url

          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
          
          setImages(prev => [...prev, {
            url,
            type: 'image',
            name: file.name,
            size: file.size
          }])

          // Clear progress after short delay
          await new Promise(resolve => setTimeout(resolve, 200))
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          toast.error(uploadError instanceof Error ? uploadError.message : 'Gagal mengunggah gambar')
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        }
      }
      
      if (files.length > 0 && images.length > 0) {
        toast.success(`Gambar berhasil diunggah`)
      }
    } catch (error) {
      console.error('Error in handleImageUpload:', error)
      toast.error('Gagal mengunggah gambar')
    } finally {
      setUploadingMedia(false)
    }
  }

  // Handle video upload - upload ke server untuk mendapatkan URL permanen
  const handleVideoUpload = async (files: File[]) => {
    setUploadingMedia(true)
    try {
      for (const file of files) {
        const validation = validateVideoFile(file)
        if (!validation.valid) {
          toast.error(validation.error)
          continue
        }

        // Create progress tracking for this file
        const fileId = `vid-${Date.now()}-${Math.random()}`
        setUploadProgress(prev => ({ ...prev, [fileId]: 10 }))

        try {
          // Upload ke server untuk mendapatkan URL permanen
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'video')

          setUploadProgress(prev => ({ ...prev, [fileId]: 30 }))

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          setUploadProgress(prev => ({ ...prev, [fileId]: 80 }))

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Upload gagal')
          }

          const data = await response.json()
          const url = data.url

          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
          
          setVideos(prev => [...prev, {
            url,
            type: 'video',
            name: file.name,
            size: file.size
          }])

          // Clear progress after short delay
          await new Promise(resolve => setTimeout(resolve, 200))
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        } catch (uploadError) {
          console.error('Error uploading video:', uploadError)
          toast.error(uploadError instanceof Error ? uploadError.message : 'Gagal mengunggah video')
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        }
      }

      if (files.length > 0 && videos.length > 0) {
        toast.success(`Video berhasil diunggah`)
      }
    } catch (error) {
      console.error('Error in handleVideoUpload:', error)
      toast.error('Gagal mengunggah video')
    } finally {
      setUploadingMedia(false)
    }
  }

  // Handle document upload - upload ke server untuk mendapatkan URL permanen
  const handleDocumentUpload = async (files: File[]) => {
    setUploadingMedia(true)
    try {
      for (const file of files) {
        const validation = validateDocumentFile(file)
        if (!validation.valid) {
          toast.error(validation.error)
          continue
        }

        // Create progress tracking for this file
        const fileId = `doc-${Date.now()}-${Math.random()}`
        setUploadProgress(prev => ({ ...prev, [fileId]: 10 }))

        try {
          // Upload ke server untuk mendapatkan URL permanen
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'document')

          setUploadProgress(prev => ({ ...prev, [fileId]: 50 }))

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Upload gagal')
          }

          const data = await response.json()
          const url = data.url

          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))

          setDocuments(prev => [...prev, {
            url,
            type: 'document',
            name: file.name,
            size: file.size
          }])

          // Clear progress after short delay
          await new Promise(resolve => setTimeout(resolve, 200))
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        } catch (uploadError) {
          console.error('Error uploading document:', uploadError)
          toast.error(uploadError instanceof Error ? uploadError.message : 'Gagal mengunggah dokumen')
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        }
      }

      if (files.length > 0 && documents.length > 0) {
        toast.success(`Dokumen berhasil diunggah`)
      }
    } catch (error) {
      console.error('Error in handleDocumentUpload:', error)
      toast.error('Gagal mengunggah dokumen')
    } finally {
      setUploadingMedia(false)
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    switch (type) {
      case 'image':
        handleImageUpload(files)
        break
      case 'video':
        handleVideoUpload(files)
        break
      case 'document':
        handleDocumentUpload(files)
        break
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      toast.error('Silakan login terlebih dahulu')
      return
    }

    if (!content.trim()) {
      toast.error('Tulis sesuatu sebelum mengirim')
      return
    }

    setSubmitting(true)
    try {
      // Extract mentions from content
      const mentionRegex = /@(\w+)/g
      const mentions = []
      let match
      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1])
      }

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          parentId,
          mentions,
          images: images.map(i => i.url),
          videos: videos.map(v => v.url),
          documents: documents.map(d => d.url),
          taggedAll,
          taggedMembers
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const result = await response.json()
      console.log('[CommentInput] Comment created:', result)

      // Reset form
      setContent('')
      setImages([])
      setVideos([])
      setDocuments([])
      setTaggedAll(false)
      setTaggedMembers(false)
      
      // Trigger refresh after short delay to ensure DB is updated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (onCommentAdded) {
        onCommentAdded()
      }

      toast.success('Komentar berhasil dikirim!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim komentar')
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* User Info */}
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={session.user.avatar || undefined} />
          <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
            {session.user.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Comment Input */}
        <div className="flex-1">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Tulis komentar... (ketik @username untuk mention)"
              className="resize-none min-h-12 max-h-32 border-0 p-3 bg-white dark:bg-gray-800 rounded-lg"
              disabled={submitting || uploadingMedia}
            />

            {/* Mention Autocomplete Dropdown */}
            {showMentions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {mentionLoading ? (
                  <div className="p-3 text-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : mentionResults.length > 0 ? (
                  <div className="py-1">
                    {mentionResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => selectMention(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Pengguna tidak ditemukan
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadingMedia && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Mengunggah file...</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                {Object.entries(uploadProgress).length > 0 ? (
                  Object.entries(uploadProgress).map(([fileId, progress]) => (
                    <div key={fileId}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Upload</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-300 ease-out" 
                          style={{ width: `${Math.round(progress)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Media Previews */}
          {(images.length > 0 || videos.length > 0 || documents.length > 0) && (
            <div className="mt-3 space-y-2">
              {/* Images Preview */}
              {images.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Gambar ({images.length}/4)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-square">
                        <Image
                          src={img.url}
                          alt="preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Preview */}
              {videos.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Video ({videos.length}/1)</p>
                  {videos.map((vid, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{vid.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(vid.size)}</p>
                      </div>
                      <button
                        onClick={() => setVideos(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents Preview */}
              {documents.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Dokumen ({documents.length}/1)</p>
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <span className="text-lg">{getFileIcon(doc.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                      </div>
                      <button
                        onClick={() => setDocuments(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tool Buttons */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {/* Image Upload */}
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'image')}
                className="hidden"
                id="image-input"
                disabled={submitting || uploadingMedia || images.length >= 4}
              />
              <label htmlFor="image-input">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  disabled={submitting || uploadingMedia || images.length >= 4}
                  asChild
                >
                  <span>
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Gambar
                  </span>
                </Button>
              </label>
            </div>

            {/* Video Upload */}
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'video')}
                className="hidden"
                id="video-input"
                disabled={submitting || uploadingMedia || videos.length >= 1}
              />
              <label htmlFor="video-input">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  disabled={submitting || uploadingMedia || videos.length >= 1}
                  asChild
                >
                  <span>
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </span>
                </Button>
              </label>
            </div>

            {/* Document Upload */}
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                onChange={(e) => handleFileChange(e, 'document')}
                className="hidden"
                id="document-input"
                disabled={submitting || uploadingMedia || documents.length >= 1}
              />
              <label htmlFor="document-input">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  disabled={submitting || uploadingMedia || documents.length >= 1}
                  asChild
                >
                  <span>
                    <File className="h-4 w-4 mr-1" />
                    File
                  </span>
                </Button>
              </label>
            </div>

            {/* Tags - @all dan @member */}
            {groupId && (
              <>
                <Button
                  type="button"
                  variant={taggedAll ? 'default' : 'ghost'}
                  size="sm"
                  onClick={handleTagAll}
                  disabled={submitting || uploadingMedia}
                >
                  <AtSign className="h-4 w-4 mr-1" />
                  @all
                </Button>

                <Button
                  type="button"
                  variant={taggedMembers ? 'default' : 'ghost'}
                  size="sm"
                  onClick={handleTagMembers}
                  disabled={submitting || uploadingMedia}
                >
                  <Users className="h-4 w-4 mr-1" />
                  @member
                </Button>
              </>
            )}

            {/* Cancel */}
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={submitting || uploadingMedia}
              >
                Batal
              </Button>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting || uploadingMedia || !content.trim()}
              className="ml-auto"
              size="sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Kirim
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
