'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  Shield,
  Activity,
  Server,
  Database,
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  History,
  Settings,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  Eye,
  Loader2,
  Zap,
  Info,
  AlertCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface ScanResult {
  id: string
  category: string
  checkName: string
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP'
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  message: string
  details?: string
  location?: string
  impact?: string
  suggestion?: string
  isFixed: boolean
  isIgnored: boolean
  createdAt: string
}

interface SystemScan {
  id: string
  scanType: string
  status: string
  startedAt: string
  completedAt?: string
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warningChecks: number
  healthScore: number
  results?: ScanResult[]
  _count?: { results: number }
}

interface HealthStatus {
  hasData: boolean
  message?: string
  scanId?: string
  healthScore?: number
  totalChecks?: number
  passedChecks?: number
  failedChecks?: number
  warningChecks?: number
  lastScanAt?: string
  activeIssues?: ScanResult[]
}

type TabType = 'dashboard' | 'scan' | 'history' | 'fixes'

export default function ScannerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [scanHistory, setScanHistory] = useState<SystemScan[]>([])
  const [selectedScan, setSelectedScan] = useState<SystemScan | null>(null)
  const [scanType, setScanType] = useState<string>('FULL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/')
      toast.error('Akses ditolak')
    }
  }, [status, session, router])

  // Fetch health status
  const fetchHealthStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/scanner?action=status')
      if (res.ok) {
        const data = await res.json()
        setHealthStatus(data)
      }
    } catch (error) {
      console.error('Error fetching health status:', error)
    }
  }, [])

  // Fetch scan history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/scanner?action=history&limit=50')
      if (res.ok) {
        const data = await res.json()
        setScanHistory(data.scans || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      Promise.all([fetchHealthStatus(), fetchHistory()])
        .finally(() => setLoading(false))
    }
  }, [status, session, fetchHealthStatus, fetchHistory])

  // Run scan
  const runScan = async (type: string) => {
    setScanning(true)
    try {
      const res = await fetch('/api/admin/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan', scanType: type })
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success(`Scan selesai! Health Score: ${data.healthScore}%`)
        await fetchHealthStatus()
        await fetchHistory()
        setActiveTab('dashboard')
      } else {
        const error = await res.json()
        toast.error(error.message || 'Scan gagal')
      }
    } catch (error) {
      toast.error('Error running scan')
    } finally {
      setScanning(false)
    }
  }

  // View scan details
  const viewScanDetails = async (scanId: string) => {
    try {
      const res = await fetch(`/api/admin/scanner?action=details&scanId=${scanId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedScan(data)
      }
    } catch (error) {
      toast.error('Error loading scan details')
    }
  }

  // Mark as fixed
  const markAsFixed = async (resultId: string) => {
    try {
      const res = await fetch('/api/admin/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'fix', 
          resultId, 
          fixMethod: 'Manual fix by admin' 
        })
      })
      
      if (res.ok) {
        toast.success('Issue ditandai sudah diperbaiki')
        await fetchHealthStatus()
        if (selectedScan) {
          await viewScanDetails(selectedScan.id)
        }
      }
    } catch (error) {
      toast.error('Error marking as fixed')
    }
  }

  // Ignore issue
  const ignoreIssue = async (resultId: string) => {
    try {
      const res = await fetch('/api/admin/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ignore', resultId })
      })
      
      if (res.ok) {
        toast.success('Issue diabaikan')
        await fetchHealthStatus()
        if (selectedScan) {
          await viewScanDetails(selectedScan.id)
        }
      }
    } catch (error) {
      toast.error('Error ignoring issue')
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-100'
      case 'FAIL': return 'text-red-600 bg-red-100'
      case 'WARNING': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get level color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-700 bg-red-100 border-red-300'
      case 'HIGH': return 'text-orange-700 bg-orange-100 border-orange-300'
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-100 border-yellow-300'
      case 'LOW': return 'text-blue-700 bg-blue-100 border-blue-300'
      default: return 'text-gray-700 bg-gray-100 border-gray-300'
    }
  }

  // Get health score color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'API': return <Server className="w-4 h-4" />
      case 'DATABASE': return <Database className="w-4 h-4" />
      case 'FRONTEND': return <Globe className="w-4 h-4" />
      case 'SECURITY': return <Lock className="w-4 h-4" />
      case 'SYSTEM': return <Settings className="w-4 h-4" />
      case 'PERFORMANCE': return <Zap className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  // Filter results
  const filterResults = (results: ScanResult[]) => {
    return results.filter(r => {
      if (filterCategory !== 'ALL' && r.category !== filterCategory) return false
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false
      return true
    })
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              Health Monitor & Scanner
            </h1>
            <p className="text-gray-600 mt-1">
              Pantau kesehatan sistem dan deteksi masalah secara otomatis
            </p>
          </div>
          <button
            onClick={() => runScan('QUICK')}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Quick Scan
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 -mb-px">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'scan', label: 'Run Scan', icon: Play },
              { id: 'history', label: 'History', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType)
                  setSelectedScan(null)
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Health Score Card */}
              {healthStatus?.hasData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Health Score */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Health Score</span>
                        <Activity className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className={cn("text-4xl font-bold", getHealthColor(healthStatus.healthScore || 0))}>
                        {healthStatus.healthScore}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Last scan: {healthStatus.lastScanAt ? new Date(healthStatus.lastScanAt).toLocaleString('id-ID') : '-'}
                      </p>
                    </div>

                    {/* Passed */}
                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">Passed</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-3xl font-bold text-green-700">
                        {healthStatus.passedChecks}
                      </div>
                      <p className="text-xs text-green-600 mt-1">dari {healthStatus.totalChecks} checks</p>
                    </div>

                    {/* Warnings */}
                    <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-700">Warnings</span>
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="text-3xl font-bold text-yellow-700">
                        {healthStatus.warningChecks}
                      </div>
                      <p className="text-xs text-yellow-600 mt-1">perlu perhatian</p>
                    </div>

                    {/* Failed */}
                    <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-700">Failed</span>
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="text-3xl font-bold text-red-700">
                        {healthStatus.failedChecks}
                      </div>
                      <p className="text-xs text-red-600 mt-1">perlu perbaikan</p>
                    </div>
                  </div>

                  {/* Active Issues */}
                  {healthStatus.activeIssues && healthStatus.activeIssues.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Active Issues ({healthStatus.activeIssues.length})
                      </h3>
                      <div className="space-y-3">
                        {healthStatus.activeIssues.slice(0, 10).map((issue) => (
                          <div
                            key={issue.id}
                            className={cn(
                              "p-4 rounded-lg border",
                              issue.status === 'FAIL' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <span className={cn("px-2 py-1 rounded text-xs font-medium", getLevelColor(issue.level))}>
                                  {issue.level}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">{issue.checkName}</p>
                                  <p className="text-sm text-gray-600 mt-1">{issue.message}</p>
                                  {issue.suggestion && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      {issue.suggestion}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {!issue.isFixed && !issue.isIgnored && (
                                  <>
                                    <button
                                      onClick={() => markAsFixed(issue.id)}
                                      className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                                      title="Tandai sudah diperbaiki"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => ignoreIssue(issue.id)}
                                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                      title="Abaikan"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Belum ada data scan
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Jalankan scan pertama untuk melihat status kesehatan sistem
                  </p>
                  <button
                    onClick={() => setActiveTab('scan')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Run Scan Sekarang
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scan Tab */}
          {activeTab === 'scan' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pilih Jenis Scan
                </h3>
                <p className="text-gray-500">
                  Pilih area yang ingin di-scan untuk mendeteksi masalah
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { 
                    type: 'FULL', 
                    name: 'Full Scan', 
                    desc: 'Scan semua area sistem', 
                    icon: Shield,
                    color: 'bg-purple-500',
                    duration: '~2 menit'
                  },
                  { 
                    type: 'QUICK', 
                    name: 'Quick Scan', 
                    desc: 'Scan cepat API & Database', 
                    icon: Zap,
                    color: 'bg-yellow-500',
                    duration: '~30 detik'
                  },
                  { 
                    type: 'API', 
                    name: 'API Scan', 
                    desc: 'Cek semua endpoint API', 
                    icon: Server,
                    color: 'bg-blue-500',
                    duration: '~1 menit'
                  },
                  { 
                    type: 'DATABASE', 
                    name: 'Database Scan', 
                    desc: 'Cek koneksi & integritas data', 
                    icon: Database,
                    color: 'bg-green-500',
                    duration: '~30 detik'
                  },
                  { 
                    type: 'FRONTEND', 
                    name: 'Frontend Scan', 
                    desc: 'Cek halaman & routing', 
                    icon: Globe,
                    color: 'bg-indigo-500',
                    duration: '~1 menit'
                  },
                  { 
                    type: 'SECURITY', 
                    name: 'Security Scan', 
                    desc: 'Cek keamanan & konfigurasi', 
                    icon: Lock,
                    color: 'bg-red-500',
                    duration: '~30 detik'
                  },
                ].map((scan) => (
                  <button
                    key={scan.type}
                    onClick={() => runScan(scan.type)}
                    disabled={scanning}
                    className={cn(
                      "p-6 rounded-xl border-2 text-left transition-all",
                      "hover:border-primary hover:shadow-md",
                      scanning ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                      scanType === scan.type ? "border-primary bg-primary/5" : "border-gray-200"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4", scan.color)}>
                      <scan.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{scan.name}</h4>
                    <p className="text-sm text-gray-500 mb-3">{scan.desc}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {scan.duration}
                    </div>
                  </button>
                ))}
              </div>

              {scanning && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-600">Sedang melakukan scan...</p>
                  <p className="text-sm text-gray-400">Mohon tunggu, ini mungkin memakan waktu beberapa saat</p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {selectedScan ? (
                // Scan Details View
                <div>
                  <button
                    onClick={() => setSelectedScan(null)}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                    Kembali ke History
                  </button>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedScan.scanType} Scan
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedScan.startedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className={cn("text-3xl font-bold", getHealthColor(selectedScan.healthScore))}>
                        {selectedScan.healthScore}%
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex gap-4 mb-4">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="ALL">Semua Kategori</option>
                      <option value="API">API</option>
                      <option value="DATABASE">Database</option>
                      <option value="FRONTEND">Frontend</option>
                      <option value="SECURITY">Security</option>
                      <option value="SYSTEM">System</option>
                      <option value="PERFORMANCE">Performance</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                      <option value="WARNING">Warning</option>
                    </select>
                  </div>

                  {/* Results Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedScan.results && filterResults(selectedScan.results).map((result) => (
                          <tr key={result.id} className={cn(
                            result.isFixed && "bg-green-50",
                            result.isIgnored && "bg-gray-50 opacity-50"
                          )}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(result.category)}
                                <span className="text-sm font-medium text-gray-900">{result.checkName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("px-2 py-1 rounded text-xs font-medium", getStatusColor(result.status))}>
                                {result.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("px-2 py-1 rounded text-xs font-medium border", getLevelColor(result.level))}>
                                {result.level}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-600">{result.message}</p>
                              {result.suggestion && (
                                <p className="text-xs text-gray-400 mt-1">{result.suggestion}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {result.status !== 'PASS' && !result.isFixed && !result.isIgnored && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => markAsFixed(result.id)}
                                    className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                                    title="Tandai sudah diperbaiki"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => ignoreIssue(result.id)}
                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                    title="Abaikan"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              {result.isFixed && (
                                <span className="text-xs text-green-600">Fixed</span>
                              )}
                              {result.isIgnored && (
                                <span className="text-xs text-gray-500">Ignored</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // History List
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Scan History</h3>
                    <button
                      onClick={fetchHistory}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>

                  {scanHistory.length > 0 ? (
                    <div className="space-y-3">
                      {scanHistory.map((scan) => (
                        <div
                          key={scan.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => viewScanDetails(scan.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              scan.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                              scan.status === 'RUNNING' ? 'bg-blue-100 text-blue-600' : 
                              'bg-red-100 text-red-600'
                            )}>
                              {scan.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> :
                               scan.status === 'RUNNING' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                               <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{scan.scanType} Scan</p>
                              <p className="text-sm text-gray-500">
                                {new Date(scan.startedAt).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className={cn("text-2xl font-bold", getHealthColor(scan.healthScore))}>
                                {scan.healthScore}%
                              </p>
                              <p className="text-xs text-gray-500">
                                {scan.passedChecks}/{scan.totalChecks} passed
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {scan.failedChecks > 0 && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                  {scan.failedChecks} fail
                                </span>
                              )}
                              {scan.warningChecks > 0 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                  {scan.warningChecks} warn
                                </span>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada riwayat scan</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </ResponsivePageWrapper>
  )
}
