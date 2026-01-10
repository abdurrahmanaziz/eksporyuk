'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Banner {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  linkUrl: string | null
  linkText: string | null
  backgroundColor: string | null
  textColor: string | null
  buttonColor: string | null
  buttonTextColor: string | null
  isSponsored: boolean
  sponsorName: string | null
}

interface FeedBannerProps {
  index: number // Position in feed
}

export default function FeedBanner({ index }: FeedBannerProps) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only show banner every 5 posts
    if (index % 5 !== 4) {
      setLoading(false)
      return
    }

    fetchBanner()
  }, [index])

  const fetchBanner = async () => {
    try {
      const res = await fetch('/api/banners?placement=FEED')
      const data = await res.json()
      
      if (data.length > 0) {
        setBanner(data[0])
        trackView(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching banner:', error)
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

  if (loading || !banner) {
    return null
  }

  return (
    <div
      className="rounded-lg overflow-hidden shadow-md border border-gray-200 mb-4"
      style={{ backgroundColor: banner.backgroundColor || '#ffffff' }}
    >
      <div className="flex flex-col md:flex-row">
        {/* Banner Image */}
        {banner.imageUrl && (
          <div className="relative w-full md:w-1/3 h-48 md:h-auto">
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Banner Content */}
        <div className="flex-1 p-6">
          {/* Sponsor Badge */}
          {banner.isSponsored && (
            <div className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 mb-2">
              {banner.sponsorName || 'Sponsored'}
            </div>
          )}

          <h3
            className="font-bold text-xl mb-2"
            style={{ color: banner.textColor || '#000000' }}
          >
            {banner.title}
          </h3>
          
          {banner.description && (
            <p
              className="text-sm mb-4 line-clamp-2"
              style={{ color: banner.textColor || '#666666' }}
            >
              {banner.description}
            </p>
          )}

          {banner.linkUrl && (
            <Link
              href={banner.linkUrl}
              onClick={() => trackClick(banner.id)}
              className="inline-block px-6 py-2 rounded-lg font-medium transition hover:opacity-90"
              style={{
                backgroundColor: banner.buttonColor || '#3b82f6',
                color: banner.buttonTextColor || '#ffffff',
              }}
            >
              {banner.linkText || 'Lihat Selengkapnya'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
