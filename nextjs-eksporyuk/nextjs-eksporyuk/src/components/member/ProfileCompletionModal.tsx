'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  User,
  Phone,
  FileText,
  MapPin,
  Camera,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChevronDown,
} from 'lucide-react'

interface ProfileData {
  isComplete: boolean
  missingFields: string[]
  completedCount: number
  totalRequired: number
  progress: number
  profile: {
    name: string
    phone: string | null
    whatsapp: string | null
    bio: string | null
    avatar: string | null
    province: string | null
    city: string | null
  }
}

interface LocationData {
  provinces: Array<{ name: string; cities: string[] }>
}

interface ProfileCompletionModalProps {
  onComplete?: () => void
  forceOpen?: boolean
}

export default function ProfileCompletionModal({ 
  onComplete, 
  forceOpen = false 
}: ProfileCompletionModalProps) {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [locationData, setLocationData] = useState<LocationData>({ provinces: [] })
  const [availableCities, setAvailableCities] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    bio: '',
    province: '',
    city: '',
  })

  // Fetch location data on mount
  useEffect(() => {
    fetchLocationData()
  }, [])

  // Update available cities when province changes
  useEffect(() => {
    if (formData.province && locationData.provinces.length > 0) {
      const province = locationData.provinces.find(p => p.name === formData.province)
      setAvailableCities(province?.cities || [])
    } else {
      setAvailableCities([])
    }
  }, [formData.province, locationData.provinces])

  const fetchLocationData = async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      setLocationData(data)
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  useEffect(() => {
    // Only check profile completion if email is already verified
    // Admin users skip email verification
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
    const emailVerified = session?.user?.emailVerified || isAdmin
    
    if (session?.user?.id && emailVerified) {
      checkProfileCompletion()
    }
  }, [session?.user?.id, session?.user?.emailVerified, session?.user?.role])

  const checkProfileCompletion = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/member/profile-status')
      const data = await res.json()
      
      if (data.success) {
        setProfileData(data.data)
        
        // Pre-fill form with existing data
        if (data.data.profile) {
          setFormData({
            name: data.data.profile.name || session?.user?.name || '',
            phone: data.data.profile.phone || '',
            whatsapp: data.data.profile.whatsapp || '',
            bio: data.data.profile.bio || '',
            province: data.data.profile.province || '',
            city: data.data.profile.city || '',
          })
        }
        
        // Show modal if profile is incomplete
        if (!data.data.isComplete || forceOpen) {
          setOpen(true)
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Nama wajib diisi')
      return
    }
    if (!formData.whatsapp.trim()) {
      toast.error('Nomor WhatsApp wajib diisi')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || formData.whatsapp,
          whatsapp: formData.whatsapp,
          bio: formData.bio,
          province: formData.province,
          city: formData.city,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Profil berhasil dilengkapi!')
        
        // Update session
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
          }
        })
        
        // Mark profile as completed in localStorage
        localStorage.setItem('profileCompleted', 'true')
        localStorage.setItem('profileCompletedAt', new Date().toISOString())
        
        setOpen(false)
        onComplete?.()
      } else {
        toast.error(data.error || 'Gagal menyimpan profil')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  // Don't show while loading or if already complete
  if (loading || !profileData) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Lengkapi Profil Anda</h2>
              <p className="text-blue-100 text-sm">Langkah pertama untuk memulai</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress Profil</span>
            <span className="font-medium text-blue-600">{profileData.progress}%</span>
          </div>
          <Progress value={profileData.progress} className="h-2" />
          {profileData.missingFields.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Lengkapi: {profileData.missingFields.join(', ')}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              Nomor WhatsApp <span className="text-red-500">*</span>
            </Label>
            <Input
              id="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="08xxxxxxxxxx"
              required
            />
            <p className="text-xs text-gray-500">Untuk notifikasi dan komunikasi penting</p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Provinsi
              </Label>
              <div className="relative">
                <select
                  id="province"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value, city: '' })}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer pr-8"
                >
                  <option value="">Pilih Provinsi</option>
                  {locationData.provinces.map((prov, idx) => (
                    <option key={`province-${idx}`} value={prov.name}>
                      {prov.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Kota</Label>
              <div className="relative">
                <select
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.province}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer pr-8"
                >
                  <option value="">{formData.province ? "Pilih Kota" : "Pilih provinsi dulu"}</option>
                  {availableCities.map((city, idx) => (
                    <option key={`city-${idx}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Tentang Anda
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Ceritakan sedikit tentang diri Anda..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Simpan & Lanjutkan
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Informasi ini akan membantu kami memberikan pengalaman terbaik untuk Anda
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
