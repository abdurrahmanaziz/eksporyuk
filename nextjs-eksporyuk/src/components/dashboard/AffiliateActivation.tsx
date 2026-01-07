'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Users, TrendingUp, Star, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface AffiliateStatus {
  hasProfile: boolean
  isActive: boolean
  affiliateCode: string | null
  tier: string | null
  totalEarnings: number
  totalReferrals: number
  activatedAt: string | null
}

interface UserInfo {
  role: string
  name: string
  email: string
  affiliateMenuEnabled: boolean
}

export default function AffiliateActivation() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<AffiliateStatus | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [canActivate, setCanActivate] = useState(false)

  // Fetch current status
  useEffect(() => {
    if (!session?.user?.id) return
    
    fetchStatus()
  }, [session?.user?.id])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/affiliate/activate')
      if (res.ok) {
        const data = await res.json()
        setStatus(data.currentStatus)
        setUserInfo(data.userInfo)
        setCanActivate(data.canActivate)
      }
    } catch (error) {
      console.error('Error fetching affiliate status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    setActivating(true)
    
    try {
      const res = await fetch('/api/affiliate/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || 'Affiliate berhasil diaktifkan!')
        await fetchStatus()
        // Refresh page to update navigation
        window.location.reload()
      } else {
        toast.error(data.error || 'Gagal mengaktifkan affiliate')
      }
    } catch (error) {
      console.error('Error activating affiliate:', error)
      toast.error('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If already active affiliate
  if (status?.isActive) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2 text-green-700\">
            <CheckCircle className=\"w-5 h-5\" />
            Affiliate Aktif
          </CardTitle>
          <CardDescription>
            Anda sudah terdaftar sebagai affiliate dan dapat mengakses semua fitur affiliate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mb-4\">
            <div className=\"text-center\">
              <div className=\"text-2xl font-bold text-green-600\">{status.affiliateCode}</div>
              <div className=\"text-sm text-gray-600\">Kode Affiliate</div>
            </div>
            <div className=\"text-center\">
              <div className=\"text-2xl font-bold text-blue-600\">{status.tier}</div>
              <div className=\"text-sm text-gray-600\">Tier</div>
            </div>
            <div className=\"text-center\">
              <div className=\"text-2xl font-bold text-emerald-600\">
                Rp {status.totalEarnings.toLocaleString()}
              </div>
              <div className=\"text-sm text-gray-600\">Total Komisi</div>
            </div>
            <div className=\"text-center\">
              <div className=\"text-2xl font-bold text-purple-600\">{status.totalReferrals}</div>
              <div className=\"text-sm text-gray-600\">Referral</div>
            </div>
          </div>
          
          <Button asChild className=\"w-full\">
            <a href=\"/affiliate/dashboard\">
              Buka Dashboard Affiliate
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // If can activate affiliate
  if (canActivate) {
    return (
      <Card className=\"border-blue-200 bg-blue-50\">
        <CardHeader>
          <CardTitle className=\"flex items-center gap-2 text-blue-700\">
            <DollarSign className=\"w-5 h-5\" />
            Bergabung sebagai Affiliate
          </CardTitle>
          <CardDescription>
            Dapatkan komisi dari setiap referral dan penjualan yang Anda buat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4 mb-6\">
            <div className=\"flex items-center gap-3\">
              <Users className=\"w-5 h-5 text-blue-600\" />
              <span className="text-sm">Semua role dapat gabung Rich Affiliate</span>
            </div>
            <div className=\"flex items-center gap-3\">
              <TrendingUp className=\"w-5 h-5 text-green-600\" />
              <span className=\"text-sm\">Dapatkan komisi hingga 30% dari setiap penjualan</span>
            </div>
            <div className=\"flex items-center gap-3\">
              <Star className=\"w-5 h-5 text-yellow-600\" />
              <span className=\"text-sm\">Akses tools affiliate dan analytics lengkap</span>
            </div>
          </div>

          <Button 
            onClick={handleActivate}
            disabled={activating}
            className=\"w-full bg-blue-600 hover:bg-blue-700\"
          >
            {activating ? 'Mengaktifkan...' : 'Aktifkan Affiliate Sekarang'}
          </Button>

          <p className=\"text-xs text-gray-500 mt-3 text-center\">
            Role Anda saat ini: <span className=\"font-medium\">{userInfo?.role}</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  // No access or unknown state
  return (
    <Card className=\"border-gray-200\">
      <CardHeader>
        <CardTitle className=\"flex items-center gap-2 text-gray-700\">
          <AlertCircle className=\"w-5 h-5\" />
          Affiliate
        </CardTitle>
        <CardDescription>
          Status affiliate Anda tidak dapat ditentukan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchStatus} variant=\"outline\" className=\"w-full\">
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}