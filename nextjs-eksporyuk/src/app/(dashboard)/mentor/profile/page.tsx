'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  Globe,
  BookOpen,
  Award,
  Briefcase,
  Camera,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface MentorProfile {
  id: string
  bio: string
  expertise: string[]
  qualifications: string[]
  socialLinks: {
    website?: string
    linkedin?: string
    twitter?: string
    youtube?: string
  }
  paymentInfo: {
    bankName?: string
    accountNumber?: string
    accountHolder?: string
  }
  isVerified: boolean
  totalCourses: number
  totalStudents: number
  rating: number
  user: {
    name: string
    email: string
    avatar?: string
    phone?: string
  }
}

export default function MentorProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<MentorProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'payment'>('profile')
  
  // Form states
  const [bio, setBio] = useState('')
  const [expertise, setExpertise] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [website, setWebsite] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [youtube, setYoutube] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'MENTOR' && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchProfile()
    }
  }, [status, session, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mentor/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        // Set form values
        setBio(data.bio || '')
        setExpertise(data.expertise?.join(', ') || '')
        setQualifications(data.qualifications?.join(', ') || '')
        setWebsite(data.socialLinks?.website || '')
        setLinkedin(data.socialLinks?.linkedin || '')
        setYoutube(data.socialLinks?.youtube || '')
        setBankName(data.paymentInfo?.bankName || '')
        setAccountNumber(data.paymentInfo?.accountNumber || '')
        setAccountHolder(data.paymentInfo?.accountHolder || '')
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/mentor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          expertise: expertise.split(',').map(e => e.trim()).filter(Boolean),
          qualifications: qualifications.split(',').map(q => q.trim()).filter(Boolean),
          socialLinks: {
            website,
            linkedin,
            youtube,
          },
          paymentInfo: {
            bankName,
            accountNumber,
            accountHolder,
          },
        }),
      })
      
      if (res.ok) {
        await fetchProfile()
        alert('Profil berhasil disimpan!')
      } else {
        alert('Gagal menyimpan profil')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pengaturan Mentor</h1>
            <p className="text-gray-600 mt-1">Kelola profil dan pengaturan akun mentor Anda</p>
          </div>
        </div>

        {/* Profile Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                {profile?.user?.avatar ? (
                  <img
                    src={profile.user.avatar}
                    alt={profile.user.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile?.user?.name || 'Mentor'}
                  </h2>
                  {profile?.isVerified ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Terverifikasi
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Belum Verifikasi
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 mb-3">{profile?.user?.email}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>{profile?.totalCourses || 0} Kursus</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-green-600" />
                    <span>{profile?.totalStudents || 0} Siswa</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span>{profile?.rating?.toFixed(1) || '0.0'} Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium border-b-2 -mb-px ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Profil Mentor
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 font-medium border-b-2 -mb-px ${
              activeTab === 'payment'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Info Pembayaran
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tentang Anda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Ceritakan tentang diri Anda dan pengalaman mengajar..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="expertise">Keahlian</Label>
                  <Input
                    id="expertise"
                    placeholder="Contoh: Digital Marketing, Export Import, E-commerce"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pisahkan dengan koma</p>
                </div>
                
                <div>
                  <Label htmlFor="qualifications">Kualifikasi</Label>
                  <Input
                    id="qualifications"
                    placeholder="Contoh: Certified Digital Marketer, 10+ Years Experience"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pisahkan dengan koma</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <div className="relative mt-1">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="youtube">YouTube</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="youtube"
                      placeholder="https://youtube.com/@channel"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle>Informasi Rekening Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Informasi ini digunakan untuk pencairan komisi Anda.
              </p>
              
              <div>
                <Label htmlFor="bankName">Nama Bank</Label>
                <Input
                  id="bankName"
                  placeholder="Contoh: BCA, Mandiri, BNI"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                <Input
                  id="accountNumber"
                  placeholder="Masukkan nomor rekening"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="accountHolder">Nama Pemilik Rekening</Label>
                <Input
                  id="accountHolder"
                  placeholder="Nama sesuai buku tabungan"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
