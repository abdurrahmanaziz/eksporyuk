'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ArrowLeft, AlertTriangle, User, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export default function ViewAsUserOverlay() {
  const { data: session } = useSession()
  const [duration, setDuration] = useState('')
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  // Only show if impersonating
  const isImpersonating = session?.user?.impersonating?.isActive
  const targetUser = session?.user?.impersonating?.targetUser

  useEffect(() => {
    if (isImpersonating && session?.user?.impersonating?.startedAt) {
      const start = new Date(session.user.impersonating.startedAt)
      setStartTime(start)

      const interval = setInterval(() => {
        const now = new Date()
        const diff = now.getTime() - start.getTime()
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isImpersonating, session])

  const handleExitImpersonation = async () => {
    try {
      setIsExiting(true)
      
      const response = await fetch('/api/admin/view-as-user', {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Berhasil kembali ke akun admin')
        // Force reload to update session
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal exit impersonation')
      }
    } catch (error) {
      console.error('Error exiting impersonation:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setIsExiting(false)
    }
  }

  if (!isImpersonating || !targetUser) {
    return null
  }

  return (
    <>
      {/* Header Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <span className="font-semibold">
                  Viewing sebagai: {targetUser.name}
                </span>
                <div className="flex items-center gap-2 text-sm text-orange-100">
                  <Clock className="h-3 w-3" />
                  <span>Durasi: {duration}</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleExitImpersonation}
              disabled={isExiting}
              variant="outline"
              size="sm"
              className="bg-white text-orange-600 border-white hover:bg-orange-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isExiting ? 'Exiting...' : 'Back to Admin'}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar Indicator */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
        <div className="bg-orange-500 text-white rounded-lg p-3 shadow-lg max-w-48">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-semibold text-sm">View As User</span>
          </div>
          <div className="text-xs text-orange-100">
            <p>Admin: {session?.user?.originalData?.name}</p>
            <p>Viewing: {targetUser.name}</p>
            <p className="mt-1 text-orange-200">Duration: {duration}</p>
          </div>
        </div>
      </div>

      {/* Body padding to account for fixed header */}
      <style jsx global>{`
        body {
          padding-top: 70px !important;
        }
      `}</style>
    </>
  )
}