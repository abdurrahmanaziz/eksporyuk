'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { MoreVertical, Eye, UserX, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface ProfileActionsMenuProps {
  targetUserId: string
  targetUsername: string
  targetUserName: string
}

export default function ProfileActionsMenu({ 
  targetUserId, 
  targetUsername, 
  targetUserName 
}: ProfileActionsMenuProps) {
  const { data: session, update } = useSession()
  const [isViewingAs, setIsViewingAs] = useState(false)

  // Only show for ADMIN, FOUNDER, CO_FOUNDER
  if (!session?.user || !['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session.user.role as string)) {
    return null
  }

  const handleViewAsUser = async () => {
    if (session?.user?.id === targetUserId) {
      toast.error('Tidak bisa view as diri sendiri')
      return
    }

    try {
      setIsViewingAs(true)
      
      console.log('[VIEW-AS-USER] Starting impersonation:', {
        adminId: session.user.id,
        targetUserId,
        targetUsername
      })

      const response = await fetch('/api/admin/view-as-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          reason: `View profile ${targetUsername}` // Auto reason
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start impersonation')
      }

      const impersonationData = await response.json()
      console.log('[VIEW-AS-USER] API Response:', impersonationData)

      // Critical: Use NextAuth update() to trigger session refresh
      await update({ 
        impersonation: impersonationData 
      })
      
      toast.success(`Sekarang viewing sebagai ${targetUserName}`)
      
      // Force reload to ensure all components re-render with new session
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('[VIEW-AS-USER] Error:', error)
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setIsViewingAs(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleViewAsUser} disabled={isViewingAs}>
          <Eye className="h-4 w-4 mr-2" />
          {isViewingAs ? 'Switching...' : 'View As User'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="text-orange-600">
          <UserX className="h-4 w-4 mr-2" />
          Suspend User
        </DropdownMenuItem>
        
        <DropdownMenuItem className="text-red-600">
          <Shield className="h-4 w-4 mr-2" />
          Security Review
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}