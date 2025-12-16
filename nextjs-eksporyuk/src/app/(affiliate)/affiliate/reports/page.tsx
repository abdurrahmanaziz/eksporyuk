'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Link2,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface ReportData {
  period: string
  clicks: number
  conversions: number
  revenue: number
  commission: number
  conversionRate: number
  links: number
}

export default function AffiliateReportsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [reportType, setReportType] = useState('summary')
  const [reports, setReports] = useState<ReportData[]>([])

  useEffect(() => {
    fetchReports()
  }, [dateRange, reportType])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/affiliate/reports?range=${dateRange}&type=${reportType}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/affiliate/reports/download?format=${format}&range=${dateRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `affiliate-report-${dateRange}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const mockData: ReportData[] = [
    {
      period: '7 hari terakhir',
      clicks: 245,
      conversions: 12,
      revenue: 3500000,
      commission: 875000,
      conversionRate: 4.9,
      links: 8
    },
    {
      period: '30 hari terakhir',
      clicks: 1250,
      conversions: 68,
      revenue: 18500000,
      commission: 4625000,
      conversionRate: 5.4,
      links: 15
    },
    {
      period: 'Bulan ini',
      clicks: 890,
      conversions: 45,
      revenue: 12800000,
      commission: 3200000,
      conversionRate: 5.1,
      links: 12
    }
  ]

  return (
    <FeatureLock feature="reports">
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-12">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              Laporan Affiliate
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm">
              Laporan lengkap performa affiliate Anda dengan analisis detail
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Periode Laporan
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                >
                  <option value="7days">7 Hari Terakhir</option>
                  <option value="30days">30 Hari Terakhir</option>
                  <option value="thismonth">Bulan Ini</option>
                  <option value="lastmonth">Bulan Lalu</option>
                  <option value="90days">90 Hari Terakhir</option>
                  <option value="thisyear">Tahun Ini</option>
                </select>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Tipe Laporan
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                >
                  <option value="summary">Ringkasan</option>
                  <option value="detailed">Detail Lengkap</option>
                  <option value="byproduct">Per Produk</option>
                  <option value="bylink">Per Link</option>
                  <option value="commission">Komisi</option>
                </select>
              </div>

              {/* Download Buttons */}
              <div className="sm:col-span-2 flex items-end gap-2 sm:gap-3">
                <button
                  onClick={() => downloadReport('pdf')}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Download</span> PDF
                </button>
                <button
                  onClick={() => downloadReport('excel')}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Download</span> Excel
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-gray-500 text-[10px] sm:text-sm font-medium">Total Klik</span>
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">1,250</p>
              <div className="flex items-center gap-0.5 sm:gap-1 mt-1 text-[10px] sm:text-xs">
                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                <span className="text-green-600 font-medium">+12.5%</span>
                <span className="text-gray-500 hidden sm:inline">vs periode lalu</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-gray-500 text-[10px] sm:text-sm font-medium">Konversi</span>
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">68</p>
              <div className="flex items-center gap-0.5 sm:gap-1 mt-1 text-[10px] sm:text-xs">
                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                <span className="text-green-600 font-medium">+8.3%</span>
                <span className="text-gray-500 hidden sm:inline">vs periode lalu</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-gray-500 text-[10px] sm:text-sm font-medium">Revenue</span>
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">18.5jt</p>
              <div className="flex items-center gap-0.5 sm:gap-1 mt-1 text-[10px] sm:text-xs">
                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                <span className="text-green-600 font-medium">+15.2%</span>
                <span className="text-gray-500 hidden sm:inline">vs periode lalu</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-gray-500 text-[10px] sm:text-sm font-medium">Komisi</span>
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-600">4.6jt</p>
              <div className="flex items-center gap-0.5 sm:gap-1 mt-1 text-[10px] sm:text-xs">
                <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                <span className="text-green-600 font-medium">+15.2%</span>
                <span className="text-gray-500 hidden sm:inline">vs periode lalu</span>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Laporan Detail</h3>
              <p className="text-xs sm:text-sm text-gray-600">Data lengkap performa affiliate Anda</p>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {mockData.map((report, index) => (
                <div key={index} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-900">{report.period}</span>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                      {report.conversionRate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">Klik</p>
                      <p className="text-xs font-bold text-gray-900">{report.clicks.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">Konversi</p>
                      <p className="text-xs font-bold text-green-600">{report.conversions}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-500">Link</p>
                      <p className="text-xs font-bold text-gray-900">{report.links}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-orange-50 rounded-lg p-2">
                      <p className="text-[10px] text-orange-600">Revenue</p>
                      <p className="text-xs font-bold text-orange-700">{(report.revenue / 1000000).toFixed(1)}jt</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-[10px] text-green-600">Komisi</p>
                      <p className="text-xs font-bold text-green-700">{(report.commission / 1000000).toFixed(1)}jt</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Periode
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Klik
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konversi
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conv. Rate
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Komisi
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockData.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-xs sm:text-sm font-medium text-gray-900">{report.period}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm text-gray-900">{report.clicks.toLocaleString()}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-medium text-green-600">{report.conversions}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {report.conversionRate}%
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {(report.revenue / 1000000).toFixed(1)}jt
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-bold text-green-600">
                          {(report.commission / 1000000).toFixed(1)}jt
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Link2 className="h-4 w-4 text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-900">{report.links}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
                  💡 Tips Menggunakan Laporan
                </h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-0.5 sm:space-y-1">
                  <li>• Download laporan PDF untuk presentasi dan arsip</li>
                  <li>• Gunakan laporan Excel untuk analisis data</li>
                  <li className="hidden sm:list-item">• Bandingkan performa antar periode untuk optimasi strategi</li>
                  <li className="hidden sm:list-item">• Fokus pada produk dengan conversion rate tertinggi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureLock>
  )
}
