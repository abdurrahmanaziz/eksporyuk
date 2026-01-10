'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Send, 
  Eye, 
  MousePointerClick, 
  AlertCircle,
  Users,
  Mail,
  MessageSquare,
  CheckCircle2
} from 'lucide-react'

interface BroadcastAnalyticsProps {
  campaign: any
}

export default function BroadcastAnalytics({ campaign }: BroadcastAnalyticsProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [campaign.id])

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/admin/broadcast/${campaign.id}/logs`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalSent = campaign.sentCount || 0
  const totalFailed = campaign.failedCount || 0
  const totalDelivered = campaign.deliveredCount || 0
  const totalOpened = campaign.openedCount || 0
  const totalClicked = campaign.clickedCount || 0
  const totalRecipients = campaign.totalRecipients || 0

  const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0'
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0'
  const failureRate = totalSent > 0 ? ((totalFailed / totalSent) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Sent</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            dari {totalRecipients.toLocaleString()} target
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalDelivered.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1 font-medium">
            {deliveryRate}% delivery rate
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Opened</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOpened.toLocaleString()}</p>
          <p className="text-xs text-purple-600 mt-1 font-medium">
            {openRate}% open rate
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Clicked</span>
            <MousePointerClick className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalClicked.toLocaleString()}</p>
          <p className="text-xs text-orange-600 mt-1 font-medium">
            {clickRate}% click rate
          </p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          
          <div className="space-y-4">
            {/* Delivery Rate Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Delivery Rate</span>
                <span className="text-sm font-semibold text-green-600">{deliveryRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${deliveryRate}%` }}
                ></div>
              </div>
            </div>

            {/* Open Rate Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Open Rate</span>
                <span className="text-sm font-semibold text-purple-600">{openRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${openRate}%` }}
                ></div>
              </div>
            </div>

            {/* Click Rate Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Click Rate</span>
                <span className="text-sm font-semibold text-orange-600">{clickRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${clickRate}%` }}
                ></div>
              </div>
            </div>

            {/* Failure Rate Bar */}
            {totalFailed > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Failure Rate</span>
                  <span className="text-sm font-semibold text-red-600">{failureRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${failureRate}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Type</span>
              <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                {campaign.type === 'EMAIL' && <Mail className="w-4 h-4 text-blue-600" />}
                {campaign.type === 'WHATSAPP' && <MessageSquare className="w-4 h-4 text-green-600" />}
                {campaign.type}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                campaign.status === 'SENDING' ? 'bg-blue-100 text-blue-700' :
                campaign.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-700' :
                campaign.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {campaign.status}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Target</span>
              <span className="text-sm font-medium text-gray-900">{campaign.targetType}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(campaign.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>

            {campaign.scheduledAt && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(campaign.scheduledAt).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {campaign.completedAt && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(campaign.completedAt).toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Channel</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.slice(0, 10).map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{log.userId}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                        log.channel === 'EMAIL' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {log.channel === 'EMAIL' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        {log.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        log.status === 'SENT' ? 'bg-green-100 text-green-700' :
                        log.status === 'DELIVERED' ? 'bg-blue-100 text-blue-700' :
                        log.status === 'OPENED' ? 'bg-purple-100 text-purple-700' :
                        log.status === 'CLICKED' ? 'bg-orange-100 text-orange-700' :
                        log.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {log.sentAt ? new Date(log.sentAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length > 10 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All {logs.length} Recipients →
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading analytics...</p>
        </div>
      )}

      {!loading && logs.length === 0 && campaign.status === 'DRAFT' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-yellow-800">
            Campaign belum dikirim
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Kirim campaign untuk melihat analytics dan tracking
          </p>
        </div>
      )}
    </div>
  )
}
