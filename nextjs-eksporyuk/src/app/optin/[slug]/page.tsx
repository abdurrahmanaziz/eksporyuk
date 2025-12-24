'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle2, Gift, HelpCircle } from 'lucide-react'
import CountdownTimer from '@/components/CountdownTimer'

interface OptinForm {
  id: string
  formName: string
  headline: string
  description: string | null
  submitButtonText: string
  successMessage: string
  redirectType: string
  redirectUrl: string | null
  redirectWhatsapp: string | null
  collectName: boolean
  collectEmail: boolean
  collectPhone: boolean
  isActive: boolean
  bannerTitle: string | null
  bannerSubtitle: string | null
  bannerBadgeText: string | null
  primaryColor: string | null
  secondaryColor: string | null
  showCountdown: boolean
  countdownEndDate: string | null
  benefits: any
  faqs: any
}

export default function PublicOptinFormPage() {
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<OptinForm | null>(null)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '' // Honeypot field - hidden from user
  })

  useEffect(() => {
    fetchForm()
  }, [slug])

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/public/optin-forms/${slug}`)
      const data = await res.json()

      if (res.ok && data.optinForm) {
        if (!data.optinForm.isActive) {
          setError('Form ini tidak aktif')
        } else {
          setForm(data.optinForm)
        }
      } else {
        setError('Form tidak ditemukan')
      }
    } catch (err) {
      setError('Gagal memuat form')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const submitData: any = {
        website: formData.website // Include honeypot field for backend check
      }
      
      if (form?.collectName) submitData.name = formData.name
      if (form?.collectEmail) submitData.email = formData.email
      if (form?.collectPhone) submitData.phone = formData.phone

      const res = await fetch(`/api/affiliate/optin-forms/${form?.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (res.ok) {
        const data = await res.json()
        setSubmitted(true)

        // Handle redirect from API response
        if (data.redirectUrl) {
          setTimeout(() => {
            if (form?.redirectType === 'whatsapp') {
              window.open(data.redirectUrl, '_blank')
            } else {
              window.location.href = data.redirectUrl
            }
          }, 2000)
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal mengirim data')
      }
    } catch (err) {
      setError('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat form...</p>
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error || 'Form tidak ditemukan'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Berhasil!</h2>
            <p className="text-gray-600 whitespace-pre-line">{form.successMessage}</p>
            {form.redirectType === 'url' && form.redirectUrl && (
              <p className="text-sm text-gray-500 mt-4">Mengalihkan...</p>
            )}
            {form.redirectType === 'whatsapp' && form.redirectWhatsapp && (
              <p className="text-sm text-gray-500 mt-4">Membuka WhatsApp...</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Parse custom design data
  const primaryColor = form.primaryColor || '#2563eb'
  const secondaryColor = form.secondaryColor || '#4f46e5'
  const badgeText = form.bannerBadgeText || 'Event Terbatas - Daftar Sekarang!'
  const benefits = Array.isArray(form.benefits) && form.benefits.length > 0 ? form.benefits : [
    'Akses penuh ke event eksklusif',
    'Materi pembelajaran lengkap & praktis',
    'Sertifikat keikutsertaan resmi',
    'Networking dengan peserta lain',
    'Rekaman event untuk dipelajari ulang',
    'Bonus template & resources'
  ]
  const faqs = Array.isArray(form.faqs) && form.faqs.length > 0 ? form.faqs : [
    {
      question: 'Apakah event ini benar-benar gratis?',
      answer: 'Ya, 100% gratis tanpa biaya tersembunyi. Anda hanya perlu mendaftar untuk mengamankan slot Anda.'
    },
    {
      question: 'Kapan event ini berlangsung?',
      answer: 'Detail jadwal akan dikirimkan ke email Anda setelah pendaftaran berhasil. Pastikan email yang Anda daftarkan aktif.'
    },
    {
      question: 'Bagaimana cara mengakses event?',
      answer: 'Link akses akan dikirimkan via email dan WhatsApp sebelum event dimulai. Anda bisa mengaksesnya dari smartphone, tablet, atau komputer.'
    },
    {
      question: 'Apakah cocok untuk pemula?',
      answer: 'Sangat cocok! Materi dirancang untuk semua level, dari pemula hingga yang sudah berpengalaman.'
    },
    {
      question: 'Apakah ada sertifikat?',
      answer: 'Ya, semua peserta yang mengikuti event sampai selesai akan mendapatkan sertifikat keikutsertaan digital.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Banner */}
      <div 
        className="relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
        }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to top, ${primaryColor}80, transparent)`
        }}></div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-xs sm:text-sm font-medium">{badgeText}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2">
              {form.headline}
            </h1>
            
            {form.description && (
              <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 whitespace-pre-line px-2">
                {form.description}
              </p>
            )}
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm px-2">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>100% Gratis</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Dapat Sertifikat</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Akses Langsung</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="rgb(239 246 255)"/>
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        {/* Countdown Timer */}
        {form.showCountdown && form.countdownEndDate && (
          <div className="mb-6 sm:mb-8">
            <CountdownTimer endDate={form.countdownEndDate} primaryColor={primaryColor} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Main Form - 2 cols */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl text-center">
                  Daftar Sekarang - Tempat Terbatas!
                </CardTitle>
                <CardDescription className="text-center text-xs sm:text-sm">
                  Isi form di bawah untuk mengamankan slot Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            {/* Honeypot field - hidden from users, trap for bots */}
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            
            {form.collectName && (
              <div>
                <Label htmlFor="name" className="text-sm mb-2 block">Nama *</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama Anda"
                  className="h-11"
                />
              </div>
            )}

            {form.collectEmail && (
              <div>
                <Label htmlFor="email" className="text-sm mb-2 block">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="h-11"
                />
              </div>
            )}

            {form.collectPhone && (
              <div>
                <Label htmlFor="phone" className="text-sm mb-2 block">Nomor WhatsApp *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="628123456789"
                  className="h-11"
                />
                <p className="text-xs text-gray-500 mt-1">Format: 628xxx (tanpa +, tanpa spasi)</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-base font-semibold"
            >
              {submitting ? 'Mengirim...' : form.submitButtonText}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>

    {/* Sidebar - Benefits + Q&A */}
    <div className="space-y-4 sm:space-y-6">
      {/* Benefits Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b p-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            Apa Yang Anda Dapatkan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <ul className="space-y-2 sm:space-y-3">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 sm:gap-3">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Q&A Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b p-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
            Pertanyaan Umum
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className={index < faqs.length - 1 ? 'border-b' : ''}>
                <AccordionTrigger className="text-xs sm:text-sm font-medium hover:no-underline py-2 sm:py-3 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-gray-600 pb-2 sm:pb-3">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
</div>
  )
}
