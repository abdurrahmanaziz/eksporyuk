'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import {
  Upload,
  FileText,
  Check,
  AlertTriangle,
  Eye,
  Play,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

interface MembershipOption {
  id: string
  name: string
  price: number
}

interface ImportResultData {
  total: number
  processed: number
  skipped: number
  errors: string[]
  affiliatesCreated: number
  transactionsCreated: number
  conversionsCreated: number
  preview: PreviewItem[]
}

interface PreviewItem {
  email: string
  name: string
  affiliate: string
  amount: number
  date: string
  inv: string
  status: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SejoliImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [membershipOptions, setMembershipOptions] = useState<MembershipOption[]>([])
  const [chosenMembership, setChosenMembership] = useState<string>('none')
  const [isImporting, setIsImporting] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [importResults, setImportResults] = useState<ImportResultData | null>(null)
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([])
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'result'>('upload')

  // Check admin access
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch memberships
  useEffect(() => {
    const loadMemberships = async () => {
      try {
        const res = await fetch('/api/admin/memberships')
        const data = await res.json()
        if (data.success && Array.isArray(data.memberships)) {
          // Filter only valid memberships with proper id
          const validMemberships = data.memberships.filter((m: MembershipOption) => 
            m && typeof m.id === 'string' && m.id.trim().length > 0
          )
          setMembershipOptions(validMemberships)
        }
      } catch (err) {
        console.error('Error loading memberships:', err)
      }
    }
    loadMemberships()
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCsvFile(file)
      setImportResults(null)
      setPreviewItems([])
      setCurrentStep('upload')
    }
  }, [])

  const handlePreviewData = async () => {
    if (!csvFile) return

    setIsPreviewLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('preview', 'true')
      
      if (chosenMembership && chosenMembership !== 'none') {
        formData.append('membershipId', chosenMembership)
      }

      const res = await fetch('/api/admin/import/sejoli-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      
      if (data.success) {
        setPreviewItems(data.preview || [])
        setCurrentStep('preview')
      } else {
        alert(data.error || 'Preview gagal')
      }
    } catch (err) {
      console.error('Preview error:', err)
      alert('Terjadi kesalahan saat preview')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleExecuteImport = async () => {
    if (!csvFile) return

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      
      if (chosenMembership && chosenMembership !== 'none') {
        formData.append('membershipId', chosenMembership)
      }

      const res = await fetch('/api/admin/import/sejoli-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      
      if (data.success) {
        setImportResults(data)
        setCurrentStep('result')
      } else {
        alert(data.error || 'Import gagal')
      }
    } catch (err) {
      console.error('Import error:', err)
      alert('Terjadi kesalahan saat import')
    } finally {
      setIsImporting(false)
    }
  }

  const resetImport = () => {
    setCsvFile(null)
    setImportResults(null)
    setPreviewItems([])
    setCurrentStep('upload')
    setChosenMembership('none')
  }

  if (status === 'loading') {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Import Data Sejoli</h1>
          <p className="text-muted-foreground">
            Import data transaksi dan affiliate dari export CSV Sejoli
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV
            </CardTitle>
            <CardDescription>
              Upload file CSV export dari Sejoli. Format yang didukung: Transaksi dengan kolom buyer, affiliate, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="csvfile">File CSV</Label>
                <Input
                  id="csvfile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                {csvFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    <FileText className="inline h-4 w-4 mr-1" />
                    {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="membershipSelect">Paket Membership (Opsional)</Label>
                {/* Using native HTML select to avoid Radix UI empty value issues */}
                <select
                  id="membershipSelect"
                  value={chosenMembership}
                  onChange={(e) => setChosenMembership(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="none">Tidak ada (hanya transaksi)</option>
                  {membershipOptions.map((membership) => (
                    <option key={membership.id} value={membership.id}>
                      {membership.name} - {formatCurrency(membership.price)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Jika dipilih, customer akan otomatis dapat akses membership
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePreviewData}
                disabled={!csvFile || isPreviewLoading}
                variant="outline"
              >
                {isPreviewLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Preview Data
              </Button>
              
              <Button
                onClick={handleExecuteImport}
                disabled={!csvFile || isImporting}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Import Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {currentStep === 'preview' && previewItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview Data ({previewItems.length} baris)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INV</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewItems.slice(0, 10).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{item.inv}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.affiliate || '-'}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {previewItems.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Menampilkan 10 dari {previewItems.length} baris
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {currentStep === 'result' && importResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Hasil Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Baris</p>
                  <p className="text-2xl font-bold">{importResults.total}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Diproses</p>
                  <p className="text-2xl font-bold text-green-600">{importResults.processed}</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Dilewati</p>
                  <p className="text-2xl font-bold text-yellow-600">{importResults.skipped}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Transaksi</p>
                  <p className="text-2xl font-bold text-purple-600">{importResults.transactionsCreated}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Affiliate Baru</p>
                  <p className="text-2xl font-bold text-orange-600">{importResults.affiliatesCreated}</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Konversi</p>
                  <p className="text-2xl font-bold text-indigo-600">{importResults.conversionsCreated}</p>
                </div>
              </div>

              {importResults.errors && importResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Errors ({importResults.errors.length})</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside max-h-40 overflow-y-auto">
                      {importResults.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx} className="text-sm">{error}</li>
                      ))}
                    </ul>
                    {importResults.errors.length > 10 && (
                      <p className="text-sm mt-2">...dan {importResults.errors.length - 10} error lainnya</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={resetImport} variant="outline">
                Import Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help Info */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Format CSV yang Didukung</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              File CSV harus memiliki kolom-kolom berikut (dari export Sejoli):
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><code className="bg-muted px-1 rounded">buyer_email</code> - Email pembeli</li>
              <li><code className="bg-muted px-1 rounded">buyer_name</code> - Nama pembeli</li>
              <li><code className="bg-muted px-1 rounded">affiliate</code> - ID affiliate (akan di-swap ke name)</li>
              <li><code className="bg-muted px-1 rounded">affiliate_id</code> - Nama affiliate (akan di-swap ke ID)</li>
              <li><code className="bg-muted px-1 rounded">total</code> - Jumlah transaksi</li>
              <li><code className="bg-muted px-1 rounded">created_at</code> - Tanggal transaksi</li>
              <li><code className="bg-muted px-1 rounded">inv</code> - Nomor invoice (untuk deteksi duplikat)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </ResponsivePageWrapper>
  )
}
