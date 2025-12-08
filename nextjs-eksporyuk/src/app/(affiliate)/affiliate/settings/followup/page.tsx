'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Users, Clock, DollarSign, Loader2, Search, X } from 'lucide-react'
import { Card } from '@/components/ui/card'

type PendingLead = {
  id: string
  customerName: string
  customerEmail: string
  customerWhatsapp?: string
  amount: number
  createdAt: string
  metadata: any
  type: string
  membership?: {
    membership: {
      name: string
      reminders?: Array<{ title: string; message: string }> | null
    }
  } | null
  product?: {
    name: string
    reminders?: Array<{ title: string; message: string }> | null
  } | null
}

export default function AffiliateFollowUpPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<PendingLead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<PendingLead[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterHours, setFilterHours] = useState<'all' | '1' | '6' | '24'>('all')
  const [selectedLead, setSelectedLead] = useState<PendingLead | null>(null)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'AFFILIATE') {
      router.push('/dashboard')
    } else {
      fetchPendingLeads()
    }
  }, [session, status, router])

  useEffect(() => {
    filterLeads()
  }, [leads, searchTerm, filterHours])

  const fetchPendingLeads = async () => {
    try {
      const res = await fetch('/api/affiliate/pending-leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLeads = () => {
    let filtered = [...leads]

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterHours !== 'all') {
      const now = new Date().getTime()
      const hoursMs = parseInt(filterHours) * 60 * 60 * 1000
      filtered = filtered.filter(lead => {
        const createdAt = new Date(lead.createdAt).getTime()
        return (now - createdAt) >= hoursMs
      })
    }

    setFilteredLeads(filtered)
  }

  const getHoursSinceCreated = (createdAt: string) => {
    const now = new Date().getTime()
    const created = new Date(createdAt).getTime()
    const hours = Math.floor((now - created) / (1000 * 60 * 60))
    return hours
  }

  const handleWhatsAppFollowUp = (lead: PendingLead) => {
    // Get reminders from product/membership
    let reminders: Array<{ title: string; message: string }> = []
    
    if (lead.type === 'MEMBERSHIP' && lead.membership?.membership) {
      reminders = lead.membership.membership.reminders || []
    } else if (lead.type === 'PRODUCT' && lead.product) {
      reminders = lead.product.reminders || []
    }

    if (reminders.length === 0) {
      // No reminders set, use default message
      const hours = getHoursSinceCreated(lead.createdAt)
      const paymentUrl = `${window.location.origin}/payment/va/${lead.id}`
      const message = `Halo ${lead.customerName}! 👋

Saya dari tim Ekspor Yuk, melihat pembayaran Anda sebesar Rp ${lead.amount.toLocaleString('id-ID')} masih pending sejak ${hours} jam yang lalu.

Ada kendala dengan pembayaran? Saya siap membantu! 😊

Link pembayaran:
${paymentUrl}

Terima kasih! 🙏`

      const whatsapp = lead.customerWhatsapp || lead.metadata?.customerWhatsapp
      const phone = whatsapp?.replace(/\D/g, '') || ''
      
      if (phone) {
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
      } else {
        alert('Nomor WhatsApp customer tidak tersedia')
      }
    } else {
      // Show reminder selection modal
      setSelectedLead(lead)
      setReminderModalOpen(true)
    }
  }

  const sendWhatsAppWithReminder = (lead: PendingLead, reminderMessage: string, productName: string) => {
    const paymentUrl = `${window.location.origin}/payment/va/${lead.id}`
    let message = reminderMessage
      .replace(/{name}/g, lead.customerName)
      .replace(/{amount}/g, `Rp ${lead.amount.toLocaleString('id-ID')}`)
      .replace(/{paymentUrl}/g, paymentUrl)
      .replace(/{product}/g, productName)

    const whatsapp = lead.customerWhatsapp || lead.metadata?.customerWhatsapp
    const phone = whatsapp?.replace(/\D/g, '') || ''
    
    if (phone) {
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      window.open(waUrl, '_blank')
      setReminderModalOpen(false)
      setSelectedLead(null)
    } else {
      alert('Nomor WhatsApp customer tidak tersedia')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Follow-up Leads</h1>
        <p className="text-gray-600 mt-1">Hubungi customer yang belum menyelesaikan pembayaran melalui WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">&gt; 1 Jam</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => getHoursSinceCreated(l.createdAt) >= 1).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">&gt; 24 Jam</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => getHoursSinceCreated(l.createdAt) >= 24).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-lg font-bold text-gray-900">
                Rp {leads.reduce((sum, l) => sum + l.amount, 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau email customer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterHours('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterHours === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterHours('1')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterHours === '1'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              &gt; 1 Jam
            </button>
            <button
              onClick={() => setFilterHours('6')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterHours === '6'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              &gt; 6 Jam
            </button>
            <button
              onClick={() => setFilterHours('24')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterHours === '24'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              &gt; 24 Jam
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Pending Leads ({filteredLeads.length})
        </h2>
        
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchTerm || filterHours !== 'all' 
                ? 'Tidak ada leads yang sesuai filter'
                : 'Belum ada pending leads'}
            </p>
            <p className="text-sm text-gray-400">
              Semua customer telah menyelesaikan pembayaran atau belum ada transaksi
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => {
              const hours = getHoursSinceCreated(lead.createdAt)
              const urgencyColor = hours >= 24 ? 'red' : hours >= 6 ? 'orange' : 'yellow'
              
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{lead.customerName}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded bg-${urgencyColor}-100 text-${urgencyColor}-700`}>
                        {hours} jam yang lalu
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{lead.customerEmail}</p>
                    <p className="text-lg font-bold text-green-600">
                      Rp {lead.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleWhatsAppFollowUp(lead)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Follow-up via WA
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Tips Follow-up yang Efektif
        </h3>
        <ul className="space-y-2 text-sm text-green-800">
          <li>✅ <strong>Respons cepat:</strong> Follow-up dalam 1-6 jam untuk conversion terbaik</li>
          <li>✅ <strong>Personal & ramah:</strong> Gunakan nama customer dan tone yang friendly</li>
          <li>✅ <strong>Tawarkan bantuan:</strong> Tanyakan apakah ada kendala dengan pembayaran</li>
          <li>✅ <strong>Urgency tanpa pressure:</strong> Ingatkan waktu tersisa tanpa memaksa</li>
          <li>✅ <strong>Sertakan link:</strong> Pastikan link pembayaran mudah diakses</li>
        </ul>
      </Card>

      {/* Reminder Selection Modal */}
      {reminderModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Pilih Template Reminder</h3>
              <button
                onClick={() => {
                  setReminderModalOpen(false)
                  setSelectedLead(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm">
                <span className="font-semibold">Customer:</span> {selectedLead.customerName}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Produk:</span>{' '}
                {selectedLead.membership?.membership?.name || selectedLead.product?.name}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Amount:</span> Rp{' '}
                {Number(selectedLead.amount).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="space-y-3">
              {(() => {
                let reminders: Array<{ title: string; message: string }> = []
                let productName = ''

                if (selectedLead.type === 'MEMBERSHIP' && selectedLead.membership?.membership) {
                  reminders = selectedLead.membership.membership.reminders || []
                  productName = selectedLead.membership.membership.name
                } else if (selectedLead.type === 'PRODUCT' && selectedLead.product) {
                  reminders = selectedLead.product.reminders || []
                  productName = selectedLead.product.name
                }

                return reminders.map((reminder, index) => (
                  <button
                    key={index}
                    onClick={() => sendWhatsAppWithReminder(selectedLead, reminder.message, productName)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{reminder.title}</span>
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{reminder.message}</p>
                  </button>
                ))
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
