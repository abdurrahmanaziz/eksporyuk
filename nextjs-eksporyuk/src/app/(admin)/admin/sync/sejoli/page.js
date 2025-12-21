'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, CheckCircle, AlertCircle, Info, Settings, DollarSign } from 'lucide-react'

export default function SejoliSyncPage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [inputData, setInputData] = useState('')
  const [inputType, setInputType] = useState('csv')
  
  // Form selections
  const [selectedMembership, setSelectedMembership] = useState('')
  const [selectedAffiliate, setSelectedAffiliate] = useState('')
  const [affiliateCommission, setAffiliateCommission] = useState(0)
  
  // Data lists
  const [memberships, setMemberships] = useState([])
  const [affiliates, setAffiliates] = useState([])

  // Load memberships and affiliates on mount
  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      setIsLoadingData(true)
      
      // Load memberships
      const membRes = await fetch('/api/admin/membership-plans/list')
      if (membRes.ok) {
        const membData = await membRes.json()
        setMemberships(Array.isArray(membData) ? membData : [])
      }
      
      // Load affiliates - try simple endpoint, fallback to full endpoint
      let affRes = await fetch('/api/admin/affiliates/simple')
      if (affRes.status === 404) {
        // Try without the /list suffix, get the full list
        affRes = await fetch('/api/admin/affiliates?limit=1000')
      }
      
      if (affRes.ok) {
        let affData = await affRes.json()
        // If it's paginated, extract the data
        if (affData.data) {
          affData = affData.data
        }
        setAffiliates(Array.isArray(affData) ? affData : [])
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load memberships and affiliates')
    } finally {
      setIsLoadingData(false)
    }
  }
  
  // Update membership selection (don't auto-set commission)
  const handleMembershipChange = (membershipId) => {
    setSelectedMembership(membershipId)
    // Don't auto-set commission - let admin enter manually
  }

  const handleSync = async () => {
    // Validate selections
    if (!selectedMembership) {
      setError('Please select a membership')
      return
    }
    if (!selectedAffiliate) {
      setError('Please select an affiliate')
      return
    }
    if (!inputData.trim()) {
      setError('Please provide data to sync')
      return
    }
    
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      let processedData = []
      
      if (inputType === 'csv') {
        // Parse CSV data
        const lines = inputData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        
        for (let i = 1; i < lines.length; i++) {
          const values = []
          let current = ''
          let inQuotes = false
          
          // Proper CSV parsing with quote handling
          for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim().replace(/"/g, ''))
              current = ''
            } else {
              current += char
            }
          }
          values.push(current.trim().replace(/"/g, ''))
          
          if (values.length >= headers.length) {
            const order = {}
            headers.forEach((header, index) => {
              order[header] = values[index] || ''
            })
            processedData.push(order)
          }
        }
      } else {
        // Parse JSON data
        processedData = JSON.parse(inputData)
        if (!Array.isArray(processedData)) {
          processedData = [processedData]
        }
      }
      
      if (processedData.length === 0) {
        throw new Error('No valid data found')
      }

      const requestBody = {
        csvData: processedData,
        membershipId: selectedMembership,
        affiliateId: selectedAffiliate,
        affiliateCommission: affiliateCommission
      }

      const response = await fetch('/api/admin/sync/sejoli', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setInputData(text)
      
      // Auto-detect format
      if (file.name.endsWith('.csv')) {
        setInputType('csv')
      } else if (file.name.endsWith('.json')) {
        setInputType('json')
      }
    } catch (err) {
      setError('Failed to read file: ' + err.message)
    }
  }

  const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (!mounted || isLoadingData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sejoli Data Sync
          </h1>
          <p className="text-gray-600">
            Loading...
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sejoli Data Sync
        </h1>
        <p className="text-gray-600">
          Sync transaction data from Sejoli platform. Select membership, affiliate, and provide data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Data Input Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sync Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Membership Selection */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Membership *
                </Label>
                <select
                  value={selectedMembership}
                  onChange={(e) => handleMembershipChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Choose Membership --</option>
                  {memberships.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {formatIDR(Number(m.price))}
                    </option>
                  ))}
                </select>
              </div>

              {/* Affiliate Selection */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Affiliate *
                </Label>
                <select
                  value={selectedAffiliate}
                  onChange={(e) => setSelectedAffiliate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Choose Affiliate --</option>
                  {affiliates.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.email} (ID: {a.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Commission Input Manual */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliate Commission (Manual) *
                </Label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 px-3 py-2 border border-blue-300 rounded-md bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="text-blue-600 font-semibold">Rp</span>
                      <input
                        type="number"
                        value={affiliateCommission}
                        onChange={(e) => setAffiliateCommission(Number(e.target.value) || 0)}
                        placeholder="Masukkan jumlah komisi"
                        className="flex-1 bg-transparent outline-none font-semibold text-blue-900"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Masukkan jumlah komisi yang akan diterima affiliate per transaksi
                </p>
              </div>

              {affiliateCommission > 0 && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Komisi per transaksi:</strong> {formatIDR(affiliateCommission)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Komisi akan ditambahkan ke wallet affiliate yang dipilih
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Data Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Type Selection */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-3">
                  Data Format
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="inputType"
                      value="csv"
                      checked={inputType === 'csv'}
                      onChange={(e) => setInputType(e.target.value)}
                      className="mr-2"
                    />
                    CSV Format (from Sejoli export)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="inputType"
                      value="json"
                      checked={inputType === 'json'}
                      onChange={(e) => setInputType(e.target.value)}
                      className="mr-2"
                    />
                    JSON Format (legacy)
                  </label>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File
                </Label>
                <input
                  type="file"
                  accept={inputType === 'csv' ? '.csv,.txt' : '.json,.txt'}
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {inputType === 'csv' 
                    ? 'Upload CSV file exported from Sejoli admin panel'
                    : 'Upload JSON file with transaction data'
                  }
                </p>
              </div>

              {/* Manual Input */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Paste {inputType.toUpperCase()} Data
                </Label>
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder={inputType === 'csv' 
                    ? `CSV Format:
INV,product,created_at,name,email,phone,quantity,price,status,affiliate,affiliate_id
19333,"Paket Ekspor Yuk Lifetime","2025-12-19 23:53:49","Customer Name","email@example.com","085123456789",1,999000,Selesai,"Rahmat Al Fianto",1637`
                    : `JSON Format:
[
  {
    "id": "12345",
    "email": "user@example.com",
    "customerName": "John Doe",
    "productName": "Membership Premium",
    "price": "399000",
    "status": "completed",
    "date": "2025-12-20",
    "affiliateCode": "RAHMAT123",
    "commissionAmount": "325000"
  }
]`}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {/* Data Preview */}
              {inputData.trim() && (
                <div className="border border-yellow-300 bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Preview Data ({inputType.toUpperCase()})
                  </h4>
                  <div className="bg-white p-3 rounded border border-yellow-200 text-xs font-mono overflow-x-auto max-h-32">
                    {inputType === 'csv' ? (
                      <div className="space-y-1">
                        {inputData.trim().split('\n').slice(1, 4).map((line, idx) => (
                          <div key={idx} className="text-gray-700 whitespace-nowrap">
                            {line}
                          </div>
                        ))}
                        {inputData.trim().split('\n').length > 4 && (
                          <div className="text-gray-500 italic">... dan {inputData.trim().split('\n').length - 4} baris lainnya</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-700">{JSON.stringify(JSON.parse(inputData).slice(0, 2), null, 2)}...</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-yellow-800 space-y-1">
                    <p>✓ Total baris data: {inputData.trim().split('\n').length - 1}</p>
                    <p>✓ Membership terpilih: <strong>{memberships.find(m => m.id === selectedMembership)?.name || 'Belum dipilih'}</strong></p>
                    <p>✓ Affiliate terpilih: <strong>{affiliates.find(a => a.id === selectedAffiliate)?.name || affiliates.find(a => a.id === selectedAffiliate)?.email || 'Belum dipilih'}</strong></p>
                    <p>⚠️ Pastikan affiliate dan membership sudah benar sebelum sync!</p>
                  </div>
                </div>
              )}

              {/* Sync Button */}
              <Button
                onClick={handleSync}
                disabled={isLoading || !inputData.trim() || !selectedMembership || !selectedAffiliate}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Data...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Sync
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Import Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Selected Membership</p>
                <p className="font-semibold text-gray-900">
                  {memberships.find(m => m.id === selectedMembership)?.name || 'None'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Selected Affiliate</p>
                <p className="font-semibold text-gray-900">
                  {affiliates.find(a => a.id === selectedAffiliate)?.name || affiliates.find(a => a.id === selectedAffiliate)?.email || 'None'}
                </p>
              </div>
              
              {/* Manual Commission Input - Editable */}
              <div className="border-t border-b py-4 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 rounded-lg border border-blue-200">
                <div className="mb-3">
                  <p className="text-xs text-blue-700 font-semibold mb-2 uppercase tracking-wider">Komisi Affiliate (Manual Input)</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <input
                      type="number"
                      value={affiliateCommission}
                      onChange={(e) => setAffiliateCommission(Number(e.target.value) || 0)}
                      placeholder="Masukkan jumlah komisi"
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-blue-900 font-semibold text-lg"
                    />
                    <span className="text-blue-600 font-medium">Rp</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-blue-700">Per transaksi</p>
                  {inputData.trim().split('\n').length > 1 && (
                    <p className="text-xs text-blue-700 font-semibold bg-blue-100 p-2 rounded">
                      Total untuk {inputData.trim().split('\n').length - 1} transaksi: <strong>{formatIDR(affiliateCommission * (inputData.trim().split('\n').length - 1))}</strong>
                    </p>
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-gray-600 mb-1">Data Lines</p>
                <p className="text-lg font-bold">
                  {inputData.trim().split('\n').length - 1}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ready to sync
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong>
                  <ul className="mt-2 list-disc list-inside text-xs space-y-1">
                    <li>Invoice numbers auto-increment</li>
                    <li>Duplicates are detected</li>
                    <li>Commission only to selected affiliate</li>
                    <li>Membership auto-assigned</li>
                    <li>Data integrated to DB</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Results */}
              {error && (
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-800">
                    <p className="font-semibold mb-2">💡 Cara mengatasi:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Pastikan membership sudah dipilih dari dropdown</li>
                      <li>Pastikan affiliate sudah dipilih dari dropdown</li>
                      <li>Pastikan ada data CSV/JSON yang diinput</li>
                      <li>Pastikan format data sudah benar (email harus valid)</li>
                    </ul>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sync Completed Successfully!</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Results Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Processed:</span>
                        <span className="ml-2 font-semibold">{result.results?.processed || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2 font-semibold text-green-600">{result.results?.created || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Updated:</span>
                        <span className="ml-2 font-semibold text-blue-600">{result.results?.updated || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Skipped:</span>
                        <span className="ml-2 font-semibold text-gray-600">{result.results?.skipped || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Commissions Processed:</span>
                        <span className="ml-2 font-semibold text-purple-600">{result.results?.commissionsProcessed || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Memberships Assigned:</span>
                        <span className="ml-2 font-semibold text-indigo-600">{result.results?.membershipsAssigned || 0}</span>
                      </div>
                    </div>
                    
                    {/* Commission Amount Info */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-900">Commission Distribution</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        <div>Per Transaction: <strong>Rp{affiliateCommission.toLocaleString('id-ID')}</strong></div>
                        <div>Total Distributed: <strong>Rp{(affiliateCommission * (result.results?.commissionsProcessed || 0)).toLocaleString('id-ID')}</strong></div>
                        <div className="mt-2 text-xs text-blue-700">
                          ✓ Commission recorded in affiliate wallet
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.results?.errors && result.results.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <h5 className="font-medium text-red-800 mb-2">Errors ({result.results.errors.length})</h5>
                      <div className="text-sm text-red-700 max-h-24 overflow-y-auto">
                        {result.results.errors.slice(0, 3).map((error, index) => (
                          <div key={index} className="mb-1 text-xs">• {error}</div>
                        ))}
                        {result.results.errors.length > 3 && (
                          <div className="text-red-600 font-medium text-xs">
                            ... and {result.results.errors.length - 3} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Anti-Conflict</h4>
              <p className="text-gray-600">
                System checks existing invoice numbers and continues from the highest number to prevent conflicts.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Sync</h4>
              <p className="text-gray-600">
                Detects duplicate transactions and only creates new records or updates existing ones as needed.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Auto Processing</h4>
              <p className="text-gray-600">
                Automatically processes commissions, assigns memberships, and updates affiliate wallets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Guide */}
      <Card className="mt-8 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            ⚠️ Jika Ada Kesalahan
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-900 space-y-3">
          <div>
            <p className="font-semibold mb-2">🆘 Masalah: Data ternyata salah (affiliate/membership/komisi)</p>
            <ol className="list-decimal list-inside space-y-1 text-xs ml-2">
              <li>Catat invoice number dari hasil sync (contoh: INV12001)</li>
              <li>Buka terminal dan jalankan: <code className="bg-yellow-100 px-2 py-1 rounded">node fix-sejoli-sync.js "INV12"</code></li>
              <li>Ketik "YES" untuk konfirmasi penghapusan</li>
              <li>Tunggu hingga selesai - semua data akan dihapus dan komisi di-refund</li>
              <li>Verifikasi di /admin/sales bahwa data sudah hilang</li>
              <li>Sync lagi dengan data yang benar</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold">📖 Panduan Lengkap: </p>
            <p className="text-xs">Lihat file <code className="bg-yellow-100 px-2 py-1 rounded">PANDUAN_FIX_SEJOLI_SYNC.md</code> untuk detail lengkap tentang mencegah dan memperbaiki kesalahan sync</p>
          </div>
          <div className="bg-yellow-100 p-2 rounded border border-yellow-300">
            <p className="font-semibold text-yellow-900">✅ PENCEGAHAN TERBAIK:</p>
            <p className="text-xs mt-1">Sebelum klik "START SYNC", selalu:</p>
            <ul className="list-disc list-inside text-xs space-y-1 mt-1">
              <li>✓ Lihat preview data di form</li>
              <li>✓ Verifikasi affiliate SUDAH BENAR</li>
              <li>✓ Verifikasi membership SUDAH BENAR</li>
              <li>✓ Verifikasi komisi SUDAH BENAR</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}