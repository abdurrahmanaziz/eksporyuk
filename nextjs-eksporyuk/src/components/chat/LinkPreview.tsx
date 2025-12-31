'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ExternalLink, Globe } from 'lucide-react'

interface LinkPreviewProps {
  url: string
  isOwn?: boolean
}

interface PreviewData {
  title?: string
  description?: string
  image?: string
  siteName?: string
  favicon?: string
}

export default function LinkPreview({ url, isOwn = false }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true)
        setError(false)
        
        // Try to extract basic info from URL
        const urlObj = new URL(url)
        const hostname = urlObj.hostname.replace('www.', '')
        
        // Set basic preview data from URL
        setPreview({
          title: hostname,
          siteName: hostname,
          description: url
        })
        
        // Optionally fetch Open Graph data from API
        try {
          const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
          if (res.ok) {
            const data = await res.json()
            if (data.title || data.description || data.image) {
              setPreview(prev => ({ ...prev, ...data }))
            }
          }
        } catch {
          // Keep basic preview if API fails
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      fetchPreview()
    }
  }, [url])

  if (error || !url) return null

  if (loading) {
    return (
      <div className={`mt-2 rounded-lg border ${isOwn ? 'border-white/20 bg-white/10' : 'border-gray-200 bg-gray-50'} p-3 animate-pulse`}>
        <div className={`h-4 ${isOwn ? 'bg-white/20' : 'bg-gray-200'} rounded w-3/4 mb-2`}></div>
        <div className={`h-3 ${isOwn ? 'bg-white/20' : 'bg-gray-200'} rounded w-1/2`}></div>
      </div>
    )
  }

  if (!preview) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 block rounded-lg border overflow-hidden transition-all hover:opacity-80 ${
        isOwn 
          ? 'border-white/20 bg-white/10 hover:bg-white/15' 
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      {preview.image && (
        <div className="relative w-full h-32 bg-gray-100">
          <Image
            src={preview.image}
            alt={preview.title || 'Link preview'}
            fill
            className="object-cover"
            onError={() => setPreview(prev => prev ? { ...prev, image: undefined } : null)}
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {preview.favicon ? (
            <Image 
              src={preview.favicon} 
              alt="" 
              width={16} 
              height={16} 
              className="rounded"
              onError={() => setPreview(prev => prev ? { ...prev, favicon: undefined } : null)}
            />
          ) : (
            <Globe className={`w-4 h-4 ${isOwn ? 'text-white/60' : 'text-gray-400'}`} />
          )}
          <span className={`text-xs ${isOwn ? 'text-white/60' : 'text-gray-500'}`}>
            {preview.siteName || new URL(url).hostname}
          </span>
          <ExternalLink className={`w-3 h-3 ml-auto ${isOwn ? 'text-white/40' : 'text-gray-400'}`} />
        </div>
        {preview.title && (
          <h4 className={`font-medium text-sm line-clamp-2 ${isOwn ? 'text-white' : 'text-gray-900'}`}>
            {preview.title}
          </h4>
        )}
        {preview.description && (
          <p className={`text-xs mt-1 line-clamp-2 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
            {preview.description}
          </p>
        )}
      </div>
    </a>
  )
}
