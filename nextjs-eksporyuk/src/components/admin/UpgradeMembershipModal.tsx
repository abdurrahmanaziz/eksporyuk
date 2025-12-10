'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowUpCircle, Calendar, Clock } from 'lucide-react'

interface Membership {
  id: string
  name: string
  slug: string
  price: number
  duration: number | null
}

interface UserMembership {
  id: string
  startDate: string
  endDate: string
  status: string
  isActive: boolean
  membership: {
    id: string
    name: string
    slug: string
  }
}

interface UpgradeMembershipModalProps {
  userMembership: UserMembership
  userEmail: string
  onSuccess: () => void
}

export function UpgradeMembershipModal({ userMembership, userEmail, onSuccess }: UpgradeMembershipModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [upgradeType, setUpgradeType] = useState<'change' | 'extend'>('change')
  
  // Form state
  const [newMembershipId, setNewMembershipId] = useState('')
  const [extendDays, setExtendDays] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      fetchMemberships()
    }
  }, [open])

  const fetchMemberships = async () => {
    try {
      const res = await fetch('/api/admin/memberships')
      if (res.ok) {
        const data = await res.json()
        setMemberships(data.memberships || [])
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error)
    }
  }

  const handleUpgrade = async () => {
    if (upgradeType === 'change' && !newMembershipId) {
      toast.error('Pilih paket membership baru')
      return
    }
    
    if (upgradeType === 'extend' && (!extendDays || parseInt(extendDays) <= 0)) {
      toast.error('Masukkan jumlah hari yang valid')
      return
    }

    setLoading(true)
    
    try {
      const body: any = { reason: reason || undefined }
      
      if (upgradeType === 'change') {
        body.newMembershipId = newMembershipId
      } else {
        body.extendDays = parseInt(extendDays)
      }

      const res = await fetch(`/api/admin/memberships/${userMembership.id}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Membership berhasil diupgrade')
        setOpen(false)
        onSuccess()
        
        // Reset form
        setNewMembershipId('')
        setExtendDays('')
        setReason('')
      } else {
        toast.error(data.error || 'Gagal upgrade membership')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      toast.error('Terjadi kesalahan saat upgrade membership')
    } finally {
      setLoading(false)
    }
  }

  const calculateNewEndDate = () => {
    if (upgradeType === 'extend' && extendDays) {
      const currentEnd = new Date(userMembership.endDate)
      const newEnd = new Date(currentEnd.getTime() + parseInt(extendDays) * 24 * 60 * 60 * 1000)
      return newEnd.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    }
    
    if (upgradeType === 'change' && newMembershipId) {
      const selected = memberships.find(m => m.id === newMembershipId)
      if (selected?.slug.includes('lifetime')) {
        return 'Selamanya (Lifetime)'
      } else if (selected) {
        const now = new Date()
        const duration = selected.slug.includes('12') ? 365 : 
                        selected.slug.includes('6') ? 180 : 
                        selected.slug.includes('3') ? 90 : 30
        const newEnd = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000)
        return newEnd.toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      }
    }
    
    return null
  }

  const getRemainingDays = () => {
    const end = new Date(userMembership.endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const remainingDays = getRemainingDays()
  const newEndDate = calculateNewEndDate()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ArrowUpCircle className="h-4 w-4 mr-2" />
          Upgrade
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upgrade Membership</DialogTitle>
          <DialogDescription>
            Upgrade atau perpanjang membership untuk {userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Membership Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Membership Saat Ini:</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">{userMembership.membership.name}</span>
              <Badge variant={userMembership.isActive ? 'default' : 'secondary'}>
                {userMembership.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Berakhir: {new Date(userMembership.endDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long', 
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className={remainingDays > 0 ? 'text-green-600' : 'text-red-600'}>
                {remainingDays > 0 ? `${remainingDays} hari tersisa` : `Expired ${Math.abs(remainingDays)} hari yang lalu`}
              </span>
            </div>
          </div>

          {/* Upgrade Type Selection */}
          <div className="space-y-2">
            <Label>Jenis Upgrade</Label>
            <Select value={upgradeType} onValueChange={(val: 'change' | 'extend') => setUpgradeType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="change">Ubah Paket Membership</SelectItem>
                <SelectItem value="extend">Perpanjang Durasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Change Membership */}
          {upgradeType === 'change' && (
            <div className="space-y-2">
              <Label>Paket Membership Baru</Label>
              <Select value={newMembershipId} onValueChange={setNewMembershipId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih paket membership" />
                </SelectTrigger>
                <SelectContent>
                  {memberships
                    .filter(m => m.id !== userMembership.membership.id)
                    .map(membership => (
                      <SelectItem key={membership.id} value={membership.id}>
                        {membership.name} - Rp {membership.price.toLocaleString('id-ID')}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Membership lama akan diganti dengan paket baru, durasi dihitung dari sekarang
              </p>
            </div>
          )}

          {/* Extend Duration */}
          {upgradeType === 'extend' && (
            <div className="space-y-2">
              <Label>Perpanjang Durasi (Hari)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Contoh: 30, 90, 365"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Tambahkan hari dari tanggal berakhir saat ini
              </p>
            </div>
          )}

          {/* Preview New End Date */}
          {newEndDate && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">Pratinjau Perubahan:</h4>
              <p className="text-sm text-green-700">
                Membership akan berakhir pada: <strong>{newEndDate}</strong>
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Alasan / Catatan (Opsional)</Label>
            <Textarea
              placeholder="Contoh: Customer membeli order kedua, bonus perpanjangan, dll"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={loading || (upgradeType === 'change' && !newMembershipId) || (upgradeType === 'extend' && !extendDays)}
            >
              {loading ? 'Memproses...' : 'Upgrade Sekarang'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
