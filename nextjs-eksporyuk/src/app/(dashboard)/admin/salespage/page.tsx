'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, Plus, Trash2, RefreshCw, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SalesPageSettings {
  id?: string
  heroTitle?: string
  heroHighlight?: string
  heroDescription?: string
  heroBadgeText?: string
  heroCtaText?: string
  heroCtaSecondaryText?: string
  navbarLogo?: string
  navbarLogoText?: string
  navbarCtaText?: string
  featuresTitle?: string
  featuresSubtitle?: string
  featuresData?: Array<{ icon: string; title: string; description: string }>
  pricingTitle?: string
  pricingSubtitle?: string
  pricingShowFromDb?: boolean
  pricingCustomData?: Array<{ duration: string; price: string; features: string[]; popular: boolean }>
  testimonialsTitle?: string
  testimonialsSubtitle?: string
  testimonialsData?: Array<{ name: string; role: string; content: string; avatar: string }>
  faqTitle?: string
  faqData?: Array<{ question: string; answer: string }>
  ctaTitle?: string
  ctaDescription?: string
  ctaButtonText?: string
  ctaStats?: Array<{ value: string; label: string }>
  footerDescription?: string
  footerEmail?: string
  footerPhone?: string
  footerAddress?: string
  footerSocialLinks?: { instagram?: string; facebook?: string; linkedin?: string; youtube?: string; tiktok?: string }
}

interface Membership {
  id: string
  name: string
  slug: string
  price: number
  durationDays: number
  features: string[]
  isFeatured: boolean
}

export default function AdminSalesPagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SalesPageSettings>({})
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeTab, setActiveTab] = useState('hero')
  
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }
    fetchSettings()
    fetchMemberships()
  }, [session, status, router])
  
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/salespage')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchMemberships = async () => {
    try {
      const res = await fetch('/api/admin/salespage/memberships')
      if (res.ok) {
        const data = await res.json()
        setMemberships(data)
      }
    } catch (error) {
      console.error('Error fetching memberships:', error)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/salespage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan!')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }
  
  const updateFeature = (index: number, field: string, value: string) => {
    const features = [...(settings.featuresData || [])]
    features[index] = { ...features[index], [field]: value }
    setSettings({ ...settings, featuresData: features })
  }
  
  const addFeature = () => {
    const features = [...(settings.featuresData || []), { icon: '📌', title: 'Fitur Baru', description: 'Deskripsi fitur' }]
    setSettings({ ...settings, featuresData: features })
  }
  
  const removeFeature = (index: number) => {
    const features = (settings.featuresData || []).filter((_, i) => i !== index)
    setSettings({ ...settings, featuresData: features })
  }
  
  const updateTestimonial = (index: number, field: string, value: string) => {
    const testimonials = [...(settings.testimonialsData || [])]
    testimonials[index] = { ...testimonials[index], [field]: value }
    setSettings({ ...settings, testimonialsData: testimonials })
  }
  
  const addTestimonial = () => {
    const testimonials = [...(settings.testimonialsData || []), { name: 'Nama', role: 'Pekerjaan', content: 'Testimoni...', avatar: '' }]
    setSettings({ ...settings, testimonialsData: testimonials })
  }
  
  const removeTestimonial = (index: number) => {
    const testimonials = (settings.testimonialsData || []).filter((_, i) => i !== index)
    setSettings({ ...settings, testimonialsData: testimonials })
  }
  
  const updateFaq = (index: number, field: string, value: string) => {
    const faqs = [...(settings.faqData || [])]
    faqs[index] = { ...faqs[index], [field]: value }
    setSettings({ ...settings, faqData: faqs })
  }
  
  const addFaq = () => {
    const faqs = [...(settings.faqData || []), { question: 'Pertanyaan baru?', answer: 'Jawaban...' }]
    setSettings({ ...settings, faqData: faqs })
  }
  
  const removeFaq = (index: number) => {
    const faqs = (settings.faqData || []).filter((_, i) => i !== index)
    setSettings({ ...settings, faqData: faqs })
  }
  
  const updateStat = (index: number, field: string, value: string) => {
    const stats = [...(settings.ctaStats || [])]
    stats[index] = { ...stats[index], [field]: value }
    setSettings({ ...settings, ctaStats: stats })
  }
  
  const addStat = () => {
    const stats = [...(settings.ctaStats || []), { value: '100+', label: 'Label' }]
    setSettings({ ...settings, ctaStats: stats })
  }
  
  const removeStat = (index: number) => {
    const stats = (settings.ctaStats || []).filter((_, i) => i !== index)
    setSettings({ ...settings, ctaStats: stats })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Page Settings</h1>
          <p className="text-gray-600 mt-1">Kelola tampilan halaman utama website</p>
        </div>
        <div className="flex gap-3">
          <Link href="/" target="_blank">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </Link>
          <Button onClick={fetchSettings} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Semua
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero & Navbar</TabsTrigger>
          <TabsTrigger value="features">Fitur</TabsTrigger>
          <TabsTrigger value="pricing">Harga</TabsTrigger>
          <TabsTrigger value="testimonials">Testimoni</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="footer">Footer & CTA</TabsTrigger>
        </TabsList>
        
        {/* Hero & Navbar Tab */}
        <TabsContent value="hero" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Navbar</CardTitle>
              <CardDescription>Pengaturan navigasi dan logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teks Logo</Label>
                  <Input 
                    value={settings.navbarLogoText || ''} 
                    onChange={(e) => setSettings({ ...settings, navbarLogoText: e.target.value })}
                    placeholder="Eksporyuk"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tombol CTA</Label>
                  <Input 
                    value={settings.navbarCtaText || ''} 
                    onChange={(e) => setSettings({ ...settings, navbarCtaText: e.target.value })}
                    placeholder="Gabung Komunitas"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL Logo (opsional)</Label>
                <Input 
                  value={settings.navbarLogo || ''} 
                  onChange={(e) => setSettings({ ...settings, navbarLogo: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Bagian utama yang pertama kali dilihat pengunjung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Badge Text</Label>
                <Input 
                  value={settings.heroBadgeText || ''} 
                  onChange={(e) => setSettings({ ...settings, heroBadgeText: e.target.value })}
                  placeholder="7,000+ Calon Eksportir Bergabung"
                />
              </div>
              <div className="space-y-2">
                <Label>Judul Utama</Label>
                <Input 
                  value={settings.heroTitle || ''} 
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  placeholder="Belajar Ekspor Mudah dan Praktis di Komunitas"
                />
              </div>
              <div className="space-y-2">
                <Label>Kata yang Di-highlight (gradient)</Label>
                <Input 
                  value={settings.heroHighlight || ''} 
                  onChange={(e) => setSettings({ ...settings, heroHighlight: e.target.value })}
                  placeholder="Mudah dan Praktis"
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea 
                  value={settings.heroDescription || ''} 
                  onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                  placeholder="Dibimbing langsung oleh praktisi..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tombol Utama</Label>
                  <Input 
                    value={settings.heroCtaText || ''} 
                    onChange={(e) => setSettings({ ...settings, heroCtaText: e.target.value })}
                    placeholder="Mulai Belajar Sekarang"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tombol Sekunder</Label>
                  <Input 
                    value={settings.heroCtaSecondaryText || ''} 
                    onChange={(e) => setSettings({ ...settings, heroCtaSecondaryText: e.target.value })}
                    placeholder="Lihat Fitur"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Fitur</CardTitle>
              <CardDescription>Daftar keunggulan layanan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Section</Label>
                  <Input 
                    value={settings.featuresTitle || ''} 
                    onChange={(e) => setSettings({ ...settings, featuresTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input 
                    value={settings.featuresSubtitle || ''} 
                    onChange={(e) => setSettings({ ...settings, featuresSubtitle: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Fitur</CardTitle>
                <CardDescription>Tambah atau edit fitur yang ditampilkan</CardDescription>
              </div>
              <Button onClick={addFeature} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Fitur
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(settings.featuresData || []).map((feature, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-500">Fitur #{index + 1}</span>
                    <Button onClick={() => removeFeature(index)} variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Icon (emoji)</Label>
                      <Input 
                        value={feature.icon} 
                        onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                        className="text-2xl text-center"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Judul</Label>
                      <Input 
                        value={feature.title} 
                        onChange={(e) => updateFeature(index, 'title', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Deskripsi</Label>
                    <Textarea 
                      value={feature.description} 
                      onChange={(e) => updateFeature(index, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Harga</CardTitle>
              <CardDescription>Pengaturan tampilan paket membership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Section</Label>
                  <Input 
                    value={settings.pricingTitle || ''} 
                    onChange={(e) => setSettings({ ...settings, pricingTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input 
                    value={settings.pricingSubtitle || ''} 
                    onChange={(e) => setSettings({ ...settings, pricingSubtitle: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-4 pb-2">
                <Switch 
                  checked={settings.pricingShowFromDb ?? true} 
                  onCheckedChange={(checked) => setSettings({ ...settings, pricingShowFromDb: checked })}
                />
                <Label>Ambil data harga dari database Membership</Label>
              </div>
              
              {settings.pricingShowFromDb && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    Paket membership yang akan ditampilkan di halaman utama:
                  </p>
                  {memberships.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {memberships.map((m) => (
                        <div key={m.id} className={`p-3 bg-white rounded-lg border ${m.isFeatured ? 'border-blue-500' : 'border-gray-200'}`}>
                          <div className="font-medium text-sm">{m.name}</div>
                          <div className="text-lg font-bold">Rp {m.price.toLocaleString('id-ID')}</div>
                          <div className="text-xs text-gray-500">{m.durationDays} hari</div>
                          {m.isFeatured && <span className="text-xs text-blue-600">⭐ Featured</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Belum ada membership aktif</p>
                  )}
                  <Link href="/admin/membership" className="text-sm text-blue-600 hover:underline mt-3 inline-block">
                    Kelola Membership →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Testimoni</CardTitle>
              <CardDescription>Pengaturan section testimoni</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Judul Section</Label>
                  <Input 
                    value={settings.testimonialsTitle || ''} 
                    onChange={(e) => setSettings({ ...settings, testimonialsTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input 
                    value={settings.testimonialsSubtitle || ''} 
                    onChange={(e) => setSettings({ ...settings, testimonialsSubtitle: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Testimoni</CardTitle>
                <CardDescription>Tambah atau edit testimoni</CardDescription>
              </div>
              <Button onClick={addTestimonial} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Testimoni
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(settings.testimonialsData || []).map((testimonial, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-500">Testimoni #{index + 1}</span>
                    <Button onClick={() => removeTestimonial(index)} variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nama</Label>
                      <Input 
                        value={testimonial.name} 
                        onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Pekerjaan/Role</Label>
                      <Input 
                        value={testimonial.role} 
                        onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">URL Avatar (opsional)</Label>
                    <Input 
                      value={testimonial.avatar} 
                      onChange={(e) => updateTestimonial(index, 'avatar', e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Isi Testimoni</Label>
                    <Textarea 
                      value={testimonial.content} 
                      onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section FAQ</CardTitle>
              <CardDescription>Pengaturan section FAQ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Section</Label>
                <Input 
                  value={settings.faqTitle || ''} 
                  onChange={(e) => setSettings({ ...settings, faqTitle: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar FAQ</CardTitle>
                <CardDescription>Tambah atau edit pertanyaan</CardDescription>
              </div>
              <Button onClick={addFaq} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Tambah FAQ
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(settings.faqData || []).map((faq, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-500">FAQ #{index + 1}</span>
                    <Button onClick={() => removeFaq(index)} variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pertanyaan</Label>
                    <Input 
                      value={faq.question} 
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Jawaban</Label>
                    <Textarea 
                      value={faq.answer} 
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Footer & CTA Tab */}
        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section CTA (Call to Action)</CardTitle>
              <CardDescription>Section ajakan bergabung sebelum footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul CTA</Label>
                <Input 
                  value={settings.ctaTitle || ''} 
                  onChange={(e) => setSettings({ ...settings, ctaTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi CTA</Label>
                <Textarea 
                  value={settings.ctaDescription || ''} 
                  onChange={(e) => setSettings({ ...settings, ctaDescription: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Teks Tombol CTA</Label>
                <Input 
                  value={settings.ctaButtonText || ''} 
                  onChange={(e) => setSettings({ ...settings, ctaButtonText: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Statistik CTA</CardTitle>
                <CardDescription>Angka-angka yang ditampilkan di section CTA</CardDescription>
              </div>
              <Button onClick={addStat} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Statistik
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {(settings.ctaStats || []).map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Nilai</Label>
                    <Input 
                      value={stat.value} 
                      onChange={(e) => updateStat(index, 'value', e.target.value)}
                      placeholder="7,000+"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input 
                      value={stat.label} 
                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                      placeholder="Member Aktif"
                    />
                  </div>
                  <Button onClick={() => removeStat(index)} variant="ghost" size="sm" className="text-red-500 mt-5">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Footer</CardTitle>
              <CardDescription>Pengaturan bagian footer website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Deskripsi Singkat</Label>
                <Textarea 
                  value={settings.footerDescription || ''} 
                  onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Kontak</Label>
                  <Input 
                    value={settings.footerEmail || ''} 
                    onChange={(e) => setSettings({ ...settings, footerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor WhatsApp</Label>
                  <Input 
                    value={settings.footerPhone || ''} 
                    onChange={(e) => setSettings({ ...settings, footerPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alamat (opsional)</Label>
                <Textarea 
                  value={settings.footerAddress || ''} 
                  onChange={(e) => setSettings({ ...settings, footerAddress: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-3 block">Social Media Links</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Instagram</Label>
                    <Input 
                      value={settings.footerSocialLinks?.instagram || ''} 
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        footerSocialLinks: { ...settings.footerSocialLinks, instagram: e.target.value }
                      })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Facebook</Label>
                    <Input 
                      value={settings.footerSocialLinks?.facebook || ''} 
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        footerSocialLinks: { ...settings.footerSocialLinks, facebook: e.target.value }
                      })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">YouTube</Label>
                    <Input 
                      value={settings.footerSocialLinks?.youtube || ''} 
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        footerSocialLinks: { ...settings.footerSocialLinks, youtube: e.target.value }
                      })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">TikTok</Label>
                    <Input 
                      value={settings.footerSocialLinks?.tiktok || ''} 
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        footerSocialLinks: { ...settings.footerSocialLinks, tiktok: e.target.value }
                      })}
                      placeholder="https://tiktok.com/..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-xl">
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  )
}
