'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { 
  ArrowLeft, 
  Bell, 
  Plus, 
  Search, 
  Filter,
  Mail,
  Smartphone,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Gift,
  Send,
  Zap,
  FileText,
  CalendarCheck,
  MapPin,
  Users,
  Ticket,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EventReminder {
  id: string
  eventId: string
  name: string
  triggerType: string
  triggerDays: number
  channels: { channel: string }[]
  emailSubject: string | null
  emailBody: string | null
  pushTitle: string | null
  pushBody: string | null
  inAppTitle: string | null
  inAppBody: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Event {
  id: string
  title: string
  slug: string
  price: number
  eventDate?: string
}

// Templates for event reminders
const reminderTemplates = [
  {
    id: 'ticket-confirmation',
    name: 'Konfirmasi Tiket',
    description: 'Email konfirmasi setelah pembelian tiket',
    icon: Ticket,
    color: 'bg-blue-500',
    trigger: 'AFTER_PURCHASE',
    triggerDays: 0,
    emailSubject: 'Tiket Event {event_name} Berhasil Dibeli!',
    emailBody: `Halo {customer_name}!

Selamat! Tiket Anda untuk event "{event_name}" sudah berhasil dibeli. 🎉

Detail Event:
📅 Tanggal: {event_date}
⏰ Waktu: {event_time}
📍 Lokasi: {event_location}
🎫 Nomor Tiket: {ticket_number}

Informasi Penting:
- Simpan email ini sebagai bukti pembelian
- Tunjukkan tiket digital ini saat check-in
- Datang 30 menit sebelum acara dimulai

[Download E-Ticket]

Sampai jumpa di event!

Salam,
Tim EksporYuk`,
    pushTitle: 'Tiket Berhasil Dibeli! 🎫',
    pushBody: 'Tiket event {event_name} sudah di tangan Anda. Jangan lupa catat tanggalnya!',
    inAppTitle: 'Pembelian Berhasil!',
    inAppBody: 'Tiket event {event_name} sudah aktif. Cek email untuk detail lengkap!',
  },
  {
    id: 'event-reminder-7days',
    name: 'Pengingat H-7',
    description: 'Reminder 7 hari sebelum event',
    icon: Calendar,
    color: 'bg-yellow-500',
    trigger: 'BEFORE_EXPIRY',
    triggerDays: 7,
    emailSubject: 'Seminggu Lagi Event {event_name}!',
    emailBody: `Halo {customer_name}!

Hanya tinggal 1 minggu lagi sebelum event "{event_name}"! 🗓️

Persiapan Event:
📅 Tanggal: {event_date}
⏰ Waktu: {event_time}
📍 Lokasi: {event_location}

Checklist Persiapan:
✅ Cek kembali tiket Anda
✅ Rencanakan perjalanan ke lokasi
✅ Unduh materi event (jika ada)
✅ Siapkan pertanyaan untuk sesi Q&A

Tips:
- Datang lebih awal untuk networking
- Bawa kartu nama jika ada
- Charge gadget Anda sebelum berangkat

[Lihat Detail Event]

Sampai jumpa minggu depan!

Salam,
Tim EksporYuk`,
    pushTitle: 'H-7 Event {event_name}! 📅',
    pushBody: 'Tinggal seminggu lagi! Persiapkan diri Anda untuk event yang amazing!',
    inAppTitle: 'Event Minggu Depan',
    inAppBody: 'Hanya 7 hari lagi sebelum {event_name}. Siapkan diri Anda!',
  },
  {
    id: 'event-reminder-1day',
    name: 'Pengingat H-1',
    description: 'Reminder sehari sebelum event',
    icon: AlertCircle,
    color: 'bg-orange-500',
    trigger: 'BEFORE_EXPIRY',
    triggerDays: 1,
    emailSubject: 'Besok Event {event_name} - Jangan Sampai Terlewat!',
    emailBody: `Halo {customer_name}!

Besok adalah hari yang ditunggu-tunggu! Event "{event_name}" akan segera dimulai. 🎊

Detail Event BESOK:
📅 Tanggal: {event_date}
⏰ Waktu: {event_time}
📍 Lokasi: {event_location}
🎫 Tiket: {ticket_number}

PENTING - Bawa Ini:
✅ E-Ticket (sudah ada di email)
✅ KTP/Identitas
✅ Kartu nama
✅ Notebook & pulpen

Lokasi & Transportasi:
{location_map_link}

Tips Besok:
- Datang 30 menit lebih awal
- Parking area tersedia di {parking_info}
- Registrasi dibuka pukul {registration_time}

Kami tunggu Anda besok!

Salam,
Tim EksporYuk`,
    pushTitle: 'Event Besok! ⏰',
    pushBody: 'Jangan lupa! {event_name} dimulai besok. Siapkan tiket Anda!',
    inAppTitle: 'Event Besok!',
    inAppBody: 'H-1 sebelum {event_name}. Pastikan semua persiapan sudah oke!',
  },
  {
    id: 'event-day',
    name: 'Hari Event',
    description: 'Reminder di hari event',
    icon: CalendarCheck,
    color: 'bg-green-500',
    trigger: 'ON_SPECIFIC_DATE',
    triggerDays: 0,
    emailSubject: 'Hari Ini Event {event_name} - See You There!',
    emailBody: `Halo {customer_name}!

Hari ini adalah hari H! Event "{event_name}" akan dimulai dalam beberapa jam. 🎉

Jadwal Hari Ini:
⏰ Check-in: {checkin_time}
⏰ Event Mulai: {event_time}
📍 Lokasi: {event_location}

E-Ticket Anda:
🎫 {ticket_number}
[Download E-Ticket]

Rundown Acara:
{event_schedule}

Fasilitas:
- WiFi gratis tersedia
- Coffee break disediakan
- Lunch box untuk peserta
- Doorprize menarik!

Info Penting:
- Registrasi wajib sebelum event dimulai
- Masker tersedia jika diperlukan
- Parkir gratis untuk peserta

Sampai jumpa di event! 🎊

Salam,
Tim EksporYuk`,
    pushTitle: 'Event Hari Ini! 🎉',
    pushBody: '{event_name} dimulai hari ini! Jangan terlambat!',
    inAppTitle: 'Event Hari Ini!',
    inAppBody: 'Hari H {event_name}! Tunjukkan e-ticket Anda saat check-in.',
  },
  {
    id: 'thank-you-feedback',
    name: 'Terima Kasih & Feedback',
    description: 'Email terima kasih setelah event',
    icon: Send,
    color: 'bg-purple-500',
    trigger: 'AFTER_PURCHASE',
    triggerDays: 1,
    emailSubject: 'Terima Kasih Sudah Hadir di {event_name}!',
    emailBody: `Halo {customer_name}!

Terima kasih sudah hadir di event "{event_name}" kemarin! 🙏

Kami harap Anda menikmati acara dan mendapatkan banyak insight bermanfaat.

📸 Event Recap:
- Foto event akan segera dibagikan
- Materi presentasi dapat diunduh di dashboard
- Recording session (jika ada) akan dikirim via email

💡 Feedback Anda Sangat Berarti!
Bantu kami membuat event lebih baik dengan mengisi survey singkat (2 menit):
[Isi Survey]

🎁 Special Offer:
Sebagai apresiasi, dapatkan diskon 20% untuk event berikutnya!
Kode: {discount_code}

Stay Connected:
- Join komunitas kami
- Follow media sosial @eksporyuk
- Tunggu event berikutnya!

Sampai jumpa di event selanjutnya!

Salam hangat,
Tim EksporYuk`,
    pushTitle: 'Terima Kasih! 🙏',
    pushBody: 'Thanks sudah hadir! Berikan feedback Anda tentang {event_name}.',
    inAppTitle: 'Event Selesai',
    inAppBody: 'Terima kasih telah hadir di {event_name}. Bagikan pengalaman Anda!',
  },
  {
    id: 'follow-up-materials',
    name: 'Follow Up Materi',
    description: 'Kirim materi dan rekaman event',
    icon: FileText,
    color: 'bg-indigo-500',
    trigger: 'AFTER_PURCHASE',
    triggerDays: 3,
    emailSubject: 'Materi Event {event_name} - Download Sekarang!',
    emailBody: `Halo {customer_name}!

Sesuai janji, kami kirimkan materi lengkap dari event "{event_name}". 📚

Materi yang Tersedia:
📄 Slide presentasi semua speaker
🎥 Video rekaman full session
📝 Checklist & template
🔗 Link resources tambahan

[Download Semua Materi]

Bonus Eksklusif:
✨ E-book panduan lengkap
✨ Template siap pakai
✨ Akses komunitas private

Action Items:
1. Review kembali materi
2. Implementasikan apa yang dipelajari
3. Share pengalaman di media sosial (tag kami!)

Punya pertanyaan?
Diskusikan dengan komunitas di grup exclusive kami!
[Join Komunitas]

Keep learning & growing!

Salam,
Tim EksporYuk`,
    pushTitle: 'Materi Event Ready! 📚',
    pushBody: 'Download materi lengkap {event_name} sekarang!',
    inAppTitle: 'Materi Tersedia',
    inAppBody: 'Materi event {event_name} sudah bisa diunduh di dashboard Anda!',
  },
]

const triggerLabels: Record<string, string> = {
  'AFTER_PURCHASE': 'Setelah Pembelian',
  'BEFORE_EXPIRY': 'Sebelum Event',
  'ON_SPECIFIC_DATE': 'Tanggal Tertentu',
  'CONDITIONAL': 'Kondisional',
}

const channelIcons: Record<string, React.ReactNode> = {
  'EMAIL': <Mail className="h-4 w-4" />,
  'PUSH': <Smartphone className="h-4 w-4" />,
  'IN_APP': <MessageSquare className="h-4 w-4" />,
}

export default function EventRemindersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [reminders, setReminders] = useState<EventReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTrigger, setFilterTrigger] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<EventReminder | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'BEFORE_EXPIRY',
    triggerDays: 1,
    channels: {
      email: true,
      push: false,
      inApp: false,
    },
    emailSubject: '',
    emailBody: '',
    pushTitle: '',
    pushBody: '',
    inAppTitle: '',
    inAppBody: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEvent()
    fetchReminders()
  }, [resolvedParams.id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    }
  }

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/events/${resolvedParams.id}/reminders`)
      if (response.ok) {
        const data = await response.json()
        setReminders(data)
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast.error('Gagal memuat reminder')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      triggerType: 'BEFORE_EXPIRY',
      triggerDays: 1,
      channels: {
        email: true,
        push: false,
        inApp: false,
      },
      emailSubject: '',
      emailBody: '',
      pushTitle: '',
      pushBody: '',
      inAppTitle: '',
      inAppBody: '',
      isActive: true,
    })
  }

  const applyTemplate = (template: typeof reminderTemplates[0]) => {
    setFormData({
      name: template.name,
      triggerType: template.trigger,
      triggerDays: template.triggerDays,
      channels: {
        email: true,
        push: true,
        inApp: true,
      },
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      pushTitle: template.pushTitle,
      pushBody: template.pushBody,
      inAppTitle: template.inAppTitle,
      inAppBody: template.inAppBody,
      isActive: true,
    })
    setShowTemplateDialog(false)
    setShowCreateDialog(true)
  }

  const handleCreateReminder = async () => {
    try {
      setSaving(true)
      const channels = []
      if (formData.channels.email) channels.push('EMAIL')
      if (formData.channels.push) channels.push('PUSH')
      if (formData.channels.inApp) channels.push('IN_APP')

      const response = await fetch(`/api/admin/events/${resolvedParams.id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          triggerType: formData.triggerType,
          triggerDays: formData.triggerDays,
          channels,
          emailSubject: formData.channels.email ? formData.emailSubject : null,
          emailBody: formData.channels.email ? formData.emailBody : null,
          pushTitle: formData.channels.push ? formData.pushTitle : null,
          pushBody: formData.channels.push ? formData.pushBody : null,
          inAppTitle: formData.channels.inApp ? formData.inAppTitle : null,
          inAppBody: formData.channels.inApp ? formData.inAppBody : null,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast.success('Reminder berhasil dibuat')
        setShowCreateDialog(false)
        resetForm()
        fetchReminders()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal membuat reminder')
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      toast.error('Gagal membuat reminder')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateReminder = async () => {
    if (!selectedReminder) return

    try {
      setSaving(true)
      const channels = []
      if (formData.channels.email) channels.push('EMAIL')
      if (formData.channels.push) channels.push('PUSH')
      if (formData.channels.inApp) channels.push('IN_APP')

      const response = await fetch(`/api/admin/events/${resolvedParams.id}/reminders/${selectedReminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          triggerType: formData.triggerType,
          triggerDays: formData.triggerDays,
          channels,
          emailSubject: formData.channels.email ? formData.emailSubject : null,
          emailBody: formData.channels.email ? formData.emailBody : null,
          pushTitle: formData.channels.push ? formData.pushTitle : null,
          pushBody: formData.channels.push ? formData.pushBody : null,
          inAppTitle: formData.channels.inApp ? formData.inAppTitle : null,
          inAppBody: formData.channels.inApp ? formData.inAppBody : null,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast.success('Reminder berhasil diupdate')
        setShowEditDialog(false)
        setSelectedReminder(null)
        resetForm()
        fetchReminders()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal mengupdate reminder')
      }
    } catch (error) {
      console.error('Error updating reminder:', error)
      toast.error('Gagal mengupdate reminder')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReminder = async () => {
    if (!selectedReminder) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/events/${resolvedParams.id}/reminders/${selectedReminder.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Reminder berhasil dihapus')
        setShowDeleteDialog(false)
        setSelectedReminder(null)
        fetchReminders()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal menghapus reminder')
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast.error('Gagal menghapus reminder')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (reminder: EventReminder) => {
    try {
      const response = await fetch(`/api/admin/events/${resolvedParams.id}/reminders/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !reminder.isActive,
        }),
      })

      if (response.ok) {
        toast.success(reminder.isActive ? 'Reminder dinonaktifkan' : 'Reminder diaktifkan')
        fetchReminders()
      }
    } catch (error) {
      console.error('Error toggling reminder:', error)
      toast.error('Gagal mengubah status reminder')
    }
  }

  const handleDuplicateReminder = async (reminder: EventReminder) => {
    try {
      const channels = reminder.channels.map(c => c.channel)
      const response = await fetch(`/api/admin/events/${resolvedParams.id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${reminder.name} (Copy)`,
          triggerType: reminder.triggerType,
          triggerDays: reminder.triggerDays,
          channels,
          emailSubject: reminder.emailSubject,
          emailBody: reminder.emailBody,
          pushTitle: reminder.pushTitle,
          pushBody: reminder.pushBody,
          inAppTitle: reminder.inAppTitle,
          inAppBody: reminder.inAppBody,
          isActive: false,
        }),
      })

      if (response.ok) {
        toast.success('Reminder berhasil diduplikasi')
        fetchReminders()
      }
    } catch (error) {
      console.error('Error duplicating reminder:', error)
      toast.error('Gagal menduplikasi reminder')
    }
  }

  const openEditDialog = (reminder: EventReminder) => {
    setSelectedReminder(reminder)
    const hasEmail = reminder.channels.some(c => c.channel === 'EMAIL')
    const hasPush = reminder.channels.some(c => c.channel === 'PUSH')
    const hasInApp = reminder.channels.some(c => c.channel === 'IN_APP')

    setFormData({
      name: reminder.name,
      triggerType: reminder.triggerType,
      triggerDays: reminder.triggerDays,
      channels: {
        email: hasEmail,
        push: hasPush,
        inApp: hasInApp,
      },
      emailSubject: reminder.emailSubject || '',
      emailBody: reminder.emailBody || '',
      pushTitle: reminder.pushTitle || '',
      pushBody: reminder.pushBody || '',
      inAppTitle: reminder.inAppTitle || '',
      inAppBody: reminder.inAppBody || '',
      isActive: reminder.isActive,
    })
    setShowEditDialog(true)
  }

  // Filter reminders
  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTrigger = filterTrigger === 'all' || reminder.triggerType === filterTrigger
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && reminder.isActive) ||
      (filterStatus === 'inactive' && !reminder.isActive)
    return matchesSearch && matchesTrigger && matchesStatus
  })

  // Render reminder form (shared between create and edit)
  const renderReminderForm = () => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Dasar</TabsTrigger>
        <TabsTrigger value="email" disabled={!formData.channels.email}>Email</TabsTrigger>
        <TabsTrigger value="push" disabled={!formData.channels.push}>Push</TabsTrigger>
        <TabsTrigger value="inapp" disabled={!formData.channels.inApp}>In-App</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Reminder</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Pengingat H-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="triggerType">Trigger</Label>
            <Select
              value={formData.triggerType}
              onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AFTER_PURCHASE">Setelah Pembelian</SelectItem>
                <SelectItem value="BEFORE_EXPIRY">Sebelum Event</SelectItem>
                <SelectItem value="ON_SPECIFIC_DATE">Tanggal Tertentu</SelectItem>
                <SelectItem value="CONDITIONAL">Kondisional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggerDays">Hari</Label>
            <Input
              id="triggerDays"
              type="number"
              min="0"
              value={formData.triggerDays}
              onChange={(e) => setFormData({ ...formData, triggerDays: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              {formData.triggerType === 'AFTER_PURCHASE' ? 'Hari setelah pembelian' : 'Hari sebelum event'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Channel Notifikasi</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">Kirim reminder via email</p>
                </div>
              </div>
              <Switch
                checked={formData.channels.email}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  channels: { ...formData.channels, email: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Push Notification</p>
                  <p className="text-sm text-muted-foreground">Kirim notifikasi push</p>
                </div>
              </div>
              <Switch
                checked={formData.channels.push}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  channels: { ...formData.channels, push: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">In-App Notification</p>
                  <p className="text-sm text-muted-foreground">Tampilkan notifikasi di aplikasi</p>
                </div>
              </div>
              <Switch
                checked={formData.channels.inApp}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  channels: { ...formData.channels, inApp: checked }
                })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">Status Aktif</p>
            <p className="text-sm text-muted-foreground">Reminder akan dikirim jika aktif</p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
        </div>
      </TabsContent>

      <TabsContent value="email" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="emailSubject">Subject Email</Label>
          <Input
            id="emailSubject"
            value={formData.emailSubject}
            onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
            placeholder="Contoh: Besok Event {event_name}!"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emailBody">Isi Email</Label>
          <Textarea
            id="emailBody"
            value={formData.emailBody}
            onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
            placeholder="Isi pesan email..."
            rows={10}
          />
          <p className="text-xs text-muted-foreground">
            Variabel: {'{customer_name}'}, {'{event_name}'}, {'{event_date}'}, {'{event_time}'}, {'{event_location}'}, {'{ticket_number}'}
          </p>
        </div>
      </TabsContent>

      <TabsContent value="push" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="pushTitle">Judul Push Notification</Label>
          <Input
            id="pushTitle"
            value={formData.pushTitle}
            onChange={(e) => setFormData({ ...formData, pushTitle: e.target.value })}
            placeholder="Contoh: Event Besok! ⏰"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">Maksimal 50 karakter</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pushBody">Isi Push Notification</Label>
          <Textarea
            id="pushBody"
            value={formData.pushBody}
            onChange={(e) => setFormData({ ...formData, pushBody: e.target.value })}
            placeholder="Isi notifikasi push..."
            rows={3}
            maxLength={150}
          />
          <p className="text-xs text-muted-foreground">Maksimal 150 karakter</p>
        </div>

        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">Preview:</p>
          <div className="bg-background p-3 rounded-lg border shadow-sm">
            <p className="font-medium text-sm">{formData.pushTitle || 'Judul Notifikasi'}</p>
            <p className="text-xs text-muted-foreground">{formData.pushBody || 'Isi notifikasi akan muncul di sini...'}</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="inapp" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="inAppTitle">Judul In-App Notification</Label>
          <Input
            id="inAppTitle"
            value={formData.inAppTitle}
            onChange={(e) => setFormData({ ...formData, inAppTitle: e.target.value })}
            placeholder="Contoh: Event Besok!"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inAppBody">Isi In-App Notification</Label>
          <Textarea
            id="inAppBody"
            value={formData.inAppBody}
            onChange={(e) => setFormData({ ...formData, inAppBody: e.target.value })}
            placeholder="Isi notifikasi in-app..."
            rows={4}
          />
        </div>

        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">Preview:</p>
          <div className="flex items-start gap-3 bg-background p-3 rounded-lg border">
            <div className="p-2 rounded-full bg-primary/10">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{formData.inAppTitle || 'Judul Notifikasi'}</p>
              <p className="text-xs text-muted-foreground">{formData.inAppBody || 'Isi notifikasi akan muncul di sini...'}</p>
              <p className="text-xs text-muted-foreground mt-1">Baru saja</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )

  return (
    <ResponsivePageWrapper>
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/events/${resolvedParams.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Reminder Event
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {event?.title || 'Loading...'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Reminder
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reminders.length}</p>
                <p className="text-sm text-muted-foreground">Total Reminder</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reminders.filter(r => r.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <XCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reminders.filter(r => !r.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Tidak Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Mail className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reminders.filter(r => r.channels.some(c => c.channel === 'EMAIL')).length}
                </p>
                <p className="text-sm text-muted-foreground">Dengan Email</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari reminder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTrigger} onValueChange={setFilterTrigger}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter Trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Trigger</SelectItem>
            <SelectItem value="AFTER_PURCHASE">Setelah Pembelian</SelectItem>
            <SelectItem value="BEFORE_EXPIRY">Sebelum Event</SelectItem>
            <SelectItem value="ON_SPECIFIC_DATE">Tanggal Tertentu</SelectItem>
            <SelectItem value="CONDITIONAL">Kondisional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-3/4 mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReminders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Reminder</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || filterTrigger !== 'all' || filterStatus !== 'all'
                ? 'Tidak ada reminder yang sesuai dengan filter'
                : 'Buat reminder pertama untuk event ini'
              }
            </p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReminders.map((reminder) => (
            <Card key={reminder.id} className={cn(!reminder.isActive && 'opacity-60')}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {reminder.name}
                      {reminder.isActive ? (
                        <Badge variant="default" className="bg-green-500">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak Aktif</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {triggerLabels[reminder.triggerType]} - {reminder.triggerDays} hari
                      </span>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEditDialog(reminder)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateReminder(reminder)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplikasi
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setSelectedReminder(reminder)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-3">
                  {reminder.channels.map((ch) => (
                    <Badge key={ch.channel} variant="outline" className="flex items-center gap-1">
                      {channelIcons[ch.channel]}
                      <span className="text-xs">{ch.channel}</span>
                    </Badge>
                  ))}
                </div>
                {reminder.emailSubject && (
                  <p className="text-sm text-muted-foreground truncate">
                    📧 {reminder.emailSubject}
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-muted-foreground">
                    {new Date(reminder.createdAt).toLocaleDateString('id-ID')}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={reminder.isActive}
                      onCheckedChange={() => handleToggleActive(reminder)}
                    />
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Reminder Event</DialogTitle>
            <DialogDescription>
              Pilih template untuk membuat reminder dengan cepat
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {reminderTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => applyTemplate(template)}
              >
                <div className={cn("p-3 rounded-lg", template.color)}>
                  <template.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{template.name}</p>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {triggerLabels[template.trigger]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.triggerDays} hari
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Gunakan
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Reminder Baru</DialogTitle>
            <DialogDescription>
              Buat reminder otomatis untuk event {event?.title}
            </DialogDescription>
          </DialogHeader>
          {renderReminderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateReminder} disabled={saving || !formData.name}>
              {saving ? 'Menyimpan...' : 'Simpan Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>
              Ubah pengaturan reminder
            </DialogDescription>
          </DialogHeader>
          {renderReminderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateReminder} disabled={saving || !formData.name}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Reminder</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus reminder &quot;{selectedReminder?.name}&quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteReminder} disabled={saving}>
              {saving ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ResponsivePageWrapper>
  )
}
