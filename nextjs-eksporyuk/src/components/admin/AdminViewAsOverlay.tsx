'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  ArrowLeft, 
  Shield, 
  Clock, 
  User, 
  AlertTriangle,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * AdminViewAsOverlay - Komponen yang muncul di atas layar ketika admin
 * sedang melihat platform dari perspektif user lain.
 * 
 * Fitur:
 * - Indikator visual jelas bahwa ini adalah mode "view as"
 * - Informasi admin yang melakukan impersonation
 * - Informasi target user yang sedang dilihat
 * - Tombol untuk kembali ke session admin
 * - Waktu mulai impersonation
 */
export default function AdminViewAsOverlay() {
  const { data: session, update } = useSession()
  const [isExiting, setIsExiting] = React.useState(false)
  const [timeElapsed, setTimeElapsed] = React.useState('')

  // Hanya tampilkan jika admin sedang melakukan impersonation
  if (!session?.impersonation?.isImpersonating) {
    return null
  }

  const impersonation = session.impersonation

  // Update elapsed time setiap detik
  React.useEffect(() => {
    const updateElapsedTime = () => {
      const startTime = new Date(impersonation.startedAt)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
      
      if (hours > 0) {
        setTimeElapsed(`${hours}j ${minutes}m ${seconds}d`)
      } else if (minutes > 0) {
        setTimeElapsed(`${minutes}m ${seconds}d`)
      } else {
        setTimeElapsed(`${seconds}d`)
      }
    }

    updateElapsedTime()
    const interval = setInterval(updateElapsedTime, 1000)
    
    return () => clearInterval(interval)
  }, [impersonation.startedAt])

  const handleExitImpersonation = async () => {
    if (isExiting) return
    
    setIsExiting(true)
    
    try {
      // Call API to log the exit
      await fetch('/api/admin/view-as-user', {
        method: 'DELETE',
      })
      
      // Update session to exit impersonation
      await update({ 
        exitImpersonation: true 
      })
      
      console.log('✅ Exited impersonation mode')
    } catch (error) {
      console.error('❌ Error exiting impersonation:', error)
      setIsExiting(false)
    }
  }

  return (
    <>
      {/* Backdrop with warning overlay */}
      <div className="fixed inset-0 bg-red-500/5 backdrop-blur-[0.5px] pointer-events-none z-40" />
      
      {/* Admin overlay bar */}
      <Card className={cn(
        "fixed top-4 left-4 right-4 md:left-6 md:right-6 z-50",
        "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50",
        "border-red-200 dark:border-red-800",
        "shadow-lg shadow-red-500/20",
        "animate-in slide-in-from-top-2 duration-500"
      )}>
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left side - Status and info */}
            <div className="flex items-center gap-3">
              {/* Warning icon */}
              <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <Eye className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              
              {/* Status info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs font-semibold">
                    <Shield className="w-3 h-3 mr-1" />
                    ADMIN MODE
                  </Badge>
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:text-orange-400">
                    <Eye className="w-3 h-3 mr-1" />
                    Melihat sebagai user
                  </Badge>
                </div>
                
                <div className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">
                    Admin {impersonation.adminEmail}
                  </span>
                  {' melihat sebagai '}
                  <span className="font-medium">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-red-600 dark:text-red-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Durasi: {timeElapsed}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Role: {session.user.role}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Actions */}
            <div className="flex items-center gap-2 md:flex-shrink-0">
              {/* Security warning */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  Semua aktivitas tercatat untuk audit
                </span>
              </div>
              
              {/* Exit button */}
              <Button
                onClick={handleExitImpersonation}
                disabled={isExiting}
                size="sm"
                className={cn(
                  "bg-red-600 hover:bg-red-700 text-white",
                  "shadow-md hover:shadow-lg",
                  "transition-all duration-200"
                )}
              >
                {isExiting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Keluar...
                  </>
                ) : (
                  <>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Admin
                  </>
                )}
              </Button>
            </div>
            
          </div>
          
          {/* Reason display (if available) */}
          {impersonation.reason && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <div className="text-xs text-red-600 dark:text-red-400">
                <strong>Alasan:</strong> {impersonation.reason}
              </div>
            </div>
          )}
          
        </div>
      </Card>
      
      {/* Mobile warning banner at bottom */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-red-600 text-white p-3 rounded-lg shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <Shield className="w-4 h-4" />
            Mode Admin - Melihat sebagai {session.user.name}
          </div>
        </div>
      </div>
    </>
  )
}