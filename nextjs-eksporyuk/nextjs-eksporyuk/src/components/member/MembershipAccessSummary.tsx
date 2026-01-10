'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Crown,
  Check,
  X,
  ArrowRight,
  BookOpen,
  Users,
  Package,
  FileText,
  Award,
  Video,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { useMemberAccess } from '@/hooks/useMemberAccess'

interface MembershipAccessSummaryProps {
  showUpgradeOptions?: boolean
  compact?: boolean
}

/**
 * Shows a summary of user's membership access and what's locked/available
 */
export default function MembershipAccessSummary({
  showUpgradeOptions = true,
  compact = false,
}: MembershipAccessSummaryProps) {
  const { data, loading, hasMembership, getUpgradeUrl } = useMemberAccess()

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  // Feature icons
  const featureIcons: Record<string, React.ReactNode> = {
    courses: <BookOpen className="w-4 h-4" />,
    groups: <Users className="w-4 h-4" />,
    products: <Package className="w-4 h-4" />,
    documents: <FileText className="w-4 h-4" />,
    certificates: <Award className="w-4 h-4" />,
    mentoring: <Video className="w-4 h-4" />,
    whatsappGroup: <MessageCircle className="w-4 h-4" />,
  }

  // Feature labels
  const featureLabels: Record<string, string> = {
    courses: 'Kursus Eksklusif',
    groups: 'Grup Komunitas',
    products: 'Produk Bonus',
    documents: 'Dokumen Premium',
    certificates: 'Sertifikat',
    mentoring: 'Live Mentoring',
    whatsappGroup: 'Grup WhatsApp',
    advancedAnalytics: 'Analitik Lanjutan',
    prioritySupport: 'Dukungan Prioritas',
  }

  // Count available vs locked
  const lockedFeatures = data.locked ? Object.entries(data.locked).filter(([, locked]) => locked) : []
  const unlockedFeatures = data.locked ? Object.entries(data.locked).filter(([, locked]) => !locked) : []
  const totalFeatures = Object.keys(data.locked || {}).length
  const accessPercentage = totalFeatures > 0 
    ? Math.round((unlockedFeatures.length / totalFeatures) * 100) 
    : 0

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                hasMembership ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Crown className={`w-5 h-5 ${hasMembership ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-medium">
                  {hasMembership ? data.membership?.name : 'Belum Berlangganan'}
                </p>
                <p className="text-sm text-gray-500">
                  {hasMembership 
                    ? `${unlockedFeatures.length} fitur aktif`
                    : 'Upgrade untuk akses penuh'}
                </p>
              </div>
            </div>
            {!hasMembership && (
              <Link href={getUpgradeUrl()}>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Membership Card */}
      <Card className={hasMembership ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className={`w-5 h-5 ${hasMembership ? 'text-green-600' : 'text-orange-500'}`} />
              {hasMembership ? 'Membership Aktif' : 'Belum Berlangganan'}
            </CardTitle>
            {hasMembership && data.membership && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {data.membership.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasMembership && data.membership ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Akses Fitur</span>
                <span className="font-medium">{accessPercentage}%</span>
              </div>
              <Progress value={accessPercentage} className="h-2" />
              
              {data.membership.daysRemaining !== null && (
                <p className="text-sm text-gray-600">
                  Masa aktif tersisa: <span className="font-medium">{data.membership.daysRemaining} hari</span>
                </p>
              )}
              {data.membership.isLifetime && (
                <p className="text-sm text-green-600 font-medium">
                  ✨ Lifetime Access - Tidak akan expired
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Bergabung sebagai member untuk mengakses kursus, grup komunitas, dan berbagai fitur eksklusif lainnya.
              </p>
              <Link href={getUpgradeUrl()}>
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Mulai Berlangganan
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Akses Fitur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Available features */}
            {unlockedFeatures.map(([feature]) => (
              <div key={feature} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  {featureIcons[feature] || <Check className="w-4 h-4 text-green-600" />}
                </div>
                <span className="flex-1 font-medium text-green-700">
                  {featureLabels[feature] || feature}
                </span>
                <Check className="w-5 h-5 text-green-500" />
              </div>
            ))}

            {/* Locked features */}
            {lockedFeatures.map(([feature]) => (
              <div key={feature} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {featureIcons[feature] || <X className="w-4 h-4 text-gray-400" />}
                </div>
                <span className="flex-1 text-gray-500">
                  {featureLabels[feature] || feature}
                </span>
                <Badge variant="outline" className="text-gray-500">
                  Upgrade
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessible Content Summary */}
      {hasMembership && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{data.access?.courses?.length || 0}</p>
              <p className="text-sm text-gray-600">Kursus Tersedia</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{data.access?.groups?.length || 0}</p>
              <p className="text-sm text-gray-600">Grup Komunitas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{data.access?.products?.length || 0}</p>
              <p className="text-sm text-gray-600">Produk Bonus</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Options */}
      {showUpgradeOptions && data.upgradeOptions && data.upgradeOptions.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Upgrade Membership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.upgradeOptions.slice(0, 3).map((option) => (
                <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{option.name}</p>
                    <p className="text-sm text-gray-500">
                      {option.coursesCount} kursus, {option.groupsCount} grup
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      Rp {option.price.toLocaleString('id-ID')}
                    </p>
                    <Link href={`/checkout/${option.slug}`}>
                      <Button size="sm" variant="outline" className="mt-1">
                        Pilih <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
