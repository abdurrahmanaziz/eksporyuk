'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Globe, Loader2 } from 'lucide-react'

interface LinkPreviewProps {
  url: string
  isOwn: boolean
}

interface LinkMetadata {
  title?: string
  description?: string
  image?: string
  siteName?: string
  favicon?: string
}

export default function LinkPreview({ url, isOwn }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        setError(false)
        
        const res = await fetch(`/api/chat/link-preview?url=${encodeURIComponent(url)}`)
        if (res.ok) {
          const data = await res.json()
          setMetadata(data)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Failed to fetch link preview:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [url])

  // Don't show anything while loading or on error
  if (loading) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isOwn ? 'bg-blue-500' : 'bg-gray-100'}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Memuat preview...</span>
      </div>
    )
  }

  if (error || !metadata) {
    return null
  }

  const hostname = new URL(url).hostname.replace('www.', '')

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg overflow-hidden border transition-all hover:shadow-md ${
        isOwn ? 'bg-blue-500 border-blue-400' : 'bg-white border-gray-200'
      }`}
    >
      {/* Image Preview */}
      {metadata.image && (
        <div className="relative w-full h-32 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metadata.image}
            alt={metadata.title || 'Preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-3">
        {/* Site info */}
        <div className={`flex items-center gap-1.5 text-xs mb-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
          {metadata.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={metadata.favicon} 
              alt="" 
              className="w-4 h-4 rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          <span>{metadata.siteName || hostname}</span>
          <ExternalLink className="w-3 h-3 ml-auto" />
        </div>

        {/* Title */}
        {metadata.title && (
          <h4 className={`font-medium text-sm line-clamp-2 ${isOwn ? 'text-white' : 'text-gray-900'}`}>
            {metadata.title}
          </h4>
        )}

        {/* Description */}
        {metadata.description && (
          <p className={`text-xs line-clamp-2 mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
            {metadata.description}
          </p>
        )}
      </div>
    </a>
  )
}
