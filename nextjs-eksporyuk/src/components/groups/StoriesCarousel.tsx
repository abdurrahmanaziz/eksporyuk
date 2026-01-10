'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

interface Story {
  id: string
  content: string
  images?: string[]
  author: {
    id: string
    name: string
    image: string | null
  }
  createdAt: Date
}

interface StoriesCarouselProps {
  groupId: string
  refreshTrigger?: number
}

export default function StoriesCarousel({ groupId, refreshTrigger }: StoriesCarouselProps) {
  const { data: session } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchStories()
  }, [groupId, refreshTrigger])

  const fetchStories = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/stories`)
      if (res.ok) {
        const data = await res.json()
        setStories(data.stories || [])
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    }
  }

  const handleViewStory = (story: Story, index: number) => {
    setSelectedStory(story)
    setCurrentIndex(index)
  }

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedStory(stories[currentIndex + 1])
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelectedStory(stories[currentIndex - 1])
    }
  }

  const formatTimeRemaining = (createdAt: Date) => {
    const now = new Date()
    const created = new Date(createdAt)
    const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000)
    const remaining = expiresAt.getTime() - now.getTime()
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    
    if (hours < 1) {
      const minutes = Math.floor(remaining / (1000 * 60))
      return `${minutes}m left`
    }
    return `${hours}h left`
  }

  if (stories.length === 0) return null

  return (
    <>
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Stories</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {stories.map((story, index) => (
            <button
              key={story.id}
              onClick={() => handleViewStory(story, index)}
              className="flex-shrink-0 text-center"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-pink-600">
                  <Avatar className="w-full h-full border-2 border-white">
                    <AvatarImage src={story.author.image || ''} />
                    <AvatarFallback>
                      {story.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {story.author.id === session?.user?.id && (
                  <Badge
                    variant="secondary"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs px-1.5 py-0"
                  >
                    You
                  </Badge>
                )}
              </div>
              <p className="text-xs mt-1 truncate w-16">{story.author.name.split(' ')[0]}</p>
              <p className="text-xs text-gray-500">{formatTimeRemaining(story.createdAt)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-md p-0 bg-black">
          {selectedStory && (
            <div className="relative h-[80vh]">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={selectedStory.author.image || ''} />
                      <AvatarFallback>
                        {selectedStory.author.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{selectedStory.author.name}</p>
                      <p className="text-xs text-gray-300">
                        {formatTimeRemaining(selectedStory.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedStory(null)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Progress bars */}
                <div className="flex gap-1 mt-3">
                  {stories.map((_, index) => (
                    <div
                      key={index}
                      className={`h-0.5 flex-1 rounded ${
                        index === currentIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="h-full flex items-center justify-center">
                {selectedStory.images && selectedStory.images.length > 0 ? (
                  <img
                    src={selectedStory.images[0]}
                    alt="Story"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="px-8">
                    <p className="text-white text-lg text-center whitespace-pre-wrap">
                      {selectedStory.content}
                    </p>
                  </div>
                )}
              </div>

              {/* Content overlay (if there's both image and text) */}
              {selectedStory.images && selectedStory.images.length > 0 && selectedStory.content && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-center">{selectedStory.content}</p>
                </div>
              )}

              {/* Navigation */}
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}
              {currentIndex < stories.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
