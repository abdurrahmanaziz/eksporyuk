'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, Mail, Phone, User, Calendar, 
  Clock, Send, Copy, ExternalLink, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, DollarSign, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

interface Lead {
  id: string
  customer: {
    name: string
    email: string
    phone: string
    whatsapp: string
  }
  membership: {
    id: string
    name: string
    price: number
  } | null
  amount: number
  status: string
  paymentUrl: string
  orderDate: string
  daysSinceOrder: number
  followUpTemplates: FollowUpTemplate[]
}

interface FollowUpTemplate {
  id: string
  title: string
  description: string
  emailSubject: string
  emailBody: string
  emailCTA: string
  emailCTALink: string
  whatsappMessage: string
  sequenceOrder: number
}

export default function AffiliateFollowUpPage() {
  const { data: session } = useSession()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FollowUpTemplate | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [statusFilter, page])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20'
      })
      
      const res = await fetch(`/api/affiliate/follow-ups/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else if (res.status === 404) {
        // Not an affiliate
        setLeads([])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Gagal memuat data leads')
    } finally {
      setLoading(false)
    }
  }

  const openFollowUpDialog = (lead: Lead) => {
    setSelectedLead(lead)
    // Auto-select template based on days since order
    const suitableTemplate = lead.followUpTemplates.find(
      t => t.sequenceOrder === Math.min(lead.daysSinceOrder + 1, lead.followUpTemplates.length)
    ) || lead.followUpTemplates[0]
    setSelectedTemplate(suitableTemplate || null)
    setFollowUpDialogOpen(true)
  }

  // Process template message with shortcodes
  const processMessage = (template: FollowUpTemplate, lead: Lead): string => {
    const firstName = lead.customer.name.split(' ')[0]
    
    return template.whatsappMessage
      .replace(/\{name\}/g, lead.customer.name)
      .replace(/\{first_name\}/g, firstName)
      .replace(/\{email\}/g, lead.customer.email)
      .replace(/\{phone\}/g, lead.customer.phone)
      .replace(/\{whatsapp\}/g, lead.customer.whatsapp)
      .replace(/\{plan_name\}/g, lead.membership?.name || 'Membership')
      .replace(/\{plan_price\}/g, formatPrice(lead.amount))
      .replace(/\{affiliate_name\}/g, session?.user?.name || 'Affiliate')
      .replace(/\{affiliate_whatsapp\}/g, '')
      .replace(/\{payment_link\}/g, lead.paymentUrl || '')
      .replace(/\{order_date\}/g, new Date(lead.orderDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
      .replace(/\{days_since_order\}/g, lead.daysSinceOrder + ' hari')
      .replace(/\{deadline\}/g, '')
  }

  const sendFollowUp = async (channel: 'EMAIL' | 'WHATSAPP') => {
    if (!selectedLead || !selectedTemplate) return

    if (channel === 'WHATSAPP') {
      // Process message with shortcodes
      const processedMessage = processMessage(selectedTemplate, selectedLead)
      
      // Open WhatsApp with pre-filled message
      const waNumber = selectedLead.customer.whatsapp.replace(/\D/g, '')
      const formattedNumber = waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber
      const waUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(processedMessage)}`
      window.open(waUrl, '_blank')
      
      // Log the follow up
      try {
        await fetch('/api/affiliate/follow-ups/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadEmail: selectedLead.customer.email,
            leadName: selectedLead.customer.name,
            followUpId: selectedTemplate.id,
            channel: 'WHATSAPP',
            transactionId: selectedLead.id,
          })
        })
      } catch (e) {
        // Silent fail for logging
      }
      
      toast.success('WhatsApp dibuka di tab baru')
      return
    }

    try {
      setSending(true)
      const res = await fetch('/api/affiliate/follow-ups/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadEmail: selectedLead.customer.email,
          leadName: selectedLead.customer.name,
          leadPhone: selectedLead.customer.phone,
          followUpId: selectedTemplate.id,
          emailSubject: selectedTemplate.emailSubject,
          emailBody: selectedTemplate.emailBody,
          emailCTA: selectedTemplate.emailCTA,
          emailCTALink: selectedTemplate.emailCTALink,
          channel: 'EMAIL',
          transactionId: selectedLead.id,
        })
      })

      if (res.ok) {
        toast.success('Email follow-up berhasil dikirim!')
        setFollowUpDialogOpen(false)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal mengirim email')
      }
    } catch (error) {
      console.error('Error sending follow-up:', error)
      toast.error('Gagal mengirim follow-up')
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} disalin`)
  }

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lead.customer.name.toLowerCase().includes(query) ||
      lead.customer.email.toLowerCase().includes(query) ||
      lead.customer.phone.includes(query)
    )
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysLabel = (days: number) => {
    if (days === 0) return 'Hari ini'
    if (days === 1) return 'Kemarin'
    return `${days} hari lalu`
  }

  if (!session?.user) {
    return (
      <ResponsivePageWrapper>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Silakan login terlebih dahulu</p>
          </CardContent>
        </Card>
      </ResponsivePageWrapper>
    )
  }

  return (
    <ResponsivePageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Follow Up Leads</h1>
            <p className="text-muted-foreground">
              Follow up lead Anda yang belum menyelesaikan pembayaran
            </p>
          </div>
          <Button onClick={fetchLeads} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Tips Card */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <p className="font-medium mb-1">Tips Follow Up yang Efektif</p>
              <ul className="list-disc list-inside space-y-1 text-orange-700 dark:text-orange-300">
                <li>Follow up dalam 24-48 jam pertama memiliki tingkat konversi tertinggi</li>
                <li>Gunakan WhatsApp untuk pendekatan personal yang lebih efektif</li>
                <li>Tawarkan bantuan, bukan hanya mengingatkan pembayaran</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, email, atau phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leads.filter(l => l.daysSinceOrder <= 1).length}</p>
                <p className="text-sm text-muted-foreground">Lead Baru (≤24 jam)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leads.filter(l => l.daysSinceOrder > 1 && l.daysSinceOrder <= 3).length}</p>
                <p className="text-sm text-muted-foreground">Perlu Follow Up (2-3 hari)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatPrice(leads.reduce((sum, l) => sum + l.amount, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Anda ({filteredLeads.length})</CardTitle>
            <CardDescription>
              Lead yang mendaftar melalui link affiliate Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Belum Ada Lead</h3>
                <p className="text-muted-foreground mb-4">
                  Bagikan link affiliate Anda untuk mendapatkan lead
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      lead.daysSinceOrder <= 1 
                        ? 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/10' 
                        : lead.daysSinceOrder <= 3 
                          ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/10'
                          : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{lead.customer.name}</span>
                          <Badge 
                            variant={
                              lead.daysSinceOrder <= 1 ? 'default' : 
                              lead.daysSinceOrder <= 3 ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {getDaysLabel(lead.daysSinceOrder)}
                          </Badge>
                          {lead.daysSinceOrder <= 1 && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              🔥 Hot Lead
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {lead.customer.email}
                          </span>
                          {lead.customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />
                              {lead.customer.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          {lead.membership && (
                            <Badge variant="outline">{lead.membership.name}</Badge>
                          )}
                          <span className="font-semibold text-primary">
                            {formatPrice(lead.amount)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDate(lead.orderDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {lead.paymentUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(lead.paymentUrl, 'Link pembayaran')}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => openFollowUpDialog(lead)}
                          className={lead.daysSinceOrder <= 1 && ['PENDING', 'EXPIRED'].includes(lead.status) ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          disabled={!['PENDING', 'EXPIRED'].includes(lead.status)}
                          title={!['PENDING', 'EXPIRED'].includes(lead.status) ? 'Follow up tidak tersedia untuk transaksi sukses/batal' : ''}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Follow Up
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow Up Dialog */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Follow Up - {selectedLead?.customer.name}</DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              {/* Lead Info */}
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    {selectedLead.customer.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    {selectedLead.customer.phone || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Membership:</span>{' '}
                    {selectedLead.membership?.name || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>{' '}
                    {formatPrice(selectedLead.amount)}
                  </div>
                </div>
                {selectedLead.paymentUrl && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">Link Bayar:</span>{' '}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => copyToClipboard(selectedLead.paymentUrl, 'Link')}
                    >
                      Copy Link <Copy className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Template Selection */}
              {selectedLead.followUpTemplates.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pilih Template</label>
                    <Select
                      value={selectedTemplate?.id}
                      onValueChange={(id) => {
                        const template = selectedLead.followUpTemplates.find(t => t.id === id)
                        setSelectedTemplate(template || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih template" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedLead.followUpTemplates.map((template, i) => (
                          <SelectItem key={template.id} value={template.id}>
                            {i + 1}. {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-4 mt-4">
                      {/* WhatsApp Only - Email sudah auto reminder */}
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <WhatsAppIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Preview Pesan WhatsApp</span>
                        </div>
                        {selectedTemplate.whatsappMessage ? (
                          <div className="whitespace-pre-wrap text-sm max-h-[250px] overflow-y-auto">
                            {processMessage(selectedTemplate, selectedLead)}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Template WhatsApp tidak tersedia untuk template ini
                          </p>
                        )}
                      </div>
                      
                      {selectedTemplate.whatsappMessage && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => copyToClipboard(processMessage(selectedTemplate, selectedLead), 'Pesan WhatsApp')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Pesan
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => sendFollowUp('WHATSAPP')}
                          >
                            <WhatsAppIcon className="h-4 w-4 mr-2" />
                            Buka WhatsApp
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        💡 WhatsApp akan terbuka dengan pesan yang sudah disiapkan. Email reminder otomatis sudah dikirim oleh sistem.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Tidak ada template follow-up untuk membership ini
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Anda masih bisa menghubungi lead secara langsung via WhatsApp
                  </p>
                  {selectedLead.customer.whatsapp && (
                    <Button 
                      className="mt-4 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        const waNumber = selectedLead.customer.whatsapp.replace(/\D/g, '')
                        const formattedNumber = waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber
                        window.open(`https://wa.me/${formattedNumber}`, '_blank')
                      }}
                    >
                      <WhatsAppIcon className="h-4 w-4 mr-2" />
                      Buka WhatsApp
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ResponsivePageWrapper>
  )
}
