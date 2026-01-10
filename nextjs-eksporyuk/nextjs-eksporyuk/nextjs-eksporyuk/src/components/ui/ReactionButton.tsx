'use client'

import { useState, useRef, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY'

interface Reaction {
  type: ReactionType
  emoji: string
  label: string
  color: string
}

const REACTIONS: Reaction[] = [
  { type: 'LIKE', emoji: '👍', label: 'Suka', color: 'text-blue-500' },
  { type: 'LOVE', emoji: '❤️', label: 'Cinta', color: 'text-red-500' },
  { type: 'HAHA', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  { type: 'WOW', emoji: '😮', label: 'Wow', color: 'text-orange-500' },
  { type: 'SAD', emoji: '😢', label: 'Sedih', color: 'text-blue-400' },
  { type: 'ANGRY', emoji: '😡', label: 'Marah', color: 'text-red-600' },
]

interface ReactionButtonProps {
  postId: string
  currentReaction?: ReactionType | null
  reactionCounts?: Record<string, number>
  onReact: (postId: string, reactionType: ReactionType) => Promise<void>
  onRemoveReact: (postId: string) => Promise<void>
  disabled?: boolean
}

export default function ReactionButton({
  postId,
  currentReaction,
  reactionCounts = {},
  onReact,
  onRemoveReact,
  disabled = false,
}: ReactionButtonProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPicker])

  const handleReactionClick = async (reactionType: ReactionType) => {
    setIsAnimating(true)
    setShowPicker(false)

    if (currentReaction === reactionType) {
      await onRemoveReact(postId)
    } else {
      await onReact(postId, reactionType)
    }

    setTimeout(() => setIsAnimating(false), 300)
  }

  const handleQuickReact = async () => {
    if (currentReaction) {
      await onRemoveReact(postId)
    } else {
      await onReact(postId, 'LIKE')
    }
  }

  const getTotalReactions = () => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)
  }

  const getCurrentReactionData = () => {
    return REACTIONS.find(r => r.type === currentReaction)
  }

  const currentReactionData = getCurrentReactionData()
  const totalReactions = getTotalReactions()

  return (
    <div className="relative inline-block" ref={pickerRef}>
      {/* Main Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleQuickReact}
          onMouseEnter={() => !disabled && setShowPicker(true)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 transition-all group relative',
            currentReaction && currentReactionData?.color,
            isAnimating && 'scale-110'
          )}
        >
          {currentReactionData ? (
            <span className="text-lg leading-none animate-in zoom-in-50 duration-200">
              {currentReactionData.emoji}
            </span>
          ) : (
            <Heart className={cn(
              'h-5 w-5 transition-all',
              'group-hover:scale-110 group-hover:text-red-500'
            )} />
          )}
          <span className="font-medium text-sm">
            {currentReactionData ? currentReactionData.label : 'Suka'}
          </span>
        </Button>

        {totalReactions > 0 && (
          <span className="text-sm text-muted-foreground">
            {totalReactions}
          </span>
        )}
      </div>

      {/* Reaction Picker Popup */}
      {showPicker && (
        <div 
          className="absolute bottom-full left-0 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
          onMouseLeave={() => setShowPicker(false)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-2 flex items-center gap-1">
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionClick(reaction.type)}
                disabled={disabled}
                className={cn(
                  'text-2xl hover:scale-125 transition-transform duration-200 p-2 rounded-full',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  currentReaction === reaction.type && 'bg-gray-100 dark:bg-gray-700 scale-110'
                )}
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>

          {/* Reaction counts tooltip */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              {REACTIONS.map((reaction) => {
                const count = reactionCounts[reaction.type]
                if (!count) return null
                return (
                  <span key={reaction.type} className="inline-flex items-center gap-1 mr-2">
                    {reaction.emoji} {count}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
