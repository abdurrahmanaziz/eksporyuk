'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'

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

export default function SidebarBanner() {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanner()
  }, [])

  const fetchBanner = async () => {
    try {
      const res = await fetch('/api/banners?placement=SIDEBAR')
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

  if (loading || !banner || !visible) {
    return null
  }

  return (
    <div
      className="relative rounded-lg overflow-hidden shadow-md mb-4"
      style={{ backgroundColor: banner.backgroundColor || '#f3f4f6' }}
    >
      {/* Close Button */}
      <button
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/30 text-white p-1 rounded-full transition"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Banner Image */}
      {banner.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Banner Content */}
      <div className="p-4">
        <h3
          className="font-semibold text-lg mb-2"
          style={{ color: banner.textColor || '#000000' }}
        >
          {banner.title}
        </h3>
        
        {banner.description && (
          <p
            className="text-sm mb-3 line-clamp-3"
            style={{ color: banner.textColor || '#666666' }}
          >
            {banner.description}
          </p>
        )}

        {banner.linkUrl && (
          <Link
            href={banner.linkUrl}
            onClick={() => trackClick(banner.id)}
            className="block w-full text-center px-4 py-2 rounded-lg font-medium transition hover:opacity-90"
            style={{
              backgroundColor: banner.buttonColor || '#3b82f6',
              color: banner.buttonTextColor || '#ffffff',
            }}
          >
            {banner.linkText || 'Lihat Selengkapnya'}
          </Link>
        )}

        {/* Sponsor Badge */}
        {banner.isSponsored && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            {banner.sponsorName || 'Sponsored'}
          </div>
        )}
      </div>
    </div>
  )
}
