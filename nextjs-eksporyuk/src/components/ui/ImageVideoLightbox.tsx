'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LightboxItem {
  url: string
  type: 'image' | 'video'
}

interface ImageVideoLightboxProps {
  items: LightboxItem[]
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
}

/**
 * Full-screen lightbox for viewing images and videos
 * Features:
 * - Navigation with arrow keys or buttons
 * - Close with ESC key or close button
 * - Keyboard shortcuts (left/right arrows to navigate)
 * - Smooth transitions between items
 * - Video autoplay support
 */
export function ImageVideoLightbox({
  items,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageVideoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? items.length - 1 : prev - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === items.length - 1 ? 0 : prev + 1
    )
  }

  if (!isOpen || items.length === 0) return null

  const currentItem = items[currentIndex]
  const hasMultiple = items.length > 1

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Main content */}
      <div className="h-screen flex items-center justify-center relative">
        {/* Image or Video */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentItem.type === 'image' ? (
            <Image
              src={currentItem.url}
              alt={`Image ${currentIndex + 1}`}
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />
          ) : (
            <video
              src={currentItem.url}
              controls
              autoPlay
              className="max-h-full max-w-full"
            />
          )}
        </div>

        {/* Navigation - Only show if multiple items */}
        {hasMultiple && (
          <>
            {/* Previous button */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Previous item"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>

            {/* Next button */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Next item"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/50 rounded-lg">
              <p className="text-white text-sm font-medium">
                {currentIndex + 1} / {items.length}
              </p>
            </div>

            {/* Thumbnail strip - Bottom navigation */}
            <div className="absolute bottom-16 left-0 right-0 z-10 px-4 py-3 flex justify-center gap-2 overflow-x-auto">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all',
                    idx === currentIndex
                      ? 'ring-2 ring-white opacity-100'
                      : 'opacity-50 hover:opacity-70'
                  )}
                >
                  {item.type === 'image' ? (
                    <Image
                      src={item.url}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 right-4 z-10 text-white/50 text-xs text-right">
        <p>ESC to close</p>
        {hasMultiple && <p>← → to navigate</p>}
      </div>
    </div>
  )
}
