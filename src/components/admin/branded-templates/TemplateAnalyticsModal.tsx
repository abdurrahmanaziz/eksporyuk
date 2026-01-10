'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  Users,
  Calendar,
  Activity,
  Target,
  Zap,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Download,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface AnalyticsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AnalyticsData {
  overview: {
    totalTemplates: number
    activeTemplates: number
    totalUsages: number
    avgUsagePerTemplate: number
    mostUsedTemplate: {
      name: string
      usageCount: number
    }
    leastUsedTemplate: {
      name: string
      usageCount: number
    }
  }
  byCategory: Array<{
    category: string
    count: number
    usages: number
    avgUsage: number
  }>
  byType: Array<{
    type: string
    count: number
    usages: number
    avgUsage: number
  }>
  byRole: Array<{
    roleTarget: string
    count: number
    usages: number
  }>
  recentActivity: Array<{
    templateName: string
    category: string
    type: string
    usedAt: string
    usageCount: number
  }>
  performanceMetrics: {
    highPerformers: Array<{
      name: string
      usageCount: number
      category: string
    }>
    underutilized: Array<{
      name: string
      usageCount: number
      category: string
    }>
    trending: Array<{
      name: string
      growthRate: number
      currentUsage: number
    }>
  }
  timeBasedStats: {
    lastWeek: number
    lastMonth: number
    growth: {
      weekly: number
      monthly: number
    }
  }
}

const CATEGORY_ICONS = {
  'SYSTEM': '⚙️',
  'MEMBERSHIP': '👑',
  'AFFILIATE': '🤝',
  'COURSE': '📚',
  'PAYMENT': '💳',
  'MARKETING': '📢',
  'NOTIFICATION': '🔔',
}

const TYPE_ICONS = {
  'EMAIL': '📧',
  'WHATSAPP': '💬',
  'SMS': '📱',
  'PUSH': '🔔',
}

export function TemplateAnalyticsModal({ open, onOpenChange }: AnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadAnalytics()
    }
  }, [open])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/branded-templates/analytics')
      const data = await res.json()

      if (data.success) {
        setAnalytics(data.data)
      } else {
        toast.error('Failed to load analytics')
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatGrowth = (value: number) => {
    const isPositive = value > 0
    const icon = isPositive ? TrendingUp : TrendingDown
    const color = isPositive ? 'text-green-600' : 'text-red-600'
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        {React.createElement(icon, { className: 'w-4 h-4' })}
        {Math.abs(value).toFixed(1)}%
      </div>
    )
  }

  if (!analytics && !loading) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Template Analytics & Performance
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadAnalytics}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : analytics ? (
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Templates</p>
                        <p className="text-2xl font-bold">{analytics.overview.totalTemplates}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Templates</p>
                        <p className="text-2xl font-bold">{analytics.overview.activeTemplates}</p>
                        <p className="text-xs text-gray-500">
                          {((analytics.overview.activeTemplates / analytics.overview.totalTemplates) * 100).toFixed(1)}% active
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Usages</p>
                        <p className="text-2xl font-bold">{analytics.overview.totalUsages.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {formatGrowth(analytics.timeBasedStats.growth.weekly)}
                          <span className="text-xs text-gray-500">vs last week</span>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Activity className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Usage</p>
                        <p className="text-2xl font-bold">{analytics.overview.avgUsagePerTemplate.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">per template</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Target className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Templates by Category</CardTitle>
                    <CardDescription>Distribution and usage by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.byCategory.map((item) => (
                        <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{CATEGORY_ICONS[item.category] || '📄'}</span>
                            <div>
                              <p className="font-medium">{item.category}</p>
                              <p className="text-sm text-gray-600">
                                {item.count} templates • {item.usages} total uses
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{item.avgUsage.toFixed(1)}</p>
                            <p className="text-xs text-gray-500">avg usage</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Templates by Type</CardTitle>
                    <CardDescription>Distribution across communication channels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.byType.map((item) => (
                        <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{TYPE_ICONS[item.type] || '📄'}</span>
                            <div>
                              <p className="font-medium">{item.type}</p>
                              <p className="text-sm text-gray-600">
                                {item.count} templates • {item.usages} total uses
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{item.avgUsage.toFixed(1)}</p>
                            <p className="text-xs text-gray-500">avg usage</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      High Performers
                    </CardTitle>
                    <CardDescription>Most used templates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.performanceMetrics.highPerformers.slice(0, 5).map((template, idx) => (
                        <div key={template.name} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-green-900">{template.name}</p>
                            <p className="text-sm text-green-700">
                              {template.category} • {template.usageCount} uses
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            {template.usageCount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Underutilized */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                      Underutilized
                    </CardTitle>
                    <CardDescription>Templates that need attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.performanceMetrics.underutilized.slice(0, 5).map((template) => (
                        <div key={template.name} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 rounded-full">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-orange-900">{template.name}</p>
                            <p className="text-sm text-orange-700">
                              {template.category} • {template.usageCount} uses
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                            {template.usageCount}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest template usage across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.recentActivity.slice(0, 8).map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Send className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{activity.templateName}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_ICONS[activity.category]} {activity.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {TYPE_ICONS[activity.type]} {activity.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{activity.usageCount} times</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.usedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Most Used</p>
                      <p className="font-bold text-lg text-purple-900">
                        {analytics.overview.mostUsedTemplate.name}
                      </p>
                      <p className="text-sm text-purple-700">
                        {analytics.overview.mostUsedTemplate.usageCount} uses
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white/50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Weekly Growth</p>
                      <div className="font-bold text-lg">
                        {formatGrowth(analytics.timeBasedStats.growth.weekly)}
                      </div>
                      <p className="text-sm text-gray-700">
                        {analytics.timeBasedStats.lastWeek} uses last week
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white/50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Monthly Growth</p>
                      <div className="font-bold text-lg">
                        {formatGrowth(analytics.timeBasedStats.growth.monthly)}
                      </div>
                      <p className="text-sm text-gray-700">
                        {analytics.timeBasedStats.lastMonth} uses last month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No analytics data available</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}