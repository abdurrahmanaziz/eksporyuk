'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Banner {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  videoUrl: string | null
  linkUrl: string | null
  linkText: string | null
  placement: string
  displayType: string
  backgroundColor: string | null
  textColor: string | null
  buttonColor: string | null
  buttonTextColor: string | null
  isSponsored: boolean
  sponsorName: string | null
  sponsorLogo: string | null
}

interface DashboardBannerProps {
  placement?: string
}

export default function DashboardBanner({ placement = 'DASHBOARD' }: DashboardBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const res = await fetch(`/api/banners?placement=${placement}`)
      const data = await res.json()
      setBanners(data)

      // Track view for first banner
      if (data.length > 0) {
        trackView(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const trackView = async (bannerId: string) => {
    try {
      await fetch('/api/banners/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId }),
      })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const trackClick = async (bannerId: string) => {
    try {
      await fetch('/api/banners/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerId }),
      })
    } catch (error) {
      console.error('Error tracking click:', error)
    }
  }

  const nextBanner = useCallback(() => {
    if (banners.length === 0) return
    const newIndex = (currentIndex + 1) % banners.length
    setCurrentIndex(newIndex)
    trackView(banners[newIndex].id)
  }, [currentIndex, banners])

  const prevBanner = useCallback(() => {
    if (banners.length === 0) return
    const newIndex = currentIndex === 0 ? banners.length - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
    trackView(banners[newIndex].id)
  }, [currentIndex, banners])

  // Auto-advance carousel
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      nextBanner()
    }, 5000) // 5 seconds

    return () => clearInterval(interval)
  }, [banners.length, nextBanner])

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse" />
    )
  }

  if (banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  // Safety check
  if (!currentBanner) {
    return null
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden shadow-lg group">
      {/* Banner Content */}
      <div
        className="relative w-full h-64 md:h-80"
        style={{
          backgroundColor: currentBanner.backgroundColor || '#f3f4f6',
        }}
      >
        {/* Image or Video */}
        {currentBanner.imageUrl && (
          <Image
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            fill
            className="object-cover"
            priority
          />
        )}

        {currentBanner.videoUrl && (
          <video
            src={currentBanner.videoUrl}
            autoPlay
            muted
            loop
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-2xl">
            <h2
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ color: currentBanner.textColor || '#ffffff' }}
            >
              {currentBanner.title}
            </h2>
            {currentBanner.description && (
              <p
                className="text-sm md:text-base mb-4 line-clamp-2"
                style={{ color: currentBanner.textColor || '#ffffff' }}
              >
                {currentBanner.description}
              </p>
            )}
            {currentBanner.linkUrl && (
              <Link
                href={currentBanner.linkUrl}
                onClick={() => trackClick(currentBanner.id)}
                className="inline-block px-6 py-2 rounded-lg font-semibold transition hover:opacity-90"
                style={{
                  backgroundColor: currentBanner.buttonColor || '#3b82f6',
                  color: currentBanner.buttonTextColor || '#ffffff',
                }}
              >
                {currentBanner.linkText || 'Lihat Selengkapnya'}
              </Link>
            )}
          </div>

          {/* Sponsor Badge */}
          {currentBanner.isSponsored && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white">
              {currentBanner.sponsorLogo && (
                <Image
                  src={currentBanner.sponsorLogo}
                  alt={currentBanner.sponsorName || 'Sponsor'}
                  width={20}
                  height={20}
                  className="inline-block mr-1"
                />
              )}
              {currentBanner.sponsorName || 'Sponsored'}
            </div>
          )}
        </div>

        {/* Navigation Arrows (only show if multiple banners) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  trackView(banners[index].id)
                }}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
