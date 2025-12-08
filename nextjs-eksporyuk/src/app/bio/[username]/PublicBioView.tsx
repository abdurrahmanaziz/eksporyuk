'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  MessageSquare, 
  ExternalLink,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react'
import Image from 'next/image'

interface PublicBioViewProps {
  data: {
    user: {
      id: string
      name: string | null
      username: string | null
      image: string | null
    }
    bioPage: any
    affiliateCode: string
  }
}

// Template configurations
const templateStyles = {
  modern: {
    containerBg: 'bg-gradient-to-br from-blue-50 to-purple-50',
    cardBg: 'bg-white',
    cardShadow: 'shadow-lg',
    cardRadius: 'rounded-2xl',
    buttonRadius: 'rounded-lg',
    textColor: 'text-gray-900'
  },
  minimal: {
    containerBg: 'bg-gray-50',
    cardBg: 'bg-white',
    cardShadow: 'shadow-sm',
    cardRadius: 'rounded-lg',
    buttonRadius: 'rounded-md',
    textColor: 'text-gray-800'
  },
  bold: {
    containerBg: 'bg-gradient-to-br from-red-50 to-orange-50',
    cardBg: 'bg-white',
    cardShadow: 'shadow-2xl',
    cardRadius: 'rounded-3xl',
    buttonRadius: 'rounded-xl',
    textColor: 'text-gray-900'
  },
  elegant: {
    containerBg: 'bg-gradient-to-br from-purple-100 to-pink-100',
    cardBg: 'bg-white',
    cardShadow: 'shadow-xl',
    cardRadius: 'rounded-2xl',
    buttonRadius: 'rounded-full',
    textColor: 'text-gray-900'
  },
  creative: {
    containerBg: 'bg-gradient-to-br from-green-50 to-cyan-50',
    cardBg: 'bg-white',
    cardShadow: 'shadow-lg',
    cardRadius: 'rounded-3xl',
    buttonRadius: 'rounded-2xl',
    textColor: 'text-gray-900'
  }
}

const fontFamilies = {
  inter: 'font-sans',
  poppins: 'font-sans',
  montserrat: 'font-sans',
  playfair: 'font-serif',
  roboto: 'font-sans'
}

export default function PublicBioView({ data }: PublicBioViewProps) {
  const { user, bioPage, affiliateCode } = data
  const [showOptinModal, setShowOptinModal] = useState<string | null>(null)
  const [selectedOptinForm, setSelectedOptinForm] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: ''
  })

  // Set affiliate tracking cookie on mount (client-side)
  useEffect(() => {
    if (typeof window === 'undefined' || !affiliateCode) return

    // Check if cookie already exists and is the same
    const existingRef = document.cookie
      .split('; ')
      .find(row => row.startsWith('affiliate_ref='))
      ?.split('=')[1]

    // Only set if different (don't reset 30-day timer if same)
    if (existingRef !== affiliateCode) {
      const expires = new Date()
      expires.setDate(expires.getDate() + 30)
      document.cookie = `affiliate_ref=${affiliateCode}; path=/; expires=${expires.toUTCString()}`

      // Track click via API (fire and forget)
      fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: affiliateCode }),
      }).catch(err => console.error('Failed to track affiliate click:', err))
    }
  }, [affiliateCode])

  // Handle CTA Button Click
  const handleCTAClick = async (ctaId: string, buttonType: string, cta: any) => {
    console.log('🔵 CTA Button Clicked:', {
      ctaId,
      buttonType,
      targetType: cta.targetType,
      customUrl: cta.customUrl,
      membershipId: cta.membershipId,
      productId: cta.productId,
      courseId: cta.courseId,
      optinFormId: cta.optinFormId
    })

    // Track click
    try {
      await fetch('/api/affiliate/bio/cta/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctaId })
      })
    } catch (error) {
      console.error('Error tracking click:', error)
    }

    // Handle different target types
    if (cta.targetType === 'custom' && cta.customUrl) {
      // Open custom URL
      console.log('Opening custom URL:', cta.customUrl)
      window.open(cta.customUrl, '_blank')
    } else if (cta.targetType === 'membership' && cta.membershipId) {
      // Redirect to membership page with affiliate ref
      const url = `/membership/${cta.membershipId}?ref=${affiliateCode}`
      console.log('Opening membership:', url)
      window.open(url, '_blank')
    } else if (cta.targetType === 'product' && cta.productId) {
      // Redirect to product page with affiliate ref
      const url = `/product/${cta.productId}?ref=${affiliateCode}`
      console.log('Opening product:', url)
      window.open(url, '_blank')
    } else if (cta.targetType === 'course' && cta.courseId) {
      // Redirect to course page with affiliate ref
      const url = `/course/${cta.courseId}?ref=${affiliateCode}`
      console.log('Opening course:', url)
      window.open(url, '_blank')
    } else if (cta.targetType === 'optin' && cta.optinFormId) {
      // Open optin form modal
      if (cta.optinForm) {
        console.log('Opening optin form modal')
        setSelectedOptinForm(cta.optinForm)
        setShowOptinModal(cta.optinForm.id)
      } else {
        toast.error('Form tidak ditemukan')
      }
    } else {
      console.warn('⚠️ No valid target found for CTA')
      // Fallback for old format
      if (buttonType === 'optin') {
        if (cta.optinForm) {
          setSelectedOptinForm(cta.optinForm)
          setShowOptinModal(cta.optinForm.id)
        }
      } else if (buttonType === 'link' && cta.targetUrl) {
        window.open(cta.targetUrl, '_blank')
      } else if (buttonType === 'membership' && cta.membership) {
        window.open(`/checkout/${cta.membership.slug}?ref=${affiliateCode}`, '_blank')
      } else if (buttonType === 'product' && cta.product) {
        window.open(`/checkout/product/${cta.product.slug}?ref=${affiliateCode}`, '_blank')
      } else if (buttonType === 'course' && cta.course) {
        window.open(`/checkout/course/${cta.course.slug}?ref=${affiliateCode}`, '_blank')
      }
    }
  }

  // Get template styling
  const template = bioPage.template || 'modern'
  const styles = templateStyles[template as keyof typeof templateStyles] || templateStyles.modern
  const fontClass = fontFamilies[bioPage.fontFamily as keyof typeof fontFamilies] || fontFamilies.inter

  // Helper function to get text size class
  const getTextSizeClass = (size?: string) => {
    const sizeMap: Record<string, string> = {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'base': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl'
    }
    return sizeMap[size || 'sm'] || 'text-sm'
  }

  const handleOptinSubmit = async (formId: string) => {
    const form = selectedOptinForm
    if (!form) return

    // Validate required fields
    if (form.collectName && !formData.name.trim()) {
      toast.error('Nama harus diisi')
      return
    }
    if (form.collectEmail && !formData.email.trim()) {
      toast.error('Email harus diisi')
      return
    }
    if (form.collectPhone && !formData.whatsapp.trim()) {
      toast.error('Nomor WhatsApp harus diisi')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/affiliate/optin-forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(result.successMessage || form.successMessage || 'Terima kasih!')
        setShowOptinModal(null)
        setSelectedOptinForm(null)
        setFormData({ name: '', email: '', phone: '', whatsapp: '' })

        // Handle redirect
        if (form.redirectType === 'url' && form.redirectUrl) {
          setTimeout(() => {
            window.location.href = form.redirectUrl!
          }, 1500)
        } else if (form.redirectType === 'whatsapp' && form.redirectWhatsapp) {
          setTimeout(() => {
            const cleanNumber = form.redirectWhatsapp!.replace(/\D/g, '')
            window.open(`https://wa.me/${cleanNumber}`, '_blank')
          }, 1500)
        }
      } else {
        toast.error(result.error || 'Gagal mengirim data')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Gagal mengirim data')
    } finally {
      setSubmitting(false)
    }
  }

  const handleWhatsAppClick = () => {
    if (bioPage.whatsappNumber) {
      const cleanNumber = bioPage.whatsappNumber.replace(/\D/g, '')
      window.open(`https://wa.me/${cleanNumber}`, '_blank')
    }
  }

  const handleWhatsAppGroupClick = () => {
    if (bioPage.whatsappGroupLink) {
      window.open(bioPage.whatsappGroupLink, '_blank')
    }
  }

  return (
    <div className={`min-h-screen ${styles.containerBg} ${fontClass} py-8`}>
      <div className="max-w-xl mx-auto px-4">
        {/* Card with Cover and Avatar Overlap */}
        <div className={`${styles.cardBg} ${styles.cardRadius} ${styles.cardShadow} overflow-visible relative`}>
          {/* Cover Image */}
          {bioPage.coverImage && (
            <div className={`w-full h-32 relative overflow-hidden`}>
              <Image
                src={bioPage.coverImage}
                alt="Cover"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Avatar - Positioned to overlap cover */}
          <div className={`${bioPage.coverImage ? '' : 'pt-8'} px-6`}>
            <div className="flex justify-center absolute left-1/2 transform -translate-x-1/2" style={{ top: bioPage.coverImage ? '88px' : '32px' }}>
              <div className="relative w-20 h-20 mb-4">
                {bioPage.avatarUrl ? (
                  <Image
                    src={bioPage.avatarUrl}
                    alt={bioPage.displayName || user.name || 'Avatar'}
                    fill
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {(bioPage.displayName || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Section */}
            <div className="text-center mb-6" style={{ paddingTop: bioPage.coverImage ? '56px' : '0' }}>
              <h1 className={`text-lg font-bold mb-1 ${styles.textColor}`} style={{ color: bioPage.primaryColor || undefined }}>
                {bioPage.displayName || user.name}
              </h1>
              
              {bioPage.customHeadline && (
                <p className="text-xs text-gray-600 mb-3">{bioPage.customHeadline}</p>
              )}
              
              {bioPage.customDescription && (
                <p className="text-xs text-gray-600 mb-3 whitespace-pre-line">{bioPage.customDescription}</p>
              )}

              {/* Social Media Icons */}
              {bioPage.showSocialIcons && (bioPage.socialFacebook || bioPage.socialInstagram || bioPage.socialTwitter || bioPage.socialTiktok || bioPage.socialYoutube) && (
                <div className="flex justify-center gap-3 mt-4">
                  {bioPage.socialFacebook && (
                    <a href={bioPage.socialFacebook} target="_blank" rel="noopener noreferrer" 
                       className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                       style={{ color: bioPage.primaryColor || '#3B82F6' }}>
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {bioPage.socialInstagram && (
                    <a href={bioPage.socialInstagram} target="_blank" rel="noopener noreferrer"
                       className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                       style={{ color: bioPage.primaryColor || '#3B82F6' }}>
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {bioPage.socialTwitter && (
                    <a href={bioPage.socialTwitter} target="_blank" rel="noopener noreferrer"
                       className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                       style={{ color: bioPage.primaryColor || '#3B82F6' }}>
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {bioPage.socialTiktok && (
                    <a href={bioPage.socialTiktok} target="_blank" rel="noopener noreferrer"
                       className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                       style={{ color: bioPage.primaryColor || '#3B82F6' }}>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                      </svg>
                    </a>
                  )}
                  {bioPage.socialYoutube && (
                    <a href={bioPage.socialYoutube} target="_blank" rel="noopener noreferrer"
                       className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                       style={{ color: bioPage.primaryColor || '#3B82F6' }}>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            {bioPage.ctaButtons && bioPage.ctaButtons.length > 0 && (
              <div className={`space-y-3`}>
            {bioPage.ctaButtons.map((cta: any) => {
              // Check if this is inline optin form
              if (cta.buttonType === 'optin' && cta.optinDisplayMode === 'inline' && cta.optinForm) {
                // Render inline form
                return (
                  <div key={cta.id} className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 text-white">
                      <h3 className="text-xl font-bold mb-1">{cta.optinForm.headline}</h3>
                      {cta.optinForm.description && (
                        <p className="text-sm text-blue-50">{cta.optinForm.description}</p>
                      )}
                    </div>

                    {/* Form */}
                    <div className="px-6 py-5 space-y-4">
                      {cta.optinForm.collectName && (
                        <div className="space-y-2">
                          <Label htmlFor={`name-${cta.id}`} className="text-sm font-semibold text-gray-700">
                            Nama Lengkap *
                          </Label>
                          <Input
                            id={`name-${cta.id}`}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Masukkan nama lengkap Anda"
                            className="h-11 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {cta.optinForm.collectEmail && (
                        <div className="space-y-2">
                          <Label htmlFor={`email-${cta.id}`} className="text-sm font-semibold text-gray-700">
                            Email *
                          </Label>
                          <Input
                            id={`email-${cta.id}`}
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            className="h-11 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {cta.optinForm.collectPhone && (
                        <div className="space-y-2">
                          <Label htmlFor={`whatsapp-${cta.id}`} className="text-sm font-semibold text-gray-700">
                            WhatsApp *
                          </Label>
                          <Input
                            id={`whatsapp-${cta.id}`}
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            placeholder="628123456789"
                            className="h-11 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 px-1">
                            Format: 628xxx (tanpa +, tanpa spasi)
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={async () => {
                          // Track click without opening modal
                          try {
                            await fetch('/api/affiliate/bio/cta/click', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ctaId: cta.id })
                            })
                          } catch (error) {
                            console.error('Error tracking click:', error)
                          }
                          // Directly submit the form
                          handleOptinSubmit(cta.optinForm.id)
                        }}
                        disabled={submitting}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        {submitting ? 'Mengirim...' : (cta.optinForm.submitButtonText || 'Kirim')}
                      </Button>
                    </div>
                  </div>
                )
              }
              
              // Render different styles based on buttonStyle
              if (cta.buttonStyle === 'card') {
                // Vertical Card Layout
                return (
                  <div 
                    key={cta.id}
                    onClick={() => handleCTAClick(cta.id, cta.buttonType, cta)}
                    className="cursor-pointer bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:border-gray-300"
                  >
                    {cta.showThumbnail && cta.thumbnailUrl && (
                      <div className="w-full h-40 bg-gray-100 relative">
                        <img 
                          src={cta.thumbnailUrl} 
                          alt={cta.buttonText}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className={`font-semibold ${getTextSizeClass(cta.titleSize)} mb-1`}>{cta.buttonText}</h3>
                      {cta.subtitle && (
                        <p className={`${getTextSizeClass(cta.subtitleSize)} text-gray-600 mb-2`}>{cta.subtitle}</p>
                      )}
                      {cta.showPrice && (cta.price || cta.originalPrice) && (
                        <div className="flex items-center gap-2 mb-3">
                          {cta.price && (
                            <span className="text-sm font-bold" style={{ color: bioPage.primaryColor || '#3B82F6' }}>
                              {cta.price}
                            </span>
                          )}
                          {cta.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {cta.originalPrice}
                            </span>
                          )}
                        </div>
                      )}
                      <div 
                        className={`text-center py-2 px-4 rounded-lg font-medium ${getTextSizeClass(cta.buttonTextSize)}`}
                        style={{
                          backgroundColor: cta.backgroundColor,
                          color: cta.textColor
                        }}
                      >
                        Lihat Detail
                      </div>
                    </div>
                  </div>
                )
              } else if (cta.buttonStyle === 'card-horizontal') {
                // Horizontal Card Layout
                return (
                  <div 
                    key={cta.id}
                    onClick={() => handleCTAClick(cta.id, cta.buttonType, cta)}
                    className="cursor-pointer bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:border-gray-300 flex"
                  >
                    {cta.showThumbnail && cta.thumbnailUrl && (
                      <div className="w-24 h-24 bg-gray-100 flex-shrink-0 relative">
                        <img 
                          src={cta.thumbnailUrl} 
                          alt={cta.buttonText}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-3 flex flex-col justify-center">
                      <h3 className={`font-semibold ${getTextSizeClass(cta.titleSize)} mb-0.5`}>{cta.buttonText}</h3>
                      {cta.subtitle && (
                        <p className={`${getTextSizeClass(cta.subtitleSize)} text-gray-600 mb-1 line-clamp-2`}>{cta.subtitle}</p>
                      )}
                      {cta.showPrice && (cta.price || cta.originalPrice) && (
                        <div className="flex items-center gap-2">
                          {cta.price && (
                            <span className="text-sm font-bold" style={{ color: bioPage.primaryColor || '#3B82F6' }}>
                              {cta.price}
                            </span>
                          )}
                          {cta.originalPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              {cta.originalPrice}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              } else if (cta.buttonStyle === 'card-product') {
                // Product Card with Price Badge
                return (
                  <div 
                    key={cta.id}
                    onClick={() => handleCTAClick(cta.id, cta.buttonType, cta)}
                    className="cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:border-blue-300"
                  >
                    {cta.showThumbnail && cta.thumbnailUrl && (
                      <div className="w-full h-40 bg-white relative">
                        <img 
                          src={cta.thumbnailUrl} 
                          alt={cta.buttonText}
                          className="w-full h-full object-cover"
                        />
                        {cta.showPrice && cta.originalPrice && cta.price && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                            DISKON
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className={`font-semibold ${getTextSizeClass(cta.titleSize)} mb-1`}>{cta.buttonText}</h3>
                      {cta.subtitle && (
                        <p className={`${getTextSizeClass(cta.subtitleSize)} text-gray-600 mb-3`}>{cta.subtitle}</p>
                      )}
                      {cta.showPrice && (cta.price || cta.originalPrice) && (
                        <div className="flex items-baseline gap-2 mb-3">
                          {cta.price && (
                            <span className="text-base font-bold text-blue-600">
                              {cta.price}
                            </span>
                          )}
                          {cta.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {cta.originalPrice}
                            </span>
                          )}
                        </div>
                      )}
                      <div 
                        className={`text-center py-2 px-4 rounded-lg font-medium ${getTextSizeClass(cta.buttonTextSize)} shadow-sm`}
                        style={{
                          backgroundColor: cta.backgroundColor,
                          color: cta.textColor
                        }}
                      >
                        Beli Sekarang
                      </div>
                    </div>
                  </div>
                )
              } else {
                // Default Button Style - Match preview exactly
                const getButtonStyleClass = () => {
                  const baseClass = "flex items-center gap-3 p-3 transition-all"
                  const style = cta.buttonStyle || 'solid'
                  
                  switch(style) {
                    case 'outline':
                      return `${baseClass} rounded-xl border-2 bg-transparent`
                    case 'gradient':
                      return `${baseClass} rounded-xl bg-gradient-to-r shadow-lg`
                    case 'shadow':
                      return `${baseClass} rounded-xl shadow-xl hover:shadow-2xl`
                    case 'rounded':
                      return `${baseClass} rounded-full`
                    case 'minimal':
                      return `${baseClass} rounded-lg border`
                    default: // solid
                      return `${baseClass} rounded-xl`
                  }
                }

                const buttonStyleClass = getButtonStyleClass()

                // For gradient style
                if (cta.buttonStyle === 'gradient') {
                  return (
                    <div
                      key={cta.id}
                      onClick={() => handleCTAClick(cta.id, cta.buttonType, cta)}
                      className={`${buttonStyleClass} cursor-pointer`}
                      style={{
                        backgroundImage: `linear-gradient(to right, ${cta.backgroundColor}, ${cta.textColor})`,
                        color: '#FFFFFF'
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cta.buttonText}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </div>
                  )
                }

                // For outline style
                if (cta.buttonStyle === 'outline') {
                  return (
                    <div
                      key={cta.id}
                      onClick={() => handleCTAClick(cta.id, cta.buttonType, cta)}
                      className={`${buttonStyleClass} cursor-pointer`}
                      style={{
                        borderColor: cta.backgroundColor,
                        color: cta.backgroundColor,
                        backgroundColor: 'transparent'
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cta.buttonText}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </div>
                  )
                }

                // For minimal style
                if (cta.buttonStyle === 'minimal') {
                  return (
                    <div
                      key={cta.id}
                      onClick={() => handleCTAClick(cta.id, cta.buttonType, cta)}
                      className={`${buttonStyleClass} cursor-pointer`}
                      style={{
                        borderColor: '#D1D5DB',
                        color: cta.backgroundColor,
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cta.buttonText}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </div>
                  )
                }

                // Default solid style
                return (
                  <div
                    key={cta.id}
                    onClick={() => handleCTAClick(cta.id, cta.buttonType, cta)}
                    className={`${buttonStyleClass} cursor-pointer`}
                    style={{
                      backgroundColor: cta.backgroundColor,
                      color: cta.textColor
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{cta.buttonText}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </div>
                )
              }
            })}
              </div>
            )}

            {/* Embedded Optin Forms */}
            {bioPage.optinForms && bioPage.optinForms.length > 0 && (
              <div className="space-y-6 mb-8">
                {bioPage.optinForms.map((form: any) => (
                  <Card key={form.id} className={styles.cardRadius}>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-2">{form.headline}</h3>
                      {form.description && (
                        <p className="text-gray-600 mb-4">{form.description}</p>
                      )}
                      <Button 
                        onClick={() => setShowOptinModal(form.id)}
                        className={`w-full ${styles.buttonRadius}`}
                        style={{ backgroundColor: bioPage.primaryColor || '#3B82F6' }}
                      >
                        {form.submitButtonText}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-8 pb-6 border-t">
              <p className="text-sm text-gray-500">
                Powered by <span className="font-semibold">Ekspor Yuk</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Optin Form Modal */}
      {showOptinModal && (
        <Dialog open={!!showOptinModal} onOpenChange={() => {
          setShowOptinModal(null)
          setSelectedOptinForm(null)
        }}>
          <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
            {/* Header dengan gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <DialogTitle className="text-2xl font-bold mb-2">
                {selectedOptinForm?.headline || 'Form Pendaftaran'}
              </DialogTitle>
              <DialogDescription className="text-blue-50">
                {selectedOptinForm?.description}
              </DialogDescription>
            </div>

            {/* Form dengan padding lebih besar */}
            <div className="px-8 py-6 space-y-5 bg-white">
              {selectedOptinForm?.collectName && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Nama Lengkap *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama lengkap Anda"
                    className="h-12 px-4 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedOptinForm?.collectEmail && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-12 px-4 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedOptinForm?.collectPhone && (
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700">
                    WhatsApp *
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="628123456789"
                    className="h-12 px-4 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 px-1">
                    Format: 628xxx (tanpa +, tanpa spasi)
                  </p>
                </div>
              )}
            </div>

            {/* Footer dengan padding lebih besar */}
            <div className="px-8 py-5 bg-gray-50 flex gap-3 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowOptinModal(null)
                  setSelectedOptinForm(null)
                }}
                className="flex-1 h-12 text-base font-medium"
              >
                Batal
              </Button>
              <Button 
                onClick={() => showOptinModal && handleOptinSubmit(showOptinModal)} 
                disabled={submitting}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {submitting ? 'Mengirim...' : (selectedOptinForm?.submitButtonText || 'Kirim')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
