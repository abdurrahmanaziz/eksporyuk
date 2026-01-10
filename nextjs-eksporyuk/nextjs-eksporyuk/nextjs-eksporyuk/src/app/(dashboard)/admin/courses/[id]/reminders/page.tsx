'use client'

import { useState, useEffect } from 'react'
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
  GraduationCap,
  BookOpen,
  Award,
  Target
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

interface CourseReminder {
  id: string
  courseId: string
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

interface Course {
  id: string
  title: string
  slug: string
  price: number
}

// Templates for course reminders
const reminderTemplates = [
  {
    id: 'welcome-course',
    name: 'Selamat Datang di Kelas',
    description: 'Email selamat datang setelah enrollment',
    icon: GraduationCap,
    color: 'bg-blue-500',
    trigger: 'AFTER_PURCHASE',
    triggerDays: 0,
    emailSubject: 'Selamat Datang di Kelas {course_name}!',
    emailBody: `Halo {customer_name}!

Selamat bergabung di kelas "{course_name}"! 🎉

Kami sangat senang Anda memutuskan untuk belajar bersama kami. Berikut yang perlu Anda ketahui:

📚 Akses Kelas
Login ke dashboard member area untuk mulai belajar. Semua materi sudah tersedia untuk Anda.

⏰ Tips Belajar
- Luangkan waktu 30-60 menit setiap hari
- Praktikkan setiap materi yang dipelajari
- Jangan ragu bertanya di forum diskusi

📱 Dukungan
Tim support kami siap membantu jika Anda menemui kendala.

Selamat belajar!

Salam sukses,
Tim EksporYuk`,
    pushTitle: 'Selamat Datang di Kelas! 🎓',
    pushBody: 'Akses kelas {course_name} sekarang dan mulai perjalanan belajar Anda!',
    inAppTitle: 'Selamat Bergabung!',
    inAppBody: 'Kelas {course_name} sudah siap untuk Anda akses. Mulai belajar sekarang!',
  },
  {
    id: 'lesson-reminder',
    name: 'Pengingat Belajar',
    description: 'Ingatkan siswa untuk melanjutkan belajar',
    icon: BookOpen,
    color: 'bg-green-500',
    trigger: 'AFTER_PURCHASE',
    triggerDays: 3,
    emailSubject: 'Jangan Lupa Lanjutkan Belajar di {course_name}!',
    emailBody: `Halo {customer_name}!

Sudah 3 hari sejak Anda bergabung di kelas "{course_name}". Bagaimana progress belajar Anda?

💡 Tips: Konsistensi adalah kunci! Luangkan minimal 15 menit sehari untuk belajar.

Materi yang menunggu Anda:
- [Modul berikutnya]
- [Tugas praktik]
- [Quiz assessment]

Klik di bawah untuk melanjutkan belajar:
[Lanjutkan Belajar]

Semangat terus! 💪

Salam,
Tim EksporYuk`,
    pushTitle: 'Waktunya Belajar! 📖',
    pushBody: 'Lanjutkan progress di kelas {course_name}. Konsistensi adalah kunci!',
    inAppTitle: 'Pengingat Belajar',
    inAppBody: 'Sudah waktunya melanjutkan kelas {course_name}. Yuk, belajar lagi!',
  },
  {
    id: 'halfway-motivation',
    name: 'Motivasi Setengah Jalan',
    description: 'Berikan motivasi di tengah kelas',
    icon: Target,
    color: 'bg-yellow-500',
    trigger: 'AFTER_PURCHASE',
    triggerDays: 14,
    emailSubject: 'Luar Biasa! Anda Sudah Setengah Jalan di {course_name}!',
    emailBody: `Halo {customer_name}!

🎯 WOW! Anda sudah belajar selama 2 minggu di kelas "{course_name}"!

Ini pencapaian yang luar biasa! Kebanyakan orang menyerah dalam minggu pertama, tapi Anda tetap bertahan. Terus semangat!

📊 Progress Anda:
- Waktu belajar: 2 minggu
- Status: On Track!

💪 Tips untuk 2 minggu ke depan:
1. Review materi yang sudah dipelajari
2. Praktikkan skill baru setiap hari
3. Bagikan pengalaman di forum komunitas

Teruskan momentum ini hingga selesai!

Salam sukses,
Tim EksporYuk`,
    pushTitle: 'Halfway There! 🎯',
    pushBody: '2 minggu progress di {course_name}. Tetap semangat hingga selesai!',
    inAppTitle: 'Setengah Jalan!',
    inAppBody: 'Luar biasa! 2 minggu belajar di {course_name}. Terus semangat!',
  },
  {
    id: 'completion-reminder',
    name: 'Pengingat Penyelesaian',
    description: 'Dorong siswa menyelesaikan kelas',
    icon: Award,
    color: 'bg-purple-500',
    trigger: 'AFTER_PURCHASE',
    triggerDays: 30,
    emailSubject: 'Satu Langkah Lagi Menuju Sertifikat {course_name}!',
    emailBody: `Halo {customer_name}!

🏆 Anda sudah belajar selama sebulan di kelas "{course_name}"!

Apakah sudah menyelesaikan semua materi? Jika belum, jangan khawatir - masih ada waktu!

🎓 Sertifikat Menunggu
Selesaikan semua modul dan quiz untuk mendapatkan sertifikat kelulusan yang bisa Anda tampilkan di LinkedIn atau CV!

📝 Checklist Penyelesaian:
□ Selesaikan semua video pembelajaran
□ Kerjakan semua tugas praktik
□ Lulus ujian akhir dengan nilai minimal 70%

Jangan biarkan usaha Anda sia-sia. Selesaikan kelas dan raih sertifikatnya!

[Lanjutkan ke Dashboard]

Salam sukses,
Tim EksporYuk`,
    pushTitle: 'Raih Sertifikat Anda! 🏆',
    pushBody: 'Selesaikan kelas {course_name} dan dapatkan sertifikat kelulusan!',
    inAppTitle: 'Hampir Selesai!',
    inAppBody: 'Selesaikan kelas {course_name} untuk mendapatkan sertifikat Anda!',
  },
  {
    id: 'inactive-student',
    name: 'Siswa Tidak Aktif',
    description: 'Re-engage siswa yang tidak aktif',
    icon: Zap,
    color: 'bg-red-500',
    trigger: 'CONDITIONAL',
    triggerDays: 7,
    emailSubject: 'Kami Rindu Anda di Kelas {course_name}!',
    emailBody: `Halo {customer_name}!

Kami perhatikan Anda belum mengakses kelas "{course_name}" dalam beberapa waktu. Ada yang bisa kami bantu?

🤔 Mungkin Anda:
- Sibuk dengan aktivitas lain
- Mengalami kesulitan dengan materi
- Butuh motivasi tambahan

💡 Apa pun alasannya, kami di sini untuk membantu!

Balas email ini atau hubungi support kami jika ada kendala. Tim kami siap membantu Anda kembali ke track pembelajaran.

Jangan biarkan investasi belajar Anda terbuang sia-sia. Yuk, mulai lagi dari mana pun Anda berhenti!

[Kembali Belajar]

Semoga sukses selalu,
Tim EksporYuk`,
    pushTitle: 'Kami Rindu Anda! 😊',
    pushBody: 'Kembali ke kelas {course_name}. Kami siap membantu Anda!',
    inAppTitle: 'Lanjutkan Belajar',
    inAppBody: 'Sudah lama tidak belajar? Yuk, kembali ke {course_name}!',
  },
  {
    id: 'new-content',
    name: 'Konten Baru',
    description: 'Notifikasi update materi kelas',
    icon: Send,
    color: 'bg-indigo-500',
    trigger: 'CONDITIONAL',
    triggerDays: 0,
    emailSubject: 'Materi Baru di Kelas {course_name}!',
    emailBody: `Halo {customer_name}!

📢 Ada materi baru di kelas "{course_name}"!

Kami baru saja menambahkan konten terbaru:
- [Nama Modul/Video Baru]
- [Deskripsi singkat]

Materi ini akan membantu Anda:
✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]

Login sekarang untuk mengakses materi terbaru!

[Akses Materi Baru]

Happy learning!

Salam,
Tim EksporYuk`,
    pushTitle: 'Konten Baru! 🆕',
    pushBody: 'Materi baru telah ditambahkan ke kelas {course_name}. Cek sekarang!',
    inAppTitle: 'Update Kelas',
    inAppBody: 'Materi baru tersedia di kelas {course_name}!',
  },
]

const triggerLabels: Record<string, string> = {
  'AFTER_PURCHASE': 'Setelah Enrollment',
  'BEFORE_EXPIRY': 'Sebelum Expired',
  'ON_SPECIFIC_DATE': 'Tanggal Tertentu',
  'CONDITIONAL': 'Kondisional',
}

const channelIcons: Record<string, React.ReactNode> = {
  'EMAIL': <Mail className="h-4 w-4" />,
  'PUSH': <Smartphone className="h-4 w-4" />,
  'IN_APP': <MessageSquare className="h-4 w-4" />,
}

export default function CourseRemindersPage({ params }: { params: { id: string } }) {
  const resolvedParams = params
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [reminders, setReminders] = useState<CourseReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTrigger, setFilterTrigger] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<CourseReminder | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'AFTER_PURCHASE',
    triggerDays: 0,
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
    fetchCourse()
    fetchReminders()
  }, [resolvedParams.id])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    }
  }

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/courses/${resolvedParams.id}/reminders`)
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
      triggerType: 'AFTER_PURCHASE',
      triggerDays: 0,
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

      const response = await fetch(`/api/admin/courses/${resolvedParams.id}/reminders`, {
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

      const response = await fetch(`/api/admin/courses/${resolvedParams.id}/reminders/${selectedReminder.id}`, {
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
      const response = await fetch(`/api/admin/courses/${resolvedParams.id}/reminders/${selectedReminder.id}`, {
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

  const handleToggleActive = async (reminder: CourseReminder) => {
    try {
      const response = await fetch(`/api/admin/courses/${resolvedParams.id}/reminders/${reminder.id}`, {
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

  const handleDuplicateReminder = async (reminder: CourseReminder) => {
    try {
      const channels = reminder.channels.map(c => c.channel)
      const response = await fetch(`/api/admin/courses/${resolvedParams.id}/reminders`, {
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

  const openEditDialog = (reminder: CourseReminder) => {
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
            placeholder="Contoh: Pengingat Belajar"
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
                <SelectItem value="AFTER_PURCHASE">Setelah Enrollment</SelectItem>
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
              Hari setelah enrollment
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
            placeholder="Contoh: Selamat Datang di Kelas!"
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
            Variabel: {'{customer_name}'}, {'{course_name}'}, {'{enrollment_date}'}, {'{progress}'}, {'{next_lesson}'}
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
            placeholder="Contoh: Waktunya Belajar! 📖"
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
            placeholder="Contoh: Pengingat Belajar"
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
            <Link href={`/admin/courses/${resolvedParams.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Reminder Kelas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {course?.title || 'Loading...'}
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
            <SelectItem value="AFTER_PURCHASE">Setelah Enrollment</SelectItem>
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
                : 'Buat reminder pertama untuk kelas ini'
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
            <DialogTitle>Template Reminder Kelas</DialogTitle>
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
              Buat reminder otomatis untuk kelas {course?.title}
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
