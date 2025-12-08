'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Target,
  Plus,
  Trophy,
  Users,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Gift,
  Award,
  ChevronDown,
  Settings,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Challenge {
  id: string
  title: string
  description: string
  targetType: string
  targetValue: number
  rewardType: string
  rewardValue: number
  startDate: string
  endDate: string
  isActive: boolean
  status: string
  participantsCount: number
  completedCount: number
  claimedCount: number
  averageProgress: number
  completionRate: string
  createdAt: string
  membershipId?: string
  productId?: string
  courseId?: string
  membership?: { id: string; name: string; slug: string }
  product?: { id: string; name: string; slug: string }
  course?: { id: string; title: string; slug: string }
}

interface Participant {
  rank: number
  affiliateId: string
  userId: string
  name: string
  email: string
  avatar: string | null
  tier: number
  currentValue: number
  progress: number
  completed: boolean
  completedAt: string | null
  rewardClaimed: boolean
  claimedAt: string | null
  joinedAt: string
}

interface ChallengeDetail {
  challenge: Challenge
  participants: Participant[]
  stats: {
    participantsCount: number
    completedCount: number
    claimedCount: number
    totalProgressValue: number
    averageProgress: number
    completionRate: string
  }
}

const TARGET_TYPES = [
  { value: 'SALES_COUNT', label: 'Total Penjualan', unit: 'pcs' },
  { value: 'REVENUE', label: 'Total Revenue', unit: 'Rp' },
  { value: 'CLICKS', label: 'Total Klik', unit: 'klik' },
  { value: 'CONVERSIONS', label: 'Total Konversi', unit: 'konversi' },
  { value: 'NEW_CUSTOMERS', label: 'Customer Baru', unit: 'customer' },
]

const REWARD_TYPES = [
  { value: 'BONUS_COMMISSION', label: 'Bonus Komisi', description: 'Ditambahkan ke wallet' },
  { value: 'CASH_BONUS', label: 'Cash Bonus', description: 'Bonus tunai langsung' },
]

export default function AdminAffiliateChallengesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Settings state
  const [autoApprove, setAutoApprove] = useState(false)
  const [autoApproveLimit, setAutoApproveLimit] = useState(500000)
  const [showSettingsCard, setShowSettingsCard] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  
  // Product options for challenge
  const [memberships, setMemberships] = useState<{id: string, name: string}[]>([])
  const [products, setProducts] = useState<{id: string, name: string}[]>([])
  const [courses, setCourses] = useState<{id: string, title: string}[]>([])
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [challengeDetail, setChallengeDetail] = useState<ChallengeDetail | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetType: 'SALES_COUNT',
    targetValue: '',
    rewardType: 'BONUS_COMMISSION',
    rewardValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
    membershipId: '',
    productId: '',
    courseId: '',
    linkType: 'none' as 'none' | 'membership' | 'product' | 'course'
  })

  // Check admin access
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch data
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchChallenges()
      fetchProductOptions()
      fetchSettings()
    }
  }, [status, session, statusFilter])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/challenge-rewards')
      if (response.ok) {
        const data = await response.json()
        setAutoApprove(data.challengeRewardAutoApprove)
        setAutoApproveLimit(data.challengeRewardAutoApproveLimit)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleUpdateSettings = async () => {
    setSettingsLoading(true)
    try {
      const response = await fetch('/api/admin/settings/challenge-rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeRewardAutoApprove: autoApprove,
          challengeRewardAutoApproveLimit: autoApproveLimit
        })
      })

      if (response.ok) {
        toast.success('Settings updated successfully!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setSettingsLoading(false)
    }
  }

  const fetchProductOptions = async () => {
    try {
      const [membershipRes, productRes, courseRes] = await Promise.all([
        fetch('/api/memberships?limit=100'),
        fetch('/api/products?limit=100'),
        fetch('/api/courses?limit=100')
      ])
      
      if (membershipRes.ok) {
        const data = await membershipRes.json()
        setMemberships(data.memberships || data || [])
      }
      if (productRes.ok) {
        const data = await productRes.json()
        setProducts(data.products || data || [])
      }
      if (courseRes.ok) {
        const data = await courseRes.json()
        setCourses(data.courses || data || [])
      }
    } catch (error) {
      console.error('Error fetching product options:', error)
    }
  }

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
      const response = await fetch(`/api/admin/affiliate/challenges?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        setChallenges(data.challenges || [])
      } else {
        toast.error(data.error || 'Gagal memuat data')
      }
    } catch (error) {
      console.error('Error fetching challenges:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const fetchChallengeDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/affiliate/challenges/${id}`)
      const data = await response.json()
      
      if (response.ok) {
        setChallengeDetail(data)
      } else {
        toast.error(data.error || 'Gagal memuat detail')
      }
    } catch (error) {
      console.error('Error fetching challenge detail:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleCreateChallenge = async () => {
    try {
      setActionLoading(true)
      
      // Validation
      if (!formData.title || !formData.description || !formData.targetValue || !formData.rewardValue || !formData.startDate || !formData.endDate) {
        toast.error('Semua field harus diisi')
        return
      }
      
      // Build payload with product relations
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        targetType: formData.targetType,
        targetValue: parseFloat(formData.targetValue),
        rewardType: formData.rewardType,
        rewardValue: parseFloat(formData.rewardValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive
      }
      
      // Add product relation based on link type
      if (formData.linkType === 'membership' && formData.membershipId) {
        payload.membershipId = formData.membershipId
      } else if (formData.linkType === 'product' && formData.productId) {
        payload.productId = formData.productId
      } else if (formData.linkType === 'course' && formData.courseId) {
        payload.courseId = formData.courseId
      }
      
      const response = await fetch('/api/admin/affiliate/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Challenge berhasil dibuat!')
        setShowCreateModal(false)
        resetForm()
        fetchChallenges()
      } else {
        toast.error(data.error || 'Gagal membuat challenge')
      }
    } catch (error) {
      console.error('Error creating challenge:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateChallenge = async () => {
    if (!selectedChallenge) return
    
    try {
      setActionLoading(true)
      
      // Build payload with product relations
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        isActive: formData.isActive,
        targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
        rewardValue: formData.rewardValue ? parseFloat(formData.rewardValue) : undefined,
        targetType: formData.targetType,
        rewardType: formData.rewardType,
        startDate: formData.startDate,
        endDate: formData.endDate
      }
      
      // Handle product relations - set to null if type changed
      if (formData.linkType === 'membership') {
        payload.membershipId = formData.membershipId || null
        payload.productId = null
        payload.courseId = null
      } else if (formData.linkType === 'product') {
        payload.membershipId = null
        payload.productId = formData.productId || null
        payload.courseId = null
      } else if (formData.linkType === 'course') {
        payload.membershipId = null
        payload.productId = null
        payload.courseId = formData.courseId || null
      } else {
        payload.membershipId = null
        payload.productId = null
        payload.courseId = null
      }
      
      const response = await fetch(`/api/admin/affiliate/challenges/${selectedChallenge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Challenge berhasil diupdate!')
        setShowEditModal(false)
        setSelectedChallenge(null)
        resetForm()
        fetchChallenges()
      } else {
        toast.error(data.error || 'Gagal mengupdate challenge')
      }
    } catch (error) {
      console.error('Error updating challenge:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteChallenge = async () => {
    if (!selectedChallenge) return
    
    try {
      setActionLoading(true)
      
      const response = await fetch(`/api/admin/affiliate/challenges/${selectedChallenge.id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Challenge berhasil dihapus!')
        setShowDeleteModal(false)
        setSelectedChallenge(null)
        fetchChallenges()
      } else {
        toast.error(data.error || 'Gagal menghapus challenge')
      }
    } catch (error) {
      console.error('Error deleting challenge:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleActive = async (challenge: Challenge) => {
    try {
      const response = await fetch(`/api/admin/affiliate/challenges/${challenge.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !challenge.isActive }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Challenge berhasil di${challenge.isActive ? 'nonaktifkan' : 'aktifkan'}!`)
        fetchChallenges()
      } else {
        toast.error(data.error || 'Gagal mengubah status')
      }
    } catch (error) {
      console.error('Error toggling challenge:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetType: 'SALES_COUNT',
      targetValue: '',
      rewardType: 'BONUS_COMMISSION',
      rewardValue: '',
      startDate: '',
      endDate: '',
      isActive: true,
      membershipId: '',
      productId: '',
      courseId: '',
      linkType: 'none'
    })
  }

  const openEditModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    
    // Determine link type
    let linkType: 'none' | 'membership' | 'product' | 'course' = 'none'
    if (challenge.membershipId) linkType = 'membership'
    else if (challenge.productId) linkType = 'product'
    else if (challenge.courseId) linkType = 'course'
    
    setFormData({
      title: challenge.title,
      description: challenge.description,
      targetType: challenge.targetType,
      targetValue: String(challenge.targetValue),
      rewardType: challenge.rewardType,
      rewardValue: String(challenge.rewardValue),
      startDate: challenge.startDate.split('T')[0],
      endDate: challenge.endDate.split('T')[0],
      isActive: challenge.isActive,
      membershipId: challenge.membershipId || '',
      productId: challenge.productId || '',
      courseId: challenge.courseId || '',
      linkType
    })
    setShowEditModal(true)
  }

  const openDetailModal = async (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setShowDetailModal(true)
    await fetchChallengeDetail(challenge.id)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getTargetTypeLabel = (type: string) => {
    return TARGET_TYPES.find(t => t.value === type)?.label || type
  }

  const getRewardTypeLabel = (type: string) => {
    return REWARD_TYPES.find(r => r.value === type)?.label || type
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Nonaktif</Badge>
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Akan Datang</Badge>
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800">Selesai</Badge>
      default:
        return null
    }
  }

  // Calculate stats
  const totalChallenges = challenges.length
  const activeChallenges = challenges.filter(c => c.status === 'active' && c.isActive).length
  const totalParticipants = challenges.reduce((sum, c) => sum + c.participantsCount, 0)
  const totalCompleted = challenges.reduce((sum, c) => sum + c.completedCount, 0)

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data challenge...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Manajemen Challenge Affiliate
            </h1>
            <p className="text-gray-600 mt-1">
              Buat dan kelola tantangan untuk affiliate
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSettingsCard(!showSettingsCard)}
              className="border-orange-300"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Challenge
            </Button>
          </div>
        </div>

        {/* Settings Card (Collapsible) */}
        {showSettingsCard && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-600" />
                Pengaturan Approval Reward
              </CardTitle>
              <CardDescription>
                Atur apakah reward otomatis di-approve atau perlu approval manual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {autoApprove ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="font-semibold">
                      Auto-Approve Reward
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {autoApprove 
                      ? '✅ Reward langsung masuk ke wallet affiliate tanpa approval manual'
                      : '❌ Semua reward butuh approval manual dari admin'
                    }
                  </p>
                </div>
                <Button
                  variant={autoApprove ? 'default' : 'outline'}
                  onClick={() => setAutoApprove(!autoApprove)}
                  className={autoApprove ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {autoApprove ? 'ON' : 'OFF'}
                </Button>
              </div>

              {autoApprove && (
                <div className="p-4 bg-white rounded-lg border space-y-3">
                  <Label htmlFor="autoApproveLimit">
                    Limit Auto-Approve (Rp)
                  </Label>
                  <p className="text-sm text-gray-600">
                    Reward di bawah limit ini akan otomatis di-approve. Reward di atas limit tetap butuh approval manual.
                  </p>
                  <Input
                    id="autoApproveLimit"
                    type="number"
                    value={autoApproveLimit}
                    onChange={(e) => setAutoApproveLimit(Number(e.target.value))}
                    min={0}
                    step={50000}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500">
                    Contoh: Rp 500.000 → Reward ≤ Rp 500K auto-approve, {'>'}Rp 500K manual
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowSettingsCard(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateSettings}
                  disabled={settingsLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Challenge
              </CardTitle>
              <Target className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChallenges}</div>
              <p className="text-xs text-gray-500 mt-1">
                {activeChallenges} aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Peserta
              </CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalParticipants}</div>
              <p className="text-xs text-gray-500 mt-1">
                Bergabung di semua challenge
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Selesai
              </CardTitle>
              <Trophy className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
              <p className="text-xs text-gray-500 mt-1">
                Berhasil menyelesaikan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Rata-rata Completion
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalParticipants > 0 
                  ? ((totalCompleted / totalParticipants) * 100).toFixed(1) 
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tingkat penyelesaian
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Cari challenge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="upcoming">Akan Datang</SelectItem>
                  <SelectItem value="ended">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Challenges List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Challenge</CardTitle>
            <CardDescription>
              {challenges.length} challenge ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {challenges.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">Belum ada challenge</h3>
                <p className="text-gray-500 mt-1">
                  Buat challenge pertama untuk memotivasi affiliate
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Challenge
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-gray-600">Challenge</th>
                      <th className="text-left p-4 font-medium text-gray-600">Target</th>
                      <th className="text-left p-4 font-medium text-gray-600">Hadiah</th>
                      <th className="text-left p-4 font-medium text-gray-600">Periode</th>
                      <th className="text-center p-4 font-medium text-gray-600">Peserta</th>
                      <th className="text-center p-4 font-medium text-gray-600">Status</th>
                      <th className="text-center p-4 font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challenges
                      .filter(c => 
                        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((challenge) => (
                        <tr key={challenge.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{challenge.title}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {challenge.description}
                              </div>
                              {(challenge.membership || challenge.product || challenge.course) && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    🔗 {challenge.membership?.name || challenge.product?.name || challenge.course?.title}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="font-medium">
                                {challenge.targetType === 'REVENUE' 
                                  ? formatCurrency(challenge.targetValue)
                                  : challenge.targetValue}
                              </div>
                              <div className="text-gray-500">
                                {getTargetTypeLabel(challenge.targetType)}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="font-medium text-green-600">
                                {challenge.rewardType === 'BONUS_COMMISSION' || challenge.rewardType === 'CASH_BONUS'
                                  ? formatCurrency(challenge.rewardValue)
                                  : `+${challenge.rewardValue}`}
                              </div>
                              <div className="text-gray-500">
                                {getRewardTypeLabel(challenge.rewardType)}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {formatDate(challenge.startDate)}
                              </div>
                              <div className="text-gray-500">
                                s/d {formatDate(challenge.endDate)}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div>
                              <div className="font-medium">{challenge.participantsCount}</div>
                              <div className="text-xs text-green-600">
                                {challenge.completedCount} selesai
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {getStatusBadge(challenge.status, challenge.isActive)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDetailModal(challenge)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditModal(challenge)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleActive(challenge)}>
                                    {challenge.isActive ? (
                                      <>
                                        <Award className="w-4 h-4 mr-2" />
                                        Nonaktifkan
                                      </>
                                    ) : (
                                      <>
                                        <Award className="w-4 h-4 mr-2" />
                                        Aktifkan
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  {challenge.completedCount === 0 && (
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => {
                                        setSelectedChallenge(challenge)
                                        setShowDeleteModal(true)
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Hapus
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Challenge Baru</DialogTitle>
              <DialogDescription>
                Buat tantangan untuk memotivasi affiliate
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Judul Challenge *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Challenge Penjualan Mingguan"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan detail challenge ini..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipe Target *</Label>
                  <Select
                    value={formData.targetType}
                    onValueChange={(value) => setFormData({ ...formData, targetType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="targetValue">Nilai Target *</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder={formData.targetType === 'REVENUE' ? '1000000' : '10'}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipe Hadiah *</Label>
                  <Select
                    value={formData.rewardType}
                    onValueChange={(value) => setFormData({ ...formData, rewardType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REWARD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div>{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rewardValue">
                    Nilai Hadiah * (Rp)
                  </Label>
                  <Input
                    id="rewardValue"
                    type="number"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                    placeholder="100000"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Tanggal Mulai *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Tanggal Berakhir *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Product Link Selection */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-sm font-medium">Produk untuk Challenge (Opsional)</Label>
                <p className="text-xs text-gray-500 mb-3">
                  Pilih produk yang harus dipromosikan affiliate untuk challenge ini
                </p>
                
                <Select
                  value={formData.linkType}
                  onValueChange={(value: 'none' | 'membership' | 'product' | 'course') => {
                    setFormData({ 
                      ...formData, 
                      linkType: value,
                      membershipId: '',
                      productId: '',
                      courseId: ''
                    })
                  }}
                >
                  <SelectTrigger className="mb-3">
                    <SelectValue placeholder="Pilih tipe produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak Ada (Semua produk)</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="product">Produk Digital</SelectItem>
                    <SelectItem value="course">Kelas</SelectItem>
                  </SelectContent>
                </Select>

                {formData.linkType === 'membership' && (
                  <Select
                    value={formData.membershipId}
                    onValueChange={(value) => setFormData({ ...formData, membershipId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih membership..." />
                    </SelectTrigger>
                    <SelectContent>
                      {memberships.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {formData.linkType === 'product' && (
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {formData.linkType === 'course' && (
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handleCreateChallenge}
                disabled={actionLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {actionLoading ? 'Membuat...' : 'Buat Challenge'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Challenge</DialogTitle>
              <DialogDescription>
                Perbarui informasi challenge
                {selectedChallenge && selectedChallenge.participantsCount > 0 && (
                  <span className="block text-orange-600 mt-1">
                    ⚠️ Beberapa field tidak dapat diubah karena sudah ada peserta
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Judul Challenge *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Deskripsi *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {selectedChallenge && selectedChallenge.participantsCount === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipe Target *</Label>
                      <Select
                        value={formData.targetType}
                        onValueChange={(value) => setFormData({ ...formData, targetType: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-targetValue">Nilai Target *</Label>
                      <Input
                        id="edit-targetValue"
                        type="number"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipe Hadiah *</Label>
                      <Select
                        value={formData.rewardType}
                        onValueChange={(value) => setFormData({ ...formData, rewardType: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REWARD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-rewardValue">Nilai Hadiah *</Label>
                      <Input
                        id="edit-rewardValue"
                        type="number"
                        value={formData.rewardValue}
                        onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-startDate">Tanggal Mulai *</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-endDate">Tanggal Berakhir *</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Product Link Selection - Always editable */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-sm font-medium">Produk untuk Challenge (Opsional)</Label>
                <p className="text-xs text-gray-500 mb-3">
                  Pilih produk yang harus dipromosikan affiliate untuk challenge ini
                </p>
                
                <Select
                  value={formData.linkType}
                  onValueChange={(value: 'none' | 'membership' | 'product' | 'course') => {
                    setFormData({ 
                      ...formData, 
                      linkType: value,
                      membershipId: '',
                      productId: '',
                      courseId: ''
                    })
                  }}
                >
                  <SelectTrigger className="mb-3">
                    <SelectValue placeholder="Pilih tipe produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak Ada (Semua produk)</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                    <SelectItem value="product">Produk Digital</SelectItem>
                    <SelectItem value="course">Kelas</SelectItem>
                  </SelectContent>
                </Select>

                {formData.linkType === 'membership' && (
                  <Select
                    value={formData.membershipId}
                    onValueChange={(value) => setFormData({ ...formData, membershipId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih membership..." />
                    </SelectTrigger>
                    <SelectContent>
                      {memberships.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {formData.linkType === 'product' && (
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {formData.linkType === 'course' && (
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedChallenge(null)
                  resetForm()
                }}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateChallenge}
                disabled={actionLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Challenge</DialogTitle>
              <DialogDescription>
                {selectedChallenge?.title}
              </DialogDescription>
            </DialogHeader>
            
            {challengeDetail ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {challengeDetail.stats.participantsCount}
                    </div>
                    <div className="text-sm text-gray-600">Peserta</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {challengeDetail.stats.completedCount}
                    </div>
                    <div className="text-sm text-gray-600">Selesai</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {challengeDetail.stats.completionRate}%
                    </div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                </div>

                {/* Challenge Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Informasi Challenge</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Target:</span>
                      <span className="ml-2 font-medium">
                        {challengeDetail.challenge.targetType === 'REVENUE'
                          ? formatCurrency(challengeDetail.challenge.targetValue)
                          : challengeDetail.challenge.targetValue} {getTargetTypeLabel(challengeDetail.challenge.targetType)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Hadiah:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(challengeDetail.challenge.rewardValue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Periode:</span>
                      <span className="ml-2 font-medium">
                        {formatDate(challengeDetail.challenge.startDate)} - {formatDate(challengeDetail.challenge.endDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2">
                        {getStatusBadge(challengeDetail.challenge.status, challengeDetail.challenge.isActive)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Participants Leaderboard */}
                <div>
                  <h4 className="font-medium mb-3">Leaderboard Peserta</h4>
                  {challengeDetail.participants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Belum ada peserta</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {challengeDetail.participants.map((participant) => (
                        <div
                          key={participant.affiliateId}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            participant.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 text-center font-bold text-gray-500">
                              #{participant.rank}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={participant.avatar || undefined} />
                              <AvatarFallback>
                                {participant.name?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.name}</p>
                              <p className="text-sm text-gray-500">{participant.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              {participant.completed && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Trophy className="w-3 h-3 mr-1" />
                                  Selesai
                                </Badge>
                              )}
                              {participant.rewardClaimed && (
                                <Badge variant="outline">
                                  <Gift className="w-3 h-3 mr-1" />
                                  Diklaim
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1">
                              <Progress value={participant.progress} className="h-2 w-32" />
                              <p className="text-xs text-gray-500 mt-1">
                                {challengeDetail.challenge.targetType === 'REVENUE'
                                  ? formatCurrency(participant.currentValue)
                                  : participant.currentValue} ({participant.progress.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedChallenge(null)
                  setChallengeDetail(null)
                }}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Challenge</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus challenge ini?
              </DialogDescription>
            </DialogHeader>
            
            {selectedChallenge && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-800">{selectedChallenge.title}</p>
                <p className="text-sm text-red-600 mt-1">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedChallenge(null)
                }}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteChallenge}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ResponsivePageWrapper>
  )
}
