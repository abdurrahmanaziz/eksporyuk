'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Bell, MessageSquare, Heart, UserPlus, Award, Calendar, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  createdAt?: string
}

interface FloatingNotificationProps {
  notification: Notification | null
  onDismiss: () => void
  soundEnabled?: boolean
}

// Notification icon mapping
const getNotificationIcon = (type: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    COMMENT: <MessageSquare className="w-5 h-5 text-blue-500" />,
    MENTION: <MessageSquare className="w-5 h-5 text-purple-500" />,
    LIKE: <Heart className="w-5 h-5 text-red-500" />,
    REACTION: <Heart className="w-5 h-5 text-pink-500" />,
    FOLLOW: <UserPlus className="w-5 h-5 text-green-500" />,
    COURSE_APPROVED: <Award className="w-5 h-5 text-yellow-500" />,
    COURSE_ENROLLMENT: <Award className="w-5 h-5 text-blue-500" />,
    CERTIFICATE_EARNED: <Award className="w-5 h-5 text-yellow-500" />,
    EVENT_REMINDER: <Calendar className="w-5 h-5 text-orange-500" />,
    TRANSACTION: <ShoppingCart className="w-5 h-5 text-green-500" />,
    MEMBERSHIP_ACTIVATED: <Award className="w-5 h-5 text-purple-500" />,
  }
  return iconMap[type] || <Bell className="w-5 h-5 text-blue-500" />
}

// Background color mapping
const getBackgroundColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    COMMENT: 'bg-blue-50 border-blue-200',
    MENTION: 'bg-purple-50 border-purple-200',
    LIKE: 'bg-red-50 border-red-200',
    REACTION: 'bg-pink-50 border-pink-200',
    FOLLOW: 'bg-green-50 border-green-200',
    COURSE_APPROVED: 'bg-yellow-50 border-yellow-200',
    CERTIFICATE_EARNED: 'bg-yellow-50 border-yellow-200',
    EVENT_REMINDER: 'bg-orange-50 border-orange-200',
    TRANSACTION: 'bg-green-50 border-green-200',
  }
  return colorMap[type] || 'bg-white border-gray-200'
}

// Create notification sound using Web Audio API
const createNotificationSound = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) {
        resolve()
        return
      }
      
      const audioCtx = new AudioContext()
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume()
      }
      
      const now = audioCtx.currentTime
      
      // First tone - higher pitch "ding"
      const osc1 = audioCtx.createOscillator()
      const gain1 = audioCtx.createGain()
      osc1.connect(gain1)
      gain1.connect(audioCtx.destination)
      osc1.frequency.setValueAtTime(830, now) // G#5
      osc1.type = 'sine'
      gain1.gain.setValueAtTime(0, now)
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.02)
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc1.start(now)
      osc1.stop(now + 0.3)
      
      // Second tone - even higher "dong"
      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.frequency.setValueAtTime(1046, now + 0.1) // C6
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0, now + 0.1)
      gain2.gain.linearRampToValueAtTime(0.3, now + 0.12)
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
      osc2.start(now + 0.1)
      osc2.stop(now + 0.5)
      
      setTimeout(() => {
        audioCtx.close()
        resolve()
      }, 600)
    } catch (error) {
      console.log('Audio playback error:', error)
      resolve()
    }
  })
}

export default function FloatingNotification({ 
  notification, 
  onDismiss,
  soundEnabled = true 
}: FloatingNotificationProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const hasPlayedSound = useRef(false)

  // Play notification sound
  const playSound = useCallback(async () => {
    if (!soundEnabled || hasPlayedSound.current) return
    hasPlayedSound.current = true
    
    await createNotificationSound()
  }, [soundEnabled])

  useEffect(() => {
    if (notification) {
      hasPlayedSound.current = false
      setIsExiting(false)
      setIsVisible(true)
      
      // Play sound after a tiny delay to ensure component is mounted
      const soundTimer = setTimeout(() => {
        playSound()
      }, 50)
      
      // Auto dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        handleClose()
      }, 5000)
      
      return () => {
        clearTimeout(soundTimer)
        clearTimeout(dismissTimer)
      }
    }
  }, [notification, playSound])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, 300)
  }

  const handleClick = () => {
    if (notification?.link) {
      router.push(notification.link)
    }
    handleClose()
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleClose()
  }

  if (!notification || !isVisible) return null

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-[9999] max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{
        animation: isExiting ? 'none' : 'slideInFromRight 0.3s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes progressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
      
      <div
        onClick={handleClick}
        className={`
          ${getBackgroundColor(notification.type)}
          border rounded-xl shadow-2xl p-4 cursor-pointer
          hover:scale-[1.02] transition-transform duration-200
          backdrop-blur-sm bg-opacity-95 relative overflow-hidden
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm text-gray-900 truncate">
                {notification.title}
              </h4>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Baru saja
            </p>
          </div>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b-xl"
          style={{
            animation: 'progressBar 5s linear forwards'
          }}
        />
      </div>
    </div>
  )
}
