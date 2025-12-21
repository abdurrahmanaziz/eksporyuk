'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Package } from 'lucide-react'
import { toast } from 'sonner'
import SupplierTypeSelection from '@/components/supplier/SupplierTypeSelection'
import SupplierProfileForm from '@/components/supplier/SupplierProfileForm'
import SupplierAssessment from '@/components/supplier/SupplierAssessment'

type SupplierType = 'PRODUSEN' | 'PABRIK' | 'TRADER' | 'AGGREGATOR'

interface SupplierPackage {
  id: string
  name: string
  type: string
  duration: string
  price: number
  originalPrice?: number
  features: any
  description?: string
}

interface AssessmentAnswer {
  questionId: string
  answerText: string
  answerValue?: number
  score: number
}

export default function BecomeSupplierPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<SupplierPackage[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [step, setStep] = useState(0) // Changed to 0 for supplier type selection

  // New state for supplier type and assessment
  const [supplierType, setSupplierType] = useState<SupplierType | null>(null)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [assessmentCompleted, setAssessmentCompleted] = useState(false)
  const [supplierId, setSupplierId] = useState<string>('')

  useEffect(() => {
    fetchPackages()
    checkExistingProfile()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/supplier/packages')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.packages) {
          setPackages(data.packages)
          
          // Auto select FREE package
          const freePackage = data.packages.find((pkg: SupplierPackage) => pkg.type === 'FREE')
          if (freePackage) {
            setSelectedPackageId(freePackage.id)
          } else if (data.packages.length > 0) {
            setSelectedPackageId(data.packages[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Gagal memuat paket')
    }
  }

  const checkExistingProfile = async () => {
    try {
      const response = await fetch('/api/supplier/profile')
      if (response.ok) {
        toast.info('Anda sudah memiliki profil supplier')
        router.push('/supplier/dashboard')
      }
    } catch (error) {
      // No profile yet, continue
    }
  }

  // Handler for supplier type selection (Step 0)
  const handleTypeSelect = (type: SupplierType) => {
    setSupplierType(type)
    setStep(1)
  }

  // Handler for profile form submission (Step 1)
  const handleProfileSubmit = async (data: any, files: any) => {
    console.log('[BECOME_SUPPLIER] Submitting profile data...')
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      
      // Add supplier type
      formDataToSend.append('supplierType', supplierType!)
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value as string)
      })
      
      // Append files
      if (files.logo) formDataToSend.append('logo', files.logo)
      if (files.banner) formDataToSend.append('banner', files.banner)
      if (files.legalityDoc) formDataToSend.append('legalityDoc', files.legalityDoc)
      if (files.nibDoc) formDataToSend.append('nibDoc', files.nibDoc)

      console.log('[BECOME_SUPPLIER] Sending request to /api/supplier/register...')
      const response = await fetch('/api/supplier/register', {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()
      console.log('[BECOME_SUPPLIER] Profile API Response:', result)

      if (response.ok) {
        toast.success('Profil berhasil disimpan!')
        setSupplierId(result.supplier?.id || '')
        setProfileCompleted(true)
        setStep(2) // Move to assessment
      } else {
        console.error('[BECOME_SUPPLIER] Profile failed:', result.error)
        toast.error(result.error || 'Gagal menyimpan profil')
      }
    } catch (error) {
      console.error('[BECOME_SUPPLIER] Error submitting profile:', error)
      toast.error('Terjadi kesalahan saat menyimpan profil')
    } finally {
      setLoading(false)
    }
  }

  // Handler for assessment submission (Step 2)
  const handleAssessmentSubmit = async (answers: AssessmentAnswer[]) => {
    console.log('[BECOME_SUPPLIER] Submitting assessment answers...')
    setLoading(true)

    try {
      const response = await fetch('/api/supplier/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      })

      const result = await response.json()
      console.log('[BECOME_SUPPLIER] Assessment API Response:', result)

      if (response.ok) {
        toast.success('Assessment berhasil diselesaikan!')
        setAssessmentCompleted(true)
        setStep(3) // Move to package selection
      } else {
        console.error('[BECOME_SUPPLIER] Assessment failed:', result.error)
        toast.error(result.error || 'Gagal menyimpan assessment')
      }
    } catch (error) {
      console.error('[BECOME_SUPPLIER] Error submitting assessment:', error)
      toast.error('Terjadi kesalahan saat menyimpan assessment')
    } finally {
      setLoading(false)
    }
  }

  // Handler for final package selection and registration completion (Step 3)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPackageId) {
      toast.error('Silakan pilih paket')
      return
    }

    console.log('[BECOME_SUPPLIER] Completing registration with package...')
    setLoading(true)

    try {
      // Update supplier profile with selected package
      const response = await fetch('/api/supplier/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId: selectedPackageId }),
      })

      const data = await response.json()
      console.log('[BECOME_SUPPLIER] Package API Response:', data)

      if (response.ok) {
        // Check if payment is required
        const selectedPkg = packages.find(p => p.id === selectedPackageId)
        if (selectedPkg && selectedPkg.price > 0) {
          // Create payment invoice
          const paymentResponse = await fetch('/api/supplier/payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ packageId: selectedPackageId }),
          })

          const paymentData = await paymentResponse.json()
          
          if (paymentResponse.ok && paymentData.paymentUrl) {
            console.log('[BECOME_SUPPLIER] Redirecting to payment:', paymentData.paymentUrl)
            toast.success('Profil berhasil dibuat! Melanjutkan ke pembayaran...')
            setTimeout(() => {
              window.location.href = paymentData.paymentUrl
            }, 1000)
            return
          }
        }
        
        // FREE package - complete registration
        console.log('[BECOME_SUPPLIER] Registration complete, redirecting to dashboard')
        toast.success('Registrasi berhasil! Selamat datang di EksporYuk Supplier Network.')
        router.push('/supplier/dashboard')
      } else {
        console.error('[BECOME_SUPPLIER] Package update failed:', data.error)
        toast.error(data.error || 'Gagal memperbarui paket')
      }
    } catch (error) {
      console.error('[BECOME_SUPPLIER] Error in final submit:', error)
      toast.error('Terjadi kesalahan saat menyelesaikan registrasi')
    } finally {
      setLoading(false)
    }
  }

  const selectedPackage = packages.find(p => p.id === selectedPackageId)

  return (
    <ResponsivePageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Daftar Sebagai Supplier</h1>
          <p className="text-gray-500">Bergabung dengan jaringan supplier EksporYuk dan kembangkan bisnis ekspor Anda</p>
        </div>

        {/* Progress Steps - Updated to 4 steps */}
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center gap-2 ${step >= 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 0 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 0 ? <Check className="w-5 h-5" /> : '0'}
            </div>
            <span className="text-sm font-medium hidden md:inline">Tipe Supplier</span>
          </div>
          <div className="w-8 md:w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-sm font-medium hidden md:inline">Profil Perusahaan</span>
          </div>
          <div className="w-8 md:w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-sm font-medium hidden md:inline">Assessment</span>
          </div>
          <div className="w-8 md:w-12 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-sm font-medium hidden md:inline">Pilih Paket</span>
          </div>
        </div>

        {/* Step 0: Supplier Type Selection */}
        {step === 0 && (
          <SupplierTypeSelection
            onSelect={handleTypeSelect}
            selectedType={supplierType}
            isSubmitting={loading}
          />
        )}

        {/* Step 1: Profile Form (5 tabs) */}
        {step === 1 && supplierType && (
          <SupplierProfileForm
            onSubmit={handleProfileSubmit}
            isSubmitting={loading}
          />
        )}

        {/* Step 2: Assessment */}
        {step === 2 && supplierType && (
          <SupplierAssessment
            supplierType={supplierType}
            onSubmit={handleAssessmentSubmit}
            isSubmitting={loading}
          />
        )}

        {/* Step 3: Package Selection */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pilih Paket Keanggotaan
                </CardTitle>
                <CardDescription>Pilih paket yang sesuai dengan kebutuhan bisnis Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        selectedPackageId === pkg.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center space-y-4">
                        <Badge variant={pkg.type === 'FREE' ? 'secondary' : 'default'}>
                          {pkg.type}
                        </Badge>
                        <h3 className="font-bold text-xl">{pkg.name}</h3>
                        <div>
                          <p className="text-3xl font-bold">
                            {pkg.price === 0 ? 'Gratis' : `Rp ${pkg.price.toLocaleString('id-ID')}`}
                          </p>
                          {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                            <p className="text-sm text-gray-500 line-through">
                              Rp {pkg.originalPrice.toLocaleString('id-ID')}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            {pkg.duration === 'MONTHLY' ? '/bulan' : pkg.duration === 'YEARLY' ? '/tahun' : ''}
                          </p>
                        </div>
                        <div className="text-left text-sm space-y-2">
                          <p className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Produk: {pkg.features.maxProducts === -1 ? 'Unlimited' : pkg.features.maxProducts}
                          </p>
                          <p className="flex items-center gap-2">
                            {pkg.features.chatEnabled ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="w-4 h-4 text-gray-300">✗</span>
                            )}
                            Chat Diaktifkan
                          </p>
                          <p className="flex items-center gap-2">
                            {pkg.features.verifiedBadge ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="w-4 h-4 text-gray-300">✗</span>
                            )}
                            Badge Terverifikasi
                          </p>
                          <p className="flex items-center gap-2">
                            {pkg.features.customURL ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="w-4 h-4 text-gray-300">✗</span>
                            )}
                            URL Kustom
                          </p>
                          <p className="flex items-center gap-2">
                            {pkg.features.statistics ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="w-4 h-4 text-gray-300">✗</span>
                            )}
                            Statistik & Analitik
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Kembali
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Memproses...' : selectedPackage?.price === 0 ? 'Selesaikan Registrasi' : 'Lanjut ke Pembayaran'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ResponsivePageWrapper>
  )
}
