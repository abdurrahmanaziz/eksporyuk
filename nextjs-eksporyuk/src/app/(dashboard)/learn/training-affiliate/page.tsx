'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { getRoleTheme } from '@/lib/role-themes'

export default function AffiliateTrainingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const theme = session?.user?.role ? getRoleTheme(session.user.role) : getRoleTheme('AFFILIATE')

  useEffect(() => {
    if (status === 'authenticated') {
      findAndRedirectToTraining()
    }
  }, [status])

  const findAndRedirectToTraining = async () => {
    try {
      setLoading(true)
      
      // Cari kursus affiliate training
      const response = await fetch('/api/affiliate/training')
      const data = await response.json()
      
      if (response.ok && data.trainingCourses && data.trainingCourses.length > 0) {
        // Redirect ke kursus training pertama
        const mainTraining = data.trainingCourses[0]
        router.push(`/learn/${mainTraining.slug}`)
      } else {
        setError('Belum ada materi training affiliate yang tersedia')
      }
    } catch (err) {
      setError('Gagal memuat training affiliate')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check if user is affiliate
  const isAffiliate = session?.user?.role === 'AFFILIATE' || 
                      session?.user?.role === 'ADMIN' ||
                      session?.user?.role === 'CO_FOUNDER' ||
                      session?.user?.role === 'FOUNDER'

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: theme.primary }} />
            <p className="text-gray-600">Membuka materi training affiliate...</p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!isAffiliate) {
    return (
      <ResponsivePageWrapper>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${theme.primary}15` }}>
              <Lock className="w-8 h-8" style={{ color: theme.primary }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Terbatas</h1>
            <p className="text-gray-600 mb-6">
              Training affiliate ini hanya tersedia untuk affiliate terdaftar.
            </p>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (error) {
    return (
      <ResponsivePageWrapper>
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 border-red-200 bg-red-50">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Terjadi Kesalahan</h4>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
              </div>
            </div>
          </Card>
        </div>
      </ResponsivePageWrapper>
    )
  }

  return null
}
