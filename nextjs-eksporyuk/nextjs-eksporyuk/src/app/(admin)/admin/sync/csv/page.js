'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, CheckCircle, AlertCircle, Info, Settings, DollarSign } from 'lucide-react'

export default function SejoliCsvSyncPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [csvData, setCsvData] = useState('')
  
  // Commission rates (flat amounts in IDR)
  const [commissionRates, setCommissionRates] = useState({
    'Paket Ekspor Yuk Lifetime': 325000,
    'Paket Ekspor Yuk 12 Bulan': 275000,
    'Paket Ekspor Yuk 6 Bulan': 225000
  })

  const handleSync = async () => {
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      let parsedCsvData = []
      
      if (csvData.trim()) {
        // Parse CSV data
        const lines = csvData.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const order = {}
          
          headers.forEach((header, index) => {
            order[header] = values[index] || ''
          })
          
          parsedCsvData.push(order)
        }
        
        console.log('Parsed CSV data:', parsedCsvData.slice(0, 2)) // Show first 2 rows
      } else {
        throw new Error('Please provide CSV data.')
      }

      const response = await fetch('/api/admin/sync/sejoli-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          csvData: parsedCsvData,
          commissionRates 
        })
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
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      setCsvData(text)
    } catch (err) {
      setError('Failed to read file: ' + err.message)
    }
  }

  const updateCommissionRate = (product, value) => {
    setCommissionRates(prev => ({
      ...prev,
      [product]: parseInt(value) || 0
    }))
  }

  const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sejoli CSV Sync
        </h1>
        <p className="text-gray-600">
          Import orders from Sejoli CSV export with auto membership assignment & flat commission rates
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Commission Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <strong>Flat Commission Rates</strong><br/>
                Set fixed amount (IDR) per product type
              </AlertDescription>
            </Alert>

            {Object.entries(commissionRates).map(([product, rate]) => (
              <div key={product}>
                <Label className="text-sm font-medium text-gray-700">
                  {product}
                </Label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    Rp
                  </span>
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => updateCommissionRate(product, e.target.value)}
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatIDR(rate)} per sale
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              CSV Data Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </Label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Or Paste CSV Data
              </Label>
              <Textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder={`CSV Format (dari Sejoli export):
INV,product,created_at,name,email,phone,quantity,price,status,affiliate,affiliate_id,address,payment,courier,variant,notes
19333,"Paket Ekspor Yuk Lifetime","2025-12-19 23:53:49","DERRY RIVAL","email@example.com",085832599336,1,999000,Selesai,1637,"Rahmat Al Fianto",-,"Xendit - BCA",-,-,`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleSync}
              disabled={isLoading || !csvData.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing CSV...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Sync CSV Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sync Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Features Info */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Auto-Processing Features:</strong>
                <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                  <li>Auto-create users from email</li>
                  <li>Assign membership by product type</li>
                  <li>Calculate flat commission rates</li>
                  <li>Generate invoice numbers</li>
                  <li>Update affiliate wallets</li>
                  <li>Populate admin/sales records</li>
                </ul>
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>CSV Sync Completed Successfully!</strong>
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
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
                      <span className="text-gray-600">Skipped:</span>
                      <span className="ml-2 font-semibold text-gray-600">{result.results?.skipped || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Commissions:</span>
                      <span className="ml-2 font-semibold text-purple-600">{result.results?.commissionsProcessed || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Memberships:</span>
                      <span className="ml-2 font-semibold text-blue-600">{result.results?.membershipsAssigned || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Next Invoice:</span>
                      <span className="ml-2 font-semibold text-indigo-600">{result.nextInvoiceNumber}</span>
                    </div>
                  </div>
                </div>

                {result.results?.errors && result.results.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <h5 className="font-medium text-red-800 mb-2">Errors ({result.results.errors.length})</h5>
                    <div className="text-sm text-red-700 max-h-32 overflow-y-auto">
                      {result.results.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="mb-1">• {error}</div>
                      ))}
                      {result.results.errors.length > 5 && (
                        <div className="text-red-600 font-medium">
                          ... and {result.results.errors.length - 5} more errors
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

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Product-to-Membership Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Paket Ekspor Yuk Lifetime</h4>
              <p className="text-yellow-700 mb-2">→ LIFETIME Membership</p>
              <p className="text-yellow-600">Default Commission: {formatIDR(commissionRates['Paket Ekspor Yuk Lifetime'])}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Paket Ekspor Yuk 12 Bulan</h4>
              <p className="text-blue-700 mb-2">→ TWELVE_MONTHS Membership</p>
              <p className="text-blue-600">Default Commission: {formatIDR(commissionRates['Paket Ekspor Yuk 12 Bulan'])}</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Paket Ekspor Yuk 6 Bulan</h4>
              <p className="text-green-700 mb-2">→ SIX_MONTHS Membership</p>
              <p className="text-green-600">Default Commission: {formatIDR(commissionRates['Paket Ekspor Yuk 6 Bulan'])}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}