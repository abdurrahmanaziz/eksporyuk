'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  ArrowLeft,
  Mail,
  Users,
  CheckCircle2,
  MailOpen,
  MousePointerClick,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  Download,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface BroadcastLog {
  id: string
  leadId: string
  status: string
  sentAt: string | null
  deliveredAt: string | null
  openedAt: string | null
  clickedAt: string | null
  failedAt: string | null
  errorMessage: string | null
  lead: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
}

interface BroadcastDetail {
  id: string
  name: string
  subject: string
  body: string
  status: string
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  openedCount: number
  clickedCount: number
  failedCount: number
  creditUsed: number
  isScheduled: boolean
  scheduledAt: string | null
  sentAt: string | null
  completedAt: string | null
  createdAt: string
  template: {
    name: string
    category: string
  } | null
  logs: BroadcastLog[]
}

export default function BroadcastDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [broadcast, setBroadcast] = useState<BroadcastDetail | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchBroadcast()
  }, [params.id])

  const fetchBroadcast = async () => {
    try {
      const res = await fetch(`/api/affiliate/broadcast/${params.id}`)
      const data = await res.json()

      if (res.ok) {
        setBroadcast(data.broadcast)
      } else {
        toast.error(data.error || 'Failed to load broadcast')
        router.push('/affiliate/broadcast')
      }
    } catch (error) {
      console.error('Error fetching broadcast:', error)
      toast.error('Failed to load broadcast')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800'
      case 'DELIVERED':
        return 'bg-blue-100 text-blue-800'
      case 'OPENED':
        return 'bg-purple-100 text-purple-800'
      case 'CLICKED':
        return 'bg-indigo-100 text-indigo-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'OPENED':
        return <MailOpen className="w-4 h-4 text-purple-600" />
      case 'CLICKED':
        return <MousePointerClick className="w-4 h-4 text-indigo-600" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <Mail className="w-4 h-4 text-gray-600" />
    }
  }

  const calculateOpenRate = () => {
    if (!broadcast || broadcast.sentCount === 0) return 0
    return ((broadcast.openedCount / broadcast.sentCount) * 100).toFixed(1)
  }

  const calculateClickRate = () => {
    if (!broadcast || broadcast.sentCount === 0) return 0
    return ((broadcast.clickedCount / broadcast.sentCount) * 100).toFixed(1)
  }

  const calculateDeliveryRate = () => {
    if (!broadcast || broadcast.totalRecipients === 0) return 0
    return ((broadcast.deliveredCount / broadcast.totalRecipients) * 100).toFixed(1)
  }

  const exportLogs = () => {
    if (!broadcast) return

    const csv = [
      ['Name', 'Email', 'Status', 'Sent At', 'Opened At', 'Clicked At', 'Error'].join(','),
      ...filteredLogs.map(log =>
        [
          log.lead.name,
          log.lead.email || '',
          log.status,
          log.sentAt ? new Date(log.sentAt).toLocaleString() : '',
          log.openedAt ? new Date(log.openedAt).toLocaleString() : '',
          log.clickedAt ? new Date(log.clickedAt).toLocaleString() : '',
          log.errorMessage || '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `broadcast-${broadcast.id}-logs.csv`
    a.click()
    toast.success('Logs exported successfully!')
  }

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (!broadcast) {
    return (
      <ResponsivePageWrapper>
        <div className="text-center py-12">
          <p className="text-gray-500">Broadcast not found</p>
          <Button onClick={() => router.push('/affiliate/broadcast')} className="mt-4">
            Back to Broadcasts
          </Button>
        </div>
      </ResponsivePageWrapper>
    )
  }

  const filteredLogs = filterStatus === 'all' 
    ? broadcast.logs 
    : broadcast.logs.filter(log => log.status.toLowerCase() === filterStatus.toLowerCase())

  return (
    <ResponsivePageWrapper>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/affiliate/broadcast')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Broadcasts
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{broadcast.name}</h1>
            <p className="text-gray-600 mb-4">{broadcast.subject}</p>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(broadcast.status)}>
                {broadcast.status}
              </Badge>
              {broadcast.template && (
                <span className="text-sm text-gray-500">
                  Template: {broadcast.template.name}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {new Date(broadcast.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Recipients</p>
                <p className="text-2xl font-bold text-gray-900">{broadcast.totalRecipients}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{broadcast.deliveredCount}</p>
                <p className="text-xs text-gray-400 mt-1">{calculateDeliveryRate()}%</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Opened</p>
                <p className="text-2xl font-bold text-gray-900">{broadcast.openedCount}</p>
                <p className="text-xs text-gray-400 mt-1">{calculateOpenRate()}%</p>
              </div>
              <MailOpen className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Clicked</p>
                <p className="text-2xl font-bold text-gray-900">{broadcast.clickedCount}</p>
                <p className="text-xs text-gray-400 mt-1">{calculateClickRate()}%</p>
              </div>
              <MousePointerClick className="w-10 h-10 text-indigo-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-600">{broadcast.failedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Credits Used</p>
                <p className="text-2xl font-bold text-orange-600">{broadcast.creditUsed}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Sent At</p>
                <p className="text-sm font-medium text-gray-900">
                  {broadcast.sentAt ? new Date(broadcast.sentAt).toLocaleString() : 'Not sent'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Email Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-500 mb-1">Subject:</p>
              <p className="text-lg font-semibold text-gray-900">{broadcast.subject}</p>
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: broadcast.body }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Delivery Logs</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                disabled={broadcast.logs.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          <CardDescription>
            Detailed delivery status for each recipient
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {['all', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'pending'].map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="capitalize whitespace-nowrap"
              >
                {status}
                {status === 'all' && ` (${broadcast.logs.length})`}
              </Button>
            ))}
          </div>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No logs found for this filter
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Recipient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sent At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Opened At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Clicked At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{log.lead.name}</p>
                          <p className="text-sm text-gray-500">{log.lead.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getLogStatusIcon(log.status)}
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.openedAt ? new Date(log.openedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.clickedAt ? new Date(log.clickedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {log.errorMessage && (
                          <span className="text-xs text-red-600">{log.errorMessage}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </ResponsivePageWrapper>
  )
}
