'use client'

import { useEffect, useRef } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'

interface ProtectedYouTubePlayerProps {
  videoUrl: string
  title: string
  userName?: string
  userEmail?: string
}

/**
 * Protected YouTube Player
 * - Overlay transparan untuk block klik ke logo YouTube
 * - Disable klik kanan/context menu
 * - Watermark nama user (opsional)
 * - Legal notice di bawah video
 */
export default function ProtectedYouTubePlayer({
  videoUrl,
  title,
  userName,
  userEmail
}: ProtectedYouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert YouTube URL to embed format with additional protection params
  const getEmbedUrl = (url: string): string => {
    let embedUrl = url
    
    if (url.includes('watch?v=')) {
      embedUrl = url.replace('watch?v=', 'embed/')
    } else if (url.includes('youtu.be/')) {
      embedUrl = url.replace('youtu.be/', 'youtube.com/embed/')
    }
    
    // Remove any existing query params and add protection params
    const baseUrl = embedUrl.split('?')[0]
    const params = new URLSearchParams({
      rel: '0',           // No related videos
      modestbranding: '1', // Minimal YouTube branding
      showinfo: '0',       // Hide video info
      iv_load_policy: '3', // Hide annotations
      disablekb: '1',      // Disable keyboard controls
      fs: '1',             // Allow fullscreen
      playsinline: '1',    // Play inline on mobile
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    })
    
    return `${baseUrl}?${params.toString()}`
  }

  // Disable context menu (right-click)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      return false
    }

    container.addEventListener('contextmenu', handleContextMenu)
    container.addEventListener('dragstart', handleDragStart)

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu)
      container.removeEventListener('dragstart', handleDragStart)
    }
  }, [])

  return (
    <div className="space-y-0">
      {/* Video Container with Protection */}
      <div 
        ref={containerRef}
        className="relative aspect-video bg-black select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* YouTube iframe */}
        <iframe
          className="w-full h-full"
          src={getEmbedUrl(videoUrl)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ pointerEvents: 'auto' }}
        />
        
        {/* Top overlay to block YouTube logo click (top-left area) */}
        <div 
          className="absolute top-0 left-0 w-32 h-16 cursor-not-allowed z-10"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Top-right overlay to block share/watch later buttons */}
        <div 
          className="absolute top-0 right-0 w-24 h-12 cursor-not-allowed z-10"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        />
        
        {/* Watermark - User identification (bottom-right) */}
        {(userName || userEmail) && (
          <div className="absolute bottom-12 right-4 z-20 pointer-events-none select-none">
            <div className="bg-black/30 backdrop-blur-sm text-white/50 text-xs px-2 py-1 rounded">
              {userName || userEmail}
            </div>
          </div>
        )}
      </div>

      {/* Legal Notice - UU Hak Cipta */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pemberitahuan Hak Cipta
            </h4>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Seluruh materi, audio, dan video dalam kelas ini <strong>dilindungi Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta</strong>. 
              Peserta <strong>dilarang melakukan perekaman, penggandaan, pengambilan gambar, dan/atau penyebaran</strong> sebagian 
              maupun seluruh materi tanpa izin tertulis dari penyelenggara.
            </p>
            <p className="text-xs text-amber-800 font-medium">
              Pelanggaran dapat dikenakan sanksi pidana sesuai <strong>Pasal 9 dan Pasal 113 UU Hak Cipta</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
