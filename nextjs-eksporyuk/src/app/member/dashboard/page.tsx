'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Book,
  Users,
  Calendar,
  Award,
  MessageCircle,
  Download,
  Star,
  Clock,
  CheckCircle,
  Play,
  FileText,
  Target,
  TrendingUp,
  Gift
} from 'lucide-react'
import Link from 'next/link'

interface MembershipData {
  id: string
  type: string
  status: string
  startDate: string
  expiresAt: string | null
  features: Record<string, boolean>
  user: {
    name: string
    email: string
  }
}

interface ProgressData {
  completedModules: number
  totalModules: number
  completedQuizzes: number
  totalQuizzes: number
  certificatesEarned: number
}

export default function MemberDashboard() {
  const { data: session } = useSession()
  const [membership, setMembership] = useState<MembershipData | null>(null)
  const [progress, setProgress] = useState<ProgressData>({
    completedModules: 8,
    totalModules: 12,
    completedQuizzes: 5,
    totalQuizzes: 8,
    certificatesEarned: 2
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembershipData()
  }, [session])

  const fetchMembershipData = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setMembership({
          id: 'mem-12345',
          type: 'LIFETIME',
          status: 'ACTIVE',
          startDate: '2025-01-01T00:00:00Z',
          expiresAt: null,
          features: {
            access_materials: true,
            whatsapp_group: true,
            live_mentoring: true,
            templates: true,
            support_24_7: true,
            certificates: true
          },
          user: {
            name: session?.user?.name || 'Member',
            email: session?.user?.email || 'member@example.com'
          }
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching membership:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!membership || membership.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-6">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Membership Tidak Aktif</h2>
            <p className="text-gray-600 mb-4">
              Anda belum memiliki membership aktif. Silakan bergabung untuk mengakses semua fitur.
            </p>
            <Link href="/sales/membership-lifetime">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Bergabung Sekarang
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercentage = Math.round((progress.completedModules / progress.totalModules) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-ekspor-yuk.png" 
                alt="Ekspor Yuk" 
                className="h-8"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-orange-500">Member Dashboard</h1>
                <p className="text-sm text-gray-600">Selamat datang, {membership.user.name}!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                {membership.type === 'LIFETIME' ? 'Lifetime Member' : 'Active Member'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Selamat Datang di Ekspor Yuk! 🎉
                    </h2>
                    <p className="text-orange-100 mb-4">
                      Anda sudah menjadi bagian dari komunitas eksportir terbesar di Indonesia!
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-orange-200">Progress Belajar</p>
                        <p className="text-xl font-bold">{progressPercentage}%</p>
                      </div>
                      <Progress value={progressPercentage} className="flex-1 bg-orange-400" />
                    </div>
                  </div>
                  <Award className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-orange-500" />
                  Progress Pembelajaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Book className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">
                      {progress.completedModules}/{progress.totalModules}
                    </p>
                    <p className="text-sm text-gray-600">Modul Selesai</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {progress.completedQuizzes}/{progress.totalQuizzes}
                    </p>
                    <p className="text-sm text-gray-600">Quiz Selesai</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">
                      {progress.certificatesEarned}
                    </p>
                    <p className="text-sm text-gray-600">Sertifikat</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-orange-500" />
                  Modul Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: 'Mengenal Pasar Ekspor Global',
                    description: 'Pelajari tren dan peluang ekspor terbaru di berbagai negara',
                    duration: '45 menit',
                    status: 'available',
                    progress: 0
                  },
                  {
                    title: 'Dokumentasi Ekspor yang Benar',
                    description: 'Panduan lengkap membuat dokumen ekspor sesuai standar',
                    duration: '60 menit',
                    status: 'in-progress',
                    progress: 65
                  },
                  {
                    title: 'Strategi Pricing Export',
                    description: 'Cara menentukan harga yang kompetitif di pasar internasional',
                    duration: '35 menit',
                    status: 'completed',
                    progress: 100
                  },
                ].map((module, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        module.status === 'completed' ? 'bg-green-100' :
                        module.status === 'in-progress' ? 'bg-orange-100' :
                        'bg-gray-100'
                      }`}>
                        {module.status === 'completed' ? 
                          <CheckCircle className="w-5 h-5 text-green-600" /> :
                          <Play className="w-5 h-5 text-orange-600" />
                        }
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{module.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {module.duration}
                        </span>
                        {module.progress > 0 && module.progress < 100 && (
                          <div className="flex items-center gap-2 flex-1">
                            <Progress value={module.progress} className="flex-1 h-2" />
                            <span className="text-xs text-gray-500">{module.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button size="sm" variant={module.status === 'completed' ? 'outline' : 'default'}>
                      {module.status === 'completed' ? 'Review' : 
                       module.status === 'in-progress' ? 'Lanjutkan' : 'Mulai'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  Status Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge className="mb-2 bg-green-100 text-green-700 border-green-200">
                    {membership.type === 'LIFETIME' ? 'Lifetime' : 'Premium'} Member
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Aktif sejak {new Date(membership.startDate).toLocaleDateString('id-ID')}
                  </p>
                  {membership.expiresAt && (
                    <p className="text-sm text-gray-600">
                      Berakhir: {new Date(membership.expiresAt).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Fitur Tersedia:</h4>
                  {Object.entries(membership.features).map(([feature, enabled]) => (
                    enabled && (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>
                          {feature === 'access_materials' ? 'Akses Semua Materi' :
                           feature === 'whatsapp_group' ? 'Group WhatsApp' :
                           feature === 'live_mentoring' ? 'Live Mentoring' :
                           feature === 'templates' ? 'Template & Tools' :
                           feature === 'support_24_7' ? 'Support 24/7' :
                           feature === 'certificates' ? 'Sertifikat' :
                           feature}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Group WhatsApp
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Live Mentoring
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Sertifikat Saya
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  Acara Mendatang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Live Mentoring</p>
                      <p className="text-xs text-gray-600">Sabtu, 30 Nov 2025</p>
                      <p className="text-xs text-gray-600">19:00 - 21:00 WIB</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Webinar Export Trends 2026</p>
                      <p className="text-xs text-gray-600">Minggu, 1 Des 2025</p>
                      <p className="text-xs text-gray-600">20:00 - 22:00 WIB</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-500" />
                  Pencapaian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Fast Learner</p>
                    <p className="text-xs text-gray-600">Selesaikan 5 modul dalam seminggu</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Community Helper</p>
                    <p className="text-xs text-gray-600">Aktif membantu member lain</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Expert Level</p>
                    <p className="text-xs text-gray-600">Selesaikan semua modul</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">© 2025 CV. Ekspor Yuk Indonesia. All rights reserved.</p>
          <p className="text-sm text-gray-400">
            Member Dashboard - Wujudkan impian ekspor Anda bersama kami!
          </p>
        </div>
      </footer>
    </div>
  )
}