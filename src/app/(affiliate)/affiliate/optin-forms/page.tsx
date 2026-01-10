'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import FeatureLock from '@/components/affiliate/FeatureLock'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  ClipboardList, Plus, Edit, Trash2, Copy, ExternalLink, Eye, Smartphone, Monitor, Check, X,
  FileText, MousePointerClick, Clock, Gift, HelpCircle, Sparkles, Users, TrendingUp,
  Type, Mail, Phone, ChevronDown, CheckSquare, Image as ImageIcon, Minus, Timer, AlignLeft,
  GripVertical, Save, Download
} from 'lucide-react'

interface FormElement {
  id: string
  type: 'text' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'heading' | 'paragraph' | 'image' | 'divider' | 'countdown'
  label?: string
  placeholder?: string
  helperText?: string
  required?: boolean
  validation?: boolean
  options?: string[]
  content?: string
  imageUrl?: string
  level?: number
}

interface OptinForm {
  id: string
  slug: string | null
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
  submissionCount: number
  viewCount: number
  isActive: boolean
  bannerBadgeText: string | null
  primaryColor: string | null
  secondaryColor: string | null
  showCountdown: boolean
  countdownEndDate: string | null
  leadMagnetId: string | null
  benefits: any
  faqs: any
  _count?: {
    leads: number
  }
}

function SortableElement({ element, onSelect, onDelete, isSelected }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: element.id })
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1
  }
  
  const getIcon = () => {
    switch (element.type) {
      case 'text': return <Type className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'phone': return <Phone className="h-4 w-4" />
      case 'dropdown': return <ChevronDown className="h-4 w-4" />
      case 'checkbox': return <CheckSquare className="h-4 w-4" />
      case 'heading': return <Type className="h-4 w-4 font-bold" />
      case 'paragraph': return <AlignLeft className="h-4 w-4" />
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'divider': return <Minus className="h-4 w-4" />
      case 'countdown': return <Timer className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group bg-white border-2 rounded-lg p-3 mb-2 transition-all ${
        isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300'
      } ${isDragging ? 'shadow-2xl ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
          title="Drag untuk pindahkan"
        >
          <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </div>
        <div className="flex items-center gap-2 flex-1" onClick={() => onSelect(element)}>
          {getIcon()}
          <div className="flex-1 cursor-pointer">
            <p className="text-sm font-medium">{element.label || element.content || element.type}</p>
            {element.placeholder && <p className="text-xs text-gray-500">{element.placeholder}</p>}
          </div>
        </div>
        {element.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" 
          onClick={(e) => { e.stopPropagation(); onDelete(element.id) }}
          title="Hapus element"
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>
    </div>
  )
}

export default function OptinFormsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [forms, setForms] = useState<OptinForm[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState<OptinForm | null>(null)
  const [deletingForm, setDeletingForm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [formElements, setFormElements] = useState<FormElement[]>([])
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null)
  const [builderTab, setBuilderTab] = useState<'form' | 'thankyou'>('form')
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const [formName, setFormName] = useState('')
  const [headline, setHeadline] = useState('')
  const [description, setDescription] = useState('')
  const [badgeText, setBadgeText] = useState('Event Terbatas - Daftar Sekarang!')
  const [submitButtonText, setSubmitButtonText] = useState('Daftar Sekarang')
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#4f46e5')
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownEndDate, setCountdownEndDate] = useState('')
  const [benefits, setBenefits] = useState<string[]>([])
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([])
  const [redirectType, setRedirectType] = useState('message')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [redirectWhatsapp, setRedirectWhatsapp] = useState('')
  const [successMessage, setSuccessMessage] = useState('Terima kasih! Data Anda telah kami terima.')
  const [thankYouHeadline, setThankYouHeadline] = useState("You're In! 🎉")
  const [thankYouDescription, setThankYouDescription] = useState('Selamat! Pendaftaran Anda berhasil.')
  const [thankYouCtaText, setThankYouCtaText] = useState('Gabung Komunitas')
  const [thankYouCtaUrl, setThankYouCtaUrl] = useState('')
  const [showSocialProof, setShowSocialProof] = useState(true)
  
  // Lead Magnet state
  const [leadMagnets, setLeadMagnets] = useState<any[]>([])
  const [selectedLeadMagnet, setSelectedLeadMagnet] = useState<string>('none')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum 8px movement untuk activate drag
      },
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates 
    })
  )

  useEffect(() => {
    fetchForms()
    fetchLeadMagnets()
  }, [])

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/affiliate/optin-forms')
      const data = await res.json()
      if (res.ok) setForms(data.optinForms)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadMagnets = async () => {
    try {
      const res = await fetch('/api/affiliate/lead-magnets')
      const data = await res.json()
      if (res.ok) setLeadMagnets(data.leadMagnets || [])
    } catch (error) {
      console.error('Failed to fetch lead magnets:', error)
    }
  }

  const handleOpenBuilder = (form?: OptinForm) => {
    // Redirect to builder page
    if (form) {
      router.push(`/affiliate/optin-forms/builder?id=${form.id}`)
    } else {
      router.push('/affiliate/optin-forms/builder')
    }
  }

  const resetForm = () => {
    setFormName('')
    setHeadline('')
    setDescription('')
    setBadgeText('Event Terbatas - Daftar Sekarang!')
    setSubmitButtonText('Daftar Sekarang')
    setPrimaryColor('#2563eb')
    setSecondaryColor('#4f46e5')
    setShowCountdown(false)
    setCountdownEndDate('')
    setBenefits([])
    setFaqs([])
    setRedirectType('message')
    setRedirectUrl('')
    setRedirectWhatsapp('')
    setSuccessMessage('Terima kasih! Data Anda telah kami terima.')
    setThankYouHeadline("You're In! 🎉")
    setThankYouDescription('Selamat! Pendaftaran Anda berhasil.')
    setThankYouCtaText('Gabung Komunitas')
    setThankYouCtaUrl('')
    setShowSocialProof(true)
    setSelectedLeadMagnet('none')
    setFormElements([])
    setSelectedElement(null)
  }

  const addElement = (type: FormElement['type']) => {
    const labels: Record<string, string> = {
      text: 'Text Field', email: 'Email', phone: 'WhatsApp', dropdown: 'Dropdown',
      checkbox: 'Checkbox', heading: 'Heading', paragraph: 'Paragraph', image: 'Image',
      divider: 'Divider', countdown: 'Countdown Timer'
    }
    const newElement: FormElement = {
      id: `element-${Date.now()}`,
      type,
      label: labels[type],
      placeholder: type === 'email' ? 'email@example.com' : type === 'phone' ? '628123456789' : '',
      required: false,
      validation: type === 'email' || type === 'phone',
    }
    setFormElements([...formElements, newElement])
    setSelectedElement(newElement)
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setFormElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
    
    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const updateSelectedElement = (updates: Partial<FormElement>) => {
    if (!selectedElement) return
    setFormElements(formElements.map(el => el.id === selectedElement.id ? { ...el, ...updates } : el))
    setSelectedElement({ ...selectedElement, ...updates })
  }

  const deleteElement = (id: string) => {
    setFormElements(formElements.filter(el => el.id !== id))
    if (selectedElement?.id === id) setSelectedElement(null)
  }

  const handleSave = async () => {
    if (!formName.trim() || !headline.trim()) {
      toast.error('Nama form dan headline harus diisi')
      return
    }

    setSaving(true)
    try {
      const collectName = formElements.some(el => el.type === 'text' && el.label?.toLowerCase().includes('nama'))
      const collectEmail = formElements.some(el => el.type === 'email')
      const collectPhone = formElements.some(el => el.type === 'phone')

      const payload = {
        formName, headline, description, bannerBadgeText: badgeText, submitButtonText,
        primaryColor, secondaryColor, showCountdown,
        countdownEndDate: showCountdown ? countdownEndDate : null,
        benefits, faqs, redirectType, redirectUrl, redirectWhatsapp, successMessage,
        collectName, collectEmail, collectPhone,
        leadMagnetId: selectedLeadMagnet === 'none' ? null : selectedLeadMagnet,
      }

      const url = editingForm ? `/api/affiliate/optin-forms/${editingForm.id}` : '/api/affiliate/optin-forms'
      const res = await fetch(url, {
        method: editingForm ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success(editingForm ? 'Form berhasil diupdate!' : 'Form berhasil dibuat!')
        setShowBuilder(false)
        await fetchForms()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan form')
      }
    } catch (error) {
      console.error(error)
      toast.error('Gagal menyimpan form')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (formId: string) => {
    try {
      const res = await fetch(`/api/affiliate/optin-forms/${formId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Form berhasil dihapus!')
        setDeletingForm(null)
        await fetchForms()
      } else {
        toast.error('Gagal menghapus form')
      }
    } catch (error) {
      toast.error('Gagal menghapus form')
    }
  }

  const copyFormLink = (form: OptinForm) => {
    const link = `${window.location.origin}/optin/${form.slug || form.id}`
    navigator.clipboard.writeText(link)
    toast.success('Link form berhasil disalin!')
  }

  const exportLeads = async (formId: string, formName: string) => {
    try {
      toast.info('Mengunduh data leads...')
      const response = await fetch(`/api/affiliate/optin-forms/${formId}/export`)
      
      if (!response.ok) {
        throw new Error('Failed to export')
      }
      
      // Get blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${formName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Data leads berhasil diunduh!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal mengunduh data leads')
    }
  }

  const calculateConversionRate = (form: OptinForm) => {
    // Use real viewCount, fallback to estimation if viewCount is 0
    const views = form.viewCount > 0 ? form.viewCount : (form.submissionCount * 3 || 1)
    return ((form.submissionCount / views) * 100).toFixed(1)
  }

  const inputComponents = [
    { type: 'text' as const, icon: Type, label: 'Text Input', desc: 'Field teks biasa' },
    { type: 'email' as const, icon: Mail, label: 'Email Input', desc: 'Field email' },
    { type: 'phone' as const, icon: Phone, label: 'Phone / WhatsApp', desc: 'Field nomor telepon' },
    { type: 'dropdown' as const, icon: ChevronDown, label: 'Dropdown', desc: 'Pilihan dropdown' },
    { type: 'checkbox' as const, icon: CheckSquare, label: 'Checkbox', desc: 'Checkbox pilihan' },
  ]

  const contentComponents = [
    { type: 'heading' as const, icon: Type, label: 'Heading', desc: 'Judul section' },
    { type: 'paragraph' as const, icon: AlignLeft, label: 'Paragraph', desc: 'Teks paragraf' },
    { type: 'image' as const, icon: ImageIcon, label: 'Image / Cover', desc: 'Gambar banner' },
    { type: 'divider' as const, icon: Minus, label: 'Divider', desc: 'Garis pembatas' },
    { type: 'countdown' as const, icon: Timer, label: 'Countdown Timer', desc: 'Timer hitung mundur' },
  ]

  if (loading) {
    return (
      <ResponsivePageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Memuat Optin Forms...</p>
          </div>
        </div>
      </ResponsivePageWrapper>
    )
  }

  if (showBuilder) {
    return (
      <FeatureLock feature="optin-forms">
        <div className="h-screen flex flex-col bg-gray-50">
          <div className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowBuilder(false)}>
                <X className="h-4 w-4 mr-2" />
                Tutup
              </Button>
              <div className="border-l pl-4">
                <h2 className="font-semibold text-lg">{formName || 'Untitled Form'}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{editingForm?.submissionCount || 0} leads</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{editingForm ? calculateConversionRate(editingForm) : '0'}% conversion</span>
                  <Badge variant={editingForm?.isActive ? 'default' : 'secondary'} className="text-xs">{editingForm?.isActive ? 'Published' : 'Draft'}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => editingForm && copyFormLink(editingForm)}>
                <Copy className="h-4 w-4 mr-2" />Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={() => editingForm && window.open(`/optin/${editingForm.slug || editingForm.id}`, '_blank')}>
                <Eye className="h-4 w-4 mr-2" />Preview
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />{saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-64 bg-white border-r flex flex-col flex-shrink-0">
              <Tabs value={builderTab} onValueChange={(v) => setBuilderTab(v as 'form' | 'thankyou')} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 m-4 flex-shrink-0">
                  <TabsTrigger value="form">Form</TabsTrigger>
                  <TabsTrigger value="thankyou">Thank You</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form" className="flex-1 mt-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Input Fields</h3>
                        <div className="space-y-1">
                          {inputComponents.map((comp) => (
                            <button key={comp.type} onClick={() => addElement(comp.type)} className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <comp.icon className="h-4 w-4 text-gray-600" />
                                <div>
                                  <p className="text-sm font-medium">{comp.label}</p>
                                  <p className="text-xs text-gray-500">{comp.desc}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Content & Layout</h3>
                        <div className="space-y-1">
                          {contentComponents.map((comp) => (
                            <button key={comp.type} onClick={() => addElement(comp.type)} className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <comp.icon className="h-4 w-4 text-gray-600" />
                                <div>
                                  <p className="text-sm font-medium">{comp.label}</p>
                                  <p className="text-xs text-gray-500">{comp.desc}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="thankyou" className="flex-1 mt-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-800">Kustomisasi halaman setelah submit berhasil</p>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Headline</Label>
                        <Input value={thankYouHeadline} onChange={(e) => setThankYouHeadline(e.target.value)} placeholder="You're In! 🎉" className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Deskripsi</Label>
                        <Textarea value={thankYouDescription} onChange={(e) => setThankYouDescription(e.target.value)} placeholder="Selamat! Pendaftaran Anda berhasil..." rows={3} className="text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">CTA Button Text</Label>
                        <Input value={thankYouCtaText} onChange={(e) => setThankYouCtaText(e.target.value)} placeholder="Gabung Komunitas" className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">CTA Button URL</Label>
                        <Input value={thankYouCtaUrl} onChange={(e) => setThankYouCtaUrl(e.target.value)} placeholder="https://wa.me/628xxx" className="h-9" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <Label className="text-xs">Social Proof</Label>
                        <Switch checked={showSocialProof} onCheckedChange={setShowSocialProof} />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-6 overflow-auto">
              <div className="mb-4 flex items-center justify-center gap-2 flex-shrink-0">
                <Button variant={previewMode === 'mobile' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewMode('mobile')}>
                  <Smartphone className="h-4 w-4 mr-2" />Mobile
                </Button>
                <Button variant={previewMode === 'desktop' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewMode('desktop')}>
                  <Monitor className="h-4 w-4 mr-2" />Desktop
                </Button>
              </div>

              <div className={`mx-auto ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-2xl'}`}>
                {builderTab === 'form' ? (
                  <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="text-white p-6" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                      {badgeText && (
                        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          <span className="text-xs font-medium">{badgeText}</span>
                        </div>
                      )}
                      <h2 className="text-xl font-bold mb-2">{headline || 'Headline Form Anda'}</h2>
                      {description && <p className="text-sm text-blue-100">{description}</p>}
                    </div>

                    <div className="p-6">
                      <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                      >
                        <SortableContext items={formElements.map(el => el.id)} strategy={verticalListSortingStrategy}>
                          {formElements.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                              <MousePointerClick className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500 text-sm">Tambahkan komponen dari sidebar kiri</p>
                            </div>
                          ) : (
                            formElements.map((element) => (
                              <SortableElement key={element.id} element={element} onSelect={setSelectedElement} onDelete={deleteElement} isSelected={selectedElement?.id === element.id} />
                            ))
                          )}
                        </SortableContext>
                        
                        <DragOverlay>
                          {activeId ? (
                            <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-2xl opacity-90">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">
                                  {formElements.find(el => el.id === activeId)?.label || 'Element'}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>

                      <Button className="w-full mt-4 h-11" style={{ backgroundColor: primaryColor }} disabled>{submitButtonText}</Button>

                      {benefits.length > 0 && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Gift className="h-4 w-4 text-green-600" />Apa Yang Anda Dapatkan
                          </h4>
                          <ul className="space-y-2">
                            {benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />{benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {faqs.length > 0 && (
                        <div className="mt-6 space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-amber-600" />FAQ
                          </h4>
                          {faqs.map((faq, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded border">
                              <p className="text-sm font-medium mb-1">{faq.question}</p>
                              <p className="text-xs text-gray-600">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-xl p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{thankYouHeadline}</h2>
                      <p className="text-gray-600 mb-6">{thankYouDescription}</p>
                      {thankYouCtaText && <Button className="h-11 px-8" style={{ backgroundColor: primaryColor }} disabled>{thankYouCtaText}</Button>}
                      {showSocialProof && (
                        <div className="mt-8 pt-6 border-t">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex -space-x-2">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">+500 orang sudah bergabung</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-80 bg-white border-l overflow-auto flex-shrink-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {builderTab === 'form' && selectedElement ? (
                    <>
                      <div className="pb-3 border-b">
                        <h3 className="font-semibold mb-1">Field Settings</h3>
                        <p className="text-xs text-gray-500">Kustomisasi field yang dipilih</p>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Label</Label>
                        <Input value={selectedElement.label || ''} onChange={(e) => updateSelectedElement({ label: e.target.value })} placeholder="Label field" className="h-9" />
                      </div>
                      {['text', 'email', 'phone', 'dropdown'].includes(selectedElement.type) && (
                        <div>
                          <Label className="text-xs mb-1.5 block">Placeholder</Label>
                          <Input value={selectedElement.placeholder || ''} onChange={(e) => updateSelectedElement({ placeholder: e.target.value })} placeholder="Placeholder text" className="h-9" />
                        </div>
                      )}
                      <div>
                        <Label className="text-xs mb-1.5 block">Helper Text</Label>
                        <Input value={selectedElement.helperText || ''} onChange={(e) => updateSelectedElement({ helperText: e.target.value })} placeholder="Teks bantuan" className="h-9" />
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <Label className="text-xs">Required</Label>
                        <Switch checked={selectedElement.required || false} onCheckedChange={(checked) => updateSelectedElement({ required: checked })} />
                      </div>
                      {['email', 'phone'].includes(selectedElement.type) && (
                        <div className="flex items-center justify-between p-2 border rounded">
                          <Label className="text-xs">Validation</Label>
                          <Switch checked={selectedElement.validation || false} onCheckedChange={(checked) => updateSelectedElement({ validation: checked })} />
                        </div>
                      )}
                      {selectedElement.type === 'heading' && (
                        <>
                          <div>
                            <Label className="text-xs mb-1.5 block">Content</Label>
                            <Input value={selectedElement.content || ''} onChange={(e) => updateSelectedElement({ content: e.target.value })} placeholder="Heading text" className="h-9" />
                          </div>
                          <div>
                            <Label className="text-xs mb-1.5 block">Level</Label>
                            <Select value={String(selectedElement.level || 2)} onValueChange={(v) => updateSelectedElement({ level: parseInt(v) })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">H1</SelectItem>
                                <SelectItem value="2">H2</SelectItem>
                                <SelectItem value="3">H3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {selectedElement.type === 'paragraph' && (
                        <div>
                          <Label className="text-xs mb-1.5 block">Content</Label>
                          <Textarea value={selectedElement.content || ''} onChange={(e) => updateSelectedElement({ content: e.target.value })} placeholder="Paragraph text" rows={4} className="text-sm" />
                        </div>
                      )}
                      {selectedElement.type === 'image' && (
                        <div>
                          <Label className="text-xs mb-1.5 block">Image URL</Label>
                          <Input value={selectedElement.imageUrl || ''} onChange={(e) => updateSelectedElement({ imageUrl: e.target.value })} placeholder="https://..." className="h-9" />
                          <p className="text-xs text-gray-500 mt-1">URL gambar dari admin</p>
                        </div>
                      )}
                      {selectedElement.type === 'dropdown' && (
                        <div>
                          <Label className="text-xs mb-1.5 block">Options (comma separated)</Label>
                          <Textarea value={selectedElement.options?.join(', ') || ''} onChange={(e) => updateSelectedElement({ options: e.target.value.split(',').map(s => s.trim()) })} placeholder="Option 1, Option 2, Option 3" rows={3} className="text-sm" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="pb-3 border-b">
                        <h3 className="font-semibold mb-1">Form Settings</h3>
                        <p className="text-xs text-gray-500">Pengaturan umum form</p>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Nama Form *</Label>
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama internal form" className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Headline *</Label>
                        <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Judul yang menarik" className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Deskripsi</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat" rows={2} className="text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Badge Text</Label>
                        <Input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="Event Terbatas" className="h-9" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Submit Button Text</Label>
                        <Input value={submitButtonText} onChange={(e) => setSubmitButtonText(e.target.value)} placeholder="Daftar Sekarang" className="h-9" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs mb-1.5 block">Primary Color</Label>
                          <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 p-1" />
                        </div>
                        <div>
                          <Label className="text-xs mb-1.5 block">Secondary Color</Label>
                          <Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 p-1" />
                        </div>
                      </div>
                      <div className="border-t pt-4 space-y-3">
                        <Label className="text-xs font-semibold">Lead Magnet (Opsional)</Label>
                        <Select value={selectedLeadMagnet} onValueChange={setSelectedLeadMagnet}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pilih lead magnet (opsional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tidak ada lead magnet</SelectItem>
                            {leadMagnets.map((lm) => (
                              <SelectItem key={lm.id} value={lm.id}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                    {lm.type}
                                  </span>
                                  <span>{lm.title}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedLeadMagnet && selectedLeadMagnet !== 'none' && leadMagnets.find(lm => lm.id === selectedLeadMagnet)?.description && (
                          <p className="text-xs text-gray-500">
                            {leadMagnets.find(lm => lm.id === selectedLeadMagnet)?.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Lead magnet akan dikirim otomatis setelah form disubmit
                        </p>
                      </div>
                      <div className="border-t pt-4 space-y-3">
                        <Label className="text-xs font-semibold">After Submit Action</Label>
                        <Select value={redirectType} onValueChange={setRedirectType}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="message">Show Success Message</SelectItem>
                            <SelectItem value="url">Redirect to URL</SelectItem>
                            <SelectItem value="whatsapp">Redirect to WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                        {redirectType === 'message' && <Textarea value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} placeholder="Success message" rows={2} className="text-sm" />}
                        {redirectType === 'url' && <Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://..." className="h-9" />}
                        {redirectType === 'whatsapp' && <Input value={redirectWhatsapp} onChange={(e) => setRedirectWhatsapp(e.target.value)} placeholder="628123456789" className="h-9" />}
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-xs font-semibold">Benefits</Label>
                          <Button size="sm" variant="outline" onClick={() => setBenefits([...benefits, ''])} className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {benefits.map((benefit, i) => (
                            <div key={i} className="flex gap-1">
                              <Input value={benefit} onChange={(e) => { const newBenefits = [...benefits]; newBenefits[i] = e.target.value; setBenefits(newBenefits) }} placeholder="Benefit..." className="h-8 text-sm flex-1" />
                              <Button size="sm" variant="ghost" onClick={() => setBenefits(benefits.filter((_, idx) => idx !== i))} className="h-8 w-8 p-0">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-xs font-semibold">FAQs</Label>
                          <Button size="sm" variant="outline" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])} className="h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {faqs.map((faq, i) => (
                            <div key={i} className="p-2 bg-gray-50 rounded border space-y-1">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-gray-500">FAQ #{i + 1}</Label>
                                <Button size="sm" variant="ghost" onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))} className="h-5 w-5 p-0">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input value={faq.question} onChange={(e) => { const newFaqs = [...faqs]; newFaqs[i].question = e.target.value; setFaqs(newFaqs) }} placeholder="Question..." className="h-7 text-xs" />
                              <Textarea value={faq.answer} onChange={(e) => { const newFaqs = [...faqs]; newFaqs[i].answer = e.target.value; setFaqs(newFaqs) }} placeholder="Answer..." rows={2} className="text-xs" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </FeatureLock>
    )
  }

  return (
    <FeatureLock feature="optin-forms">
      <ResponsivePageWrapper>
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Optin Forms</h1>
                  <p className="text-sm text-gray-600">Buat form untuk mengumpulkan leads</p>
                </div>
              </div>
              <Button onClick={() => handleOpenBuilder()}>
                <Plus className="h-4 w-4 mr-2" />Buat Form Baru
              </Button>
            </div>
          </div>

          {forms.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded"><FileText className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Total Forms</p>
                    <p className="text-xl font-bold">{forms.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded"><Eye className="h-5 w-5 text-purple-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Total Views</p>
                    <p className="text-xl font-bold">{forms.reduce((acc, f) => acc + (f.viewCount || 0), 0)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded"><Users className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Total Leads</p>
                    <p className="text-xl font-bold">{forms.reduce((acc, f) => acc + f.submissionCount, 0)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded"><Check className="h-5 w-5 text-indigo-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Aktif</p>
                    <p className="text-xl font-bold">{forms.filter(f => f.isActive).length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Conversion</p>
                    <p className="text-xl font-bold">
                      {forms.length > 0 ? (forms.reduce((acc, f) => acc + parseFloat(calculateConversionRate(f)), 0) / forms.length).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {forms.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center max-w-md mx-auto">
                  <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                    <ClipboardList className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Belum ada Optin Form</h3>
                  <p className="text-gray-500 text-sm mb-6">Buat form pertama Anda untuk mulai mengumpulkan leads</p>
                  <Button onClick={() => handleOpenBuilder()}>
                    <Plus className="h-4 w-4 mr-2" />Buat Form Pertama
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <Card key={form.id} className="hover:shadow-lg transition-shadow">
                  <div className="h-2" style={{ background: `linear-gradient(90deg, ${form.primaryColor || '#2563eb'}, ${form.secondaryColor || '#4f46e5'})` }} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base mb-1 truncate">{form.formName}</CardTitle>
                        <CardDescription className="line-clamp-1 text-xs">{form.headline}</CardDescription>
                      </div>
                      <Badge variant={form.isActive ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {form.isActive ? 'Aktif' : 'Draft'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-purple-50 rounded p-2 text-center">
                          <p className="text-xs text-gray-500">Views</p>
                          <p className="text-lg font-bold text-purple-600">{form.viewCount || 0}</p>
                        </div>
                        <div className="bg-blue-50 rounded p-2 text-center">
                          <p className="text-xs text-gray-500">Leads</p>
                          <p className="text-lg font-bold text-blue-600">{form.submissionCount}</p>
                        </div>
                        <div className="bg-green-50 rounded p-2 text-center">
                          <p className="text-xs text-gray-500">Convert</p>
                          <p className="text-lg font-bold text-green-600">{calculateConversionRate(form)}%</p>
                        </div>
                        <div className="bg-amber-50 rounded p-2 text-center">
                          <p className="text-xs text-gray-500">Fields</p>
                          <p className="text-lg font-bold text-amber-600">
                            {[form.collectName, form.collectEmail, form.collectPhone].filter(Boolean).length}
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => copyFormLink(form)}>
                            <Copy className="h-4 w-4 mr-1" />Salin Link
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`/optin/${form.slug || form.id}`, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-1" />Preview
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={() => exportLeads(form.id, form.formName)} disabled={form.submissionCount === 0}>
                            <Download className="h-4 w-4 mr-1" />Export ({form.submissionCount})
                          </Button>
                          <Button size="sm" onClick={() => handleOpenBuilder(form)}>
                            <Edit className="h-4 w-4 mr-1" />Edit
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletingForm(form.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />Hapus Form
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <AlertDialog open={!!deletingForm} onOpenChange={() => setDeletingForm(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Optin Form?</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus form ini? Semua data submission akan tetap tersimpan di Leads.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={() => deletingForm && handleDelete(deletingForm)} className="bg-red-600 hover:bg-red-700">
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </ResponsivePageWrapper>
    </FeatureLock>
  )
}
