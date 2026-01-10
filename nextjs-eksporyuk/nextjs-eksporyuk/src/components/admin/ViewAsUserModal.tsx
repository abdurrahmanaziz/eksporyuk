'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  Eye, 
  User, 
  Mail, 
  Shield, 
  AlertTriangle,
  Loader2,
  UserCheck,
  Crown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  role: string
  username?: string
  avatar?: string
  isActive: boolean
  isSuspended: boolean
  memberCode?: string
  createdAt: string
}

interface ViewAsUserModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * ViewAsUserModal - Modal untuk admin memilih user yang ingin dilihat
 * 
 * Fitur:
 * - Search user by email, name, atau username
 * - Tampilkan detail user
 * - Input reason/alasan untuk audit trail
 * - Validasi sebelum impersonation
 * - Preview user info sebelum switch
 */
export default function ViewAsUserModal({ isOpen, onClose }: ViewAsUserModalProps) {
  const { data: session, update } = useSession()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<User[]>([])
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [reason, setReason] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSearchResults([])
      setSelectedUser(null)
      setReason('')
    }
  }, [isOpen])

  // Search users with debounce
  React.useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      
      try {
        const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.users || [])
        } else {
          console.error('Search failed:', response.statusText)
          setSearchResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'FOUNDER': case 'CO_FOUNDER': return 'default'
      case 'MENTOR': return 'secondary'
      case 'AFFILIATE': return 'outline'
      case 'MEMBER_PREMIUM': return 'default'
      case 'MEMBER_FREE': return 'outline'
      default: return 'outline'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-3 h-3" />
      case 'FOUNDER': case 'CO_FOUNDER': return <Crown className="w-3 h-3" />
      case 'MENTOR': return <UserCheck className="w-3 h-3" />
      default: return <User className="w-3 h-3" />
    }
  }

  const canImpersonateUser = (user: User) => {
    // Tidak bisa impersonate admin, founder, atau co-founder
    const protectedRoles = ['ADMIN', 'FOUNDER', 'CO_FOUNDER']
    return !protectedRoles.includes(user.role)
  }

  const handleUserSelect = (user: User) => {
    if (!canImpersonateUser(user)) {
      toast.error('Tidak dapat melihat sebagai admin, founder, atau co-founder')
      return
    }
    
    setSelectedUser(user)
  }

  const handleStartImpersonation = async () => {
    if (!selectedUser || !reason.trim() || reason.trim().length < 10) {
      toast.error('Silakan pilih user dan berikan alasan minimal 10 karakter')
      return
    }

    setIsSubmitting(true)

    try {
      // Call API to start impersonation
      const response = await fetch('/api/admin/view-as-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          reason: reason.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start impersonation')
      }

      // Update session with impersonation data
      await update({
        impersonation: data.data
      })

      toast.success(`Sekarang melihat sebagai ${selectedUser.name || selectedUser.email}`)
      onClose()

    } catch (error: any) {
      console.error('Impersonation error:', error)
      toast.error(error.message || 'Gagal memulai mode view as user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            View As User
          </DialogTitle>
          <DialogDescription>
            Melihat platform dari perspektif user lain untuk debugging atau dukungan customer.
            Semua aktivitas akan tercatat untuk audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Search Section */}
          <div className="space-y-3">
            <Label htmlFor="search">Cari User</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Email, nama, atau username user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            
            {searchQuery.length > 0 && searchQuery.length < 3 && (
              <p className="text-xs text-gray-500">Ketik minimal 3 karakter untuk mencari</p>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Hasil Pencarian ({searchResults.length})</Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <Card 
                    key={user.id} 
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      selectedUser?.id === user.id 
                        ? "ring-2 ring-blue-500 border-blue-300" 
                        : "hover:shadow-md",
                      !canImpersonateUser(user) && "opacity-60 cursor-not-allowed"
                    )}
                    onClick={() => handleUserSelect(user)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* User info */}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.name || 'Unnamed User'}
                              {!user.isActive && (
                                <Badge variant="destructive" className="text-xs">Inactive</Badge>
                              )}
                              {user.isSuspended && (
                                <Badge variant="destructive" className="text-xs">Suspended</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.username && (
                              <div className="text-xs text-gray-500">@{user.username}</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Role badge */}
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      
                      {!canImpersonateUser(user) && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          Tidak dapat melihat sebagai {user.role.toLowerCase().replace('_', ' ')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Selected User Preview */}
          {selectedUser && (
            <div className="space-y-3">
              <Label>User yang Dipilih</Label>
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : selectedUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{selectedUser.name || 'Unnamed User'}</div>
                      <div className="text-sm text-gray-600">{selectedUser.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="text-xs">
                          {getRoleIcon(selectedUser.role)}
                          <span className="ml-1">{selectedUser.role.replace('_', ' ')}</span>
                        </Badge>
                        {selectedUser.memberCode && (
                          <Badge variant="outline" className="text-xs">
                            {selectedUser.memberCode}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reason Input */}
          {selectedUser && (
            <div className="space-y-3">
              <Label htmlFor="reason">
                Alasan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Jelaskan alasan mengapa perlu melihat sebagai user ini (minimal 10 karakter)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500">
                Alasan akan dicatat dalam audit log untuk keamanan.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleStartImpersonation}
            disabled={!selectedUser || !reason.trim() || reason.trim().length < 10 || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Mulai View As User
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}