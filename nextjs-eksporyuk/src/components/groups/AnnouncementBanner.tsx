'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Megaphone, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface AnnouncementBannerProps {
  groupId: string
}

export default function AnnouncementBanner({ groupId }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAnnouncements()
    
    // Load dismissed announcements from localStorage
    const stored = localStorage.getItem(`dismissed-announcements-${groupId}`)
    if (stored) {
      setDismissed(new Set(JSON.parse(stored)))
    }
  }, [groupId])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/announcements`)
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements)
      }
    } catch (error) {
      console.error('Fetch announcements error:', error)
    }
  }

  const handleDismiss = (announcementId: string) => {
    const newDismissed = new Set(dismissed)
    newDismissed.add(announcementId)
    setDismissed(newDismissed)
    
    // Save to localStorage
    localStorage.setItem(
      `dismissed-announcements-${groupId}`,
      JSON.stringify(Array.from(newDismissed))
    )
  }

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id))

  if (visibleAnnouncements.length === 0) return null

  return (
    <div className="space-y-3">
      {visibleAnnouncements.map((announcement) => (
        <Card 
          key={announcement.id} 
          className="border-l-4 border-l-blue-500 bg-blue-50"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Megaphone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600">Pengumuman</Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(announcement.createdAt), {
                      addSuffix: true,
                      locale: idLocale
                    })}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{announcement.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  oleh {announcement.author.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(announcement.id)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
