'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { getRoleTheme } from '@/lib/role-themes'
import Pusher from 'pusher-js'
import {
  Home,
  Users,
  User,
  ShoppingBag,
  UsersRound,
  Calendar,
  BookOpen,
  Share2,
  Tag,
  Briefcase,
  Wallet,
  Settings,
  MessageSquare,
  BarChart3,
  Gamepad2,
  Plug,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Target,
  Gift,
  Trophy,
  Zap,
  FileText,
  CreditCard,
  Star,
  Bell,
  Ticket,
  Clock,
  Database,
  Building2,
  Bookmark,
  Truck,
  FileCheck,
  MapPin,
  Mail,
  Award,
  Crown,
  Package,
  List,
  Send,
  Image as ImageIcon,
  XCircle,
  File,
  Layout,
  ClipboardList,
  UserPlus,
  Coins,
  Receipt,
  Book,
  GraduationCap,
  Sliders,
} from 'lucide-react'

type NavItem = {
  name: string
  href: string
  icon: any
  badge?: string
}

type NavCategory = {
  title: string
  items: NavItem[]
}

const navigationByRole = {
  ADMIN: [
    {
      title: 'Ringkasan',
      items: [
        { name: 'Dashboard', href: '/admin', icon: Home },
        { name: 'Analitik', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Analitik Kursus', href: '/admin/analytics/courses', icon: TrendingUp },
      ]
    },
    {
      title: 'Membership',
      items: [
        { name: 'Fitur Membership', href: '/admin/features', icon: Zap },
        { name: 'Paket Membership', href: '/admin/membership-plans', icon: Package },
        { name: 'Kelola Member', href: '/admin/membership', icon: Users },
      ]
    },
    {
      title: 'Manajemen Pengguna',
      items: [
        { name: 'Semua Pengguna', href: '/admin/users', icon: Users },
        { name: 'Direktori Member', href: '/admin/member-directory', icon: MapPin },
      ]
    },
    {
      title: 'Manajemen Produk',
      items: [
        { name: 'Produk Digital', href: '/admin/products', icon: ShoppingBag },
        { name: 'Kupon & Diskon', href: '/admin/coupons', icon: Tag },
      ]
    },
    {
      title: 'Manajemen Kursus',
      items: [
        { name: 'Semua Kursus', href: '/admin/courses', icon: BookOpen },
        { name: 'Pendaftaran Kursus', href: '/admin/enrollments', icon: Users },
        { name: 'Review Kursus', href: '/admin/course-reviews', icon: Star },
        { name: 'Semua Sertifikat', href: '/admin/certificates', icon: Award },
        { name: 'Template Sertifikat', href: '/admin/certificate-templates', icon: FileCheck },
      ]
    },
    {
      title: 'Komunitas',
      items: [
        { name: 'Feed Komunitas', href: '/community/feed', icon: MessageSquare },
        { name: 'Kelola Grup', href: '/admin/groups', icon: UsersRound },
        { name: 'Kelola Acara', href: '/admin/events', icon: Calendar },
        { name: 'Kelola Feed', href: '/admin/feed', icon: MessageSquare },
        { name: 'Chat', href: '/chat', icon: Send },
        { name: 'Notifikasi', href: '/notifications', icon: Bell },
        { name: 'Postingan Tersimpan', href: '/saved-posts', icon: Bookmark },
      ]
    },
    {
      title: 'Database Ekspor',
      items: [
        { name: 'Data Buyer', href: '/admin/databases/buyers', icon: Building2 },
        { name: 'Data Supplier', href: '/admin/databases/suppliers', icon: Database },
        { name: 'Data Forwarder', href: '/admin/databases/forwarders', icon: Truck },
        { name: 'Template Dokumen', href: '/admin/documents/templates', icon: FileCheck },
        { name: 'Dokumen Membership', href: '/admin/membership-documents', icon: FileText },
        { name: 'Generator Dokumen', href: '/documents/generator', icon: File },
      ]
    },
    {
      title: 'Sistem Supplier',
      items: [
        { name: 'Paket Supplier', href: '/admin/supplier/packages', icon: Package },
        { name: 'Pengguna Supplier', href: '/admin/supplier/users', icon: Users },
        { name: 'Produk Supplier', href: '/admin/supplier/products', icon: ShoppingBag },
        { name: 'Verifikasi Supplier', href: '/admin/supplier/verifications', icon: FileCheck },
      ]
    },
    {
      title: '🚀 Affiliate Booster Suite',
      items: [
        { name: 'Dashboard Affiliate', href: '/admin/affiliates', icon: Share2 },
        { name: 'Template Email', href: '/admin/affiliate/templates', icon: BookOpen },
        { name: 'Kelola Kredit', href: '/admin/affiliates/credits', icon: Coins },
        { name: 'Tantangan & Reward', href: '/admin/affiliates/challenges', icon: Trophy },
        { name: 'Payout Affiliate', href: '/admin/affiliates/payouts', icon: DollarSign },
      ]
    },
    {
      title: 'Marketing & Promosi',
      items: [
        { name: 'Banner & Iklan', href: '/admin/banners', icon: Target },
        { name: 'Materi Marketing', href: '/admin/marketing-kit', icon: ImageIcon },
        { name: 'Short Link', href: '/admin/short-links', icon: Zap },
      ]
    },
    {
      title: 'Keuangan',
      items: [
        { name: 'Penjualan', href: '/admin/sales', icon: ShoppingBag },
        { name: 'Follow Up Leads', href: '/admin/sales/follow-ups', icon: Send },
        { name: 'Transaksi', href: '/admin/transactions', icon: Wallet },
        { name: 'Konfirmasi Pembayaran', href: '/admin/payment-confirmation', icon: FileCheck },
        { name: 'Pending Revenue', href: '/admin/pending-revenue', icon: Clock },
        { name: 'Penarikan Dana', href: '/admin/payouts', icon: DollarSign },
        { name: 'Saldo Pengguna', href: '/admin/wallets', icon: CreditCard },
        { name: 'Laporan Keuangan', href: '/admin/reports', icon: FileText },
      ]
    },
    {
      title: 'Broadcast',
      items: [
        { name: 'Semua Campaign', href: '/admin/broadcast', icon: List },
        { name: 'Buat Campaign', href: '/admin/broadcast/create', icon: Send },
        { name: 'Statistik Broadcast', href: '/admin/broadcast/statistics', icon: BarChart3 },
        { name: 'Template Email & WA', href: '/admin/templates', icon: Mail },
        { name: 'Branded Templates', href: '/admin/branded-templates', icon: FileText },
      ]
    },
    {
      title: 'Pembelajaran Saya',
      items: [
        { name: 'Kursus Saya', href: '/learn', icon: BookOpen },
        { name: 'Jelajah Kursus', href: '/courses', icon: BookOpen },
        { name: 'Sertifikat Saya', href: '/certificates', icon: Award },
      ]
    },
    {
      title: 'Sistem & Integrasi',
      items: [
        { name: 'Dokumentasi', href: '/documentation', icon: Book },
        { name: 'Kelola Dokumentasi', href: '/admin/documentation', icon: Settings },
        { name: 'Mailketing Lists', href: '/admin/mailketing/lists', icon: List },
        { name: 'Push Notification', href: '/admin/onesignal', icon: Bell },
        { name: 'Integrasi API', href: '/admin/integrations', icon: Plug },
        { name: 'Test Starsender', href: '/admin/integrations/starsender-test', icon: Send },
      ]
    },
    {
      title: 'Pengaturan',
      items: [
        { name: 'Pengaturan Platform', href: '/admin/settings/platform', icon: Sliders },
        { name: 'Pengaturan Umum', href: '/admin/settings', icon: Settings },
        { name: 'Pengaturan Pembayaran', href: '/admin/settings/payment', icon: CreditCard },
        { name: 'Pengaturan Penarikan', href: '/admin/settings/withdrawal', icon: Wallet },
        { name: 'Pengaturan Follow-up', href: '/admin/settings/followup', icon: Bell },
        { name: 'Pengaturan Kelas', href: '/admin/settings/course', icon: GraduationCap },
      ]
    },
    {
      title: 'Akun Saya',
      items: [
        { name: 'Profil Saya', href: '/profile', icon: User },
        { name: 'Pengaturan Notifikasi', href: '/profile/notifications', icon: Bell },
      ]
    }
  ],
  MENTOR: [
    {
      title: 'Mengajar',
      items: [
        { name: 'Dashboard', href: '/mentor/dashboard', icon: Home },
        { name: 'Analytics', href: '/mentor/analytics', icon: BarChart3 },
        { name: 'Kursus Saya', href: '/mentor/courses', icon: BookOpen },
        { name: 'Siswa', href: '/mentor/students', icon: Users },
        { name: 'Kelas', href: '/mentor/classes', icon: Calendar },
      ]
    },
    {
      title: 'Pembelajaran',
      items: [
        { name: 'Belajar Kursus', href: '/learn', icon: BookOpen },
        { name: 'Jelajah Kursus', href: '/courses', icon: BookOpen },
        { name: 'Sertifikat Saya', href: '/certificates', icon: Award },
        { name: 'Dokumentasi', href: '/documentation', icon: Book },
      ]
    },
    {
      title: 'Membership',
      items: [
        { name: 'My Membership', href: '/dashboard/my-membership', icon: Crown },
        { name: 'Kursus Membership', href: '/dashboard/my-membership/courses', icon: BookOpen },
        { name: 'Produk Saya', href: '/my-products', icon: Package },
        { name: 'Upgrade', href: '/dashboard/upgrade', icon: Zap },
      ]
    },
    {
      title: 'Konten',
      items: [
        { name: 'Materi', href: '/mentor/materials', icon: FileText },
        { name: 'Tugas', href: '/mentor/assignments', icon: Target },
      ]
    },
    {
      title: 'Komunikasi',
      items: [
        { name: 'Chat', href: '/chat', icon: MessageSquare },
        { name: 'Notifikasi', href: '/notifications', icon: Bell },
      ]
    },
    {
      title: 'Komunitas',
      items: [
        { name: 'Feed Komunitas', href: '/community/feed', icon: MessageSquare },
        { name: 'Grup', href: '/community/groups', icon: UsersRound },
        { name: 'Acara', href: '/events', icon: Calendar },
        { name: 'Acara Saya', href: '/my-events', icon: Ticket },
        { name: 'Member Directory', href: '/member-directory', icon: MapPin },
      ]
    },
    {
      title: 'Database Ekspor',
      items: [
        { name: 'Buyer', href: '/databases/buyers', icon: Building2 },
        { name: 'Supplier', href: '/databases/suppliers', icon: Database },
        { name: 'Forwarder', href: '/databases/forwarders', icon: Truck },
        { name: 'Dokumen Ekspor', href: '/documents/export', icon: FileCheck },
        { name: 'Dokumen Membership', href: '/membership-documents', icon: FileText },
        { name: 'Generator Dokumen', href: '/documents/generator', icon: File },
      ]
    },
    {
      title: 'Bisnis',
      items: [
        { name: 'Produk', href: '/mentor/products', icon: ShoppingBag },
        { name: 'Pendapatan', href: '/mentor/earnings', icon: DollarSign },
        { name: 'Saldo Saya', href: '/mentor/wallet', icon: Wallet },
      ]
    },
    {
      title: 'Pengaturan',
      items: [
        { name: 'Profil Saya', href: '/profile', icon: User },
        { name: 'Pengaturan Notifikasi', href: '/profile/notifications', icon: Bell },
        { name: 'Pengaturan Mentor', href: '/mentor/profile', icon: Settings },
      ]
    }
  ],
  AFFILIATE: [
    {
      title: 'Ringkasan',
      items: [
        { name: 'Dashboard', href: '/affiliate/dashboard', icon: Home },
        { name: 'Performa', href: '/affiliate/performance', icon: TrendingUp },
      ]
    },
    {
      title: 'Booster Suite',
      items: [
        { name: 'Bio Page', href: '/affiliate/bio', icon: Layout },
        { name: 'Optin Forms', href: '/affiliate/optin-forms', icon: ClipboardList },
        { name: 'Leads (CRM)', href: '/affiliate/leads', icon: UserPlus },
        { name: 'Follow Up', href: '/affiliate/follow-ups', icon: Send },
        { name: 'Broadcast Email', href: '/affiliate/broadcast', icon: Mail },
        { name: 'Automation', href: '/affiliate/automation', icon: Zap },
        { name: 'Template Center', href: '/affiliate/templates', icon: BookOpen },
        { name: 'Kredit', href: '/affiliate/credits', icon: Coins },
      ]
    },
    {
      title: 'Affiliate',
      items: [
        { name: 'Link Affiliasi', href: '/affiliate/links', icon: Share2 },
        { name: 'Short Link', href: '/affiliate/short-links', icon: Zap },
        { name: 'Kupon', href: '/affiliate/coupons', icon: Ticket },
        { name: 'Statistik', href: '/affiliate/statistics', icon: BarChart3 },
        { name: 'Konversi', href: '/affiliate/conversions', icon: Target },
        { name: 'Materi', href: '/affiliate/materials', icon: FileText },
        { name: 'Panduan', href: '/affiliate/training', icon: BookOpen },
        { name: 'Dokumentasi', href: '/documentation', icon: Book },
      ]
    },
    {
      title: 'Keuangan',
      items: [
        { name: 'Tantangan', href: '/affiliate/challenges', icon: Trophy },
        { name: 'Penghasilan', href: '/affiliate/earnings', icon: DollarSign },
        { name: 'Saldo Saya', href: '/affiliate/wallet', icon: CreditCard },
        { name: 'Penarikan', href: '/affiliate/payouts', icon: Wallet },
      ]
    },
    {
      title: 'Komunikasi',
      items: [
        { name: 'Chat', href: '/chat', icon: MessageSquare },
        { name: 'Notifikasi', href: '/notifications', icon: Bell },
      ]
    },
    {
      title: 'Pengaturan',
      items: [
        { name: 'Profil Saya', href: '/profile', icon: User },
        { name: 'Pengaturan Notifikasi', href: '/profile/notifications', icon: Bell },
        { name: 'Pengaturan Affiliate', href: '/affiliate/profile', icon: Settings },
      ]
    }
  ],
  MEMBER_PREMIUM: [
    {
      title: 'Pembelajaran',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Kursus Saya', href: '/learn', icon: BookOpen },
        { name: 'Jelajah Kursus', href: '/courses', icon: BookOpen },
        { name: 'Sertifikat Saya', href: '/certificates', icon: Award },
        { name: 'Dokumentasi', href: '/documentation', icon: Book },
      ]
    },
    {
      title: 'Komunikasi',
      items: [
        { name: 'Chat', href: '/chat', icon: MessageSquare },
        { name: 'Notifikasi', href: '/notifications', icon: Bell },
      ]
    },
    {
      title: 'Membership',
      items: [
        { name: 'My Membership', href: '/dashboard/my-membership', icon: Crown },
        { name: 'Kursus Membership', href: '/dashboard/my-membership/courses', icon: BookOpen },
        { name: 'Produk Saya', href: '/my-products', icon: Package },
        { name: 'Riwayat Transaksi', href: '/dashboard/transactions', icon: Receipt },
        { name: 'Upgrade', href: '/dashboard/upgrade', icon: Zap },
      ]
    },
    {
      title: 'Komunitas',
      items: [
        { name: 'Feed Komunitas', href: '/community/feed', icon: MessageSquare },
        { name: 'Grup', href: '/community/groups', icon: UsersRound },
        { name: 'Acara', href: '/community/events', icon: Calendar },
        { name: 'Acara Saya', href: '/my-events', icon: Ticket },
        { name: 'Postingan Tersimpan', href: '/saved-posts', icon: Bookmark },
        { name: 'Member Directory', href: '/member-directory', icon: MapPin },
      ]
    },
    {
      title: 'Database Ekspor',
      items: [
        { name: 'Buyer', href: '/databases/buyers', icon: Building2 },
        { name: 'Supplier', href: '/databases/suppliers', icon: Database },
        { name: 'Forwarder', href: '/databases/forwarders', icon: Truck },
        { name: 'Dokumen Ekspor', href: '/documents/export', icon: FileCheck },
        { name: 'Dokumen Membership', href: '/membership-documents', icon: FileText },
        { name: 'Generator Dokumen', href: '/documents/generator', icon: File },
      ]
    },
    {
      title: 'Supplier',
      items: [
        { name: 'Supplier Dashboard', href: '/supplier/dashboard', icon: Home },
        { name: 'My Products', href: '/supplier/products', icon: Package },
        { name: 'Profile Settings', href: '/supplier/profile', icon: Settings },
        { name: 'Upgrade Paket', href: '/pricing/supplier', icon: TrendingUp },
      ]
    },
    {
      title: 'Akun',
      items: [
        { name: 'Saldo Saya', href: '/dashboard/wallet', icon: Wallet },
        { name: 'Profil Saya', href: '/profile', icon: User },
        { name: 'Pengaturan Notifikasi', href: '/profile/notifications', icon: Bell },
      ]
    }
  ],
  MEMBER_FREE: [
    {
      title: 'Akun',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Profil Saya', href: '/profile', icon: User },
        { name: 'Notifikasi', href: '/notifications', icon: Bell },
        { name: 'Riwayat Transaksi', href: '/dashboard/transactions', icon: Receipt },
        { name: 'Dokumentasi', href: '/documentation', icon: Book },
      ]
    },
    {
      title: 'Komunitas',
      items: [
        { name: 'Feed Komunitas', href: '/community/feed', icon: MessageSquare },
        { name: 'Grup', href: '/community/groups', icon: UsersRound },
        { name: 'Acara', href: '/community/events', icon: Calendar },
        { name: 'Acara Saya', href: '/my-events', icon: Ticket },
      ]
    },
    {
      title: 'Membership',
      items: [
        { name: 'My Membership', href: '/dashboard/my-membership', icon: Crown },
        { name: '🚀 Upgrade Premium', href: '/dashboard/upgrade', icon: Zap, badge: '🔥' },
      ]
    },
  ]
}

export default function DashboardSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)
  const [notifUnread, setNotifUnread] = useState(0)
  const [affiliateMenuEnabled, setAffiliateMenuEnabled] = useState(false)
  const [hasAffiliateProfile, setHasAffiliateProfile] = useState(false)
  const [affiliateStatus, setAffiliateStatus] = useState<string | null>(null)
  
  const userRole = session?.user?.role || 'MEMBER_FREE'
  const theme = getRoleTheme(userRole)

  // Fetch affiliate menu status for non-affiliate users
  useEffect(() => {
    if (!session?.user?.id || userRole === 'AFFILIATE') return

    const fetchAffiliateStatus = async () => {
      try {
        const res = await fetch('/api/user/affiliate-status')
        if (res.ok) {
          const data = await res.json()
          setAffiliateMenuEnabled(data.affiliateMenuEnabled || false)
          setHasAffiliateProfile(data.hasAffiliateProfile || false)
          setAffiliateStatus(data.applicationStatus || null)
        }
      } catch (error) {
        console.error('Failed to fetch affiliate status:', error)
      }
    }

    fetchAffiliateStatus()
  }, [session?.user?.id, userRole])

  // Initialize collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === 'true')
    }
  }, [])

  // Save collapsed state to localStorage when it changes
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('sidebarCollapsed', newCollapsed.toString())
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'))
    // Trigger custom event for ResponsivePageWrapper
    window.dispatchEvent(new Event('sidebarToggle'))
  }
  
  // Fetch unread counts
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchUnreadCounts = async () => {
      try {
        // Fetch chat unread count
        const chatRes = await fetch('/api/chat/rooms')
        if (chatRes.ok) {
          const chatData = await chatRes.json()
          setChatUnread(chatData.totalUnread || 0)
        }

        // Fetch notification unread count
        const notifRes = await fetch('/api/notifications?limit=1')
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          setNotifUnread(notifData.unreadCount || 0)
        }
      } catch (error) {
        console.error('Failed to fetch unread counts:', error)
      }
    }

    fetchUnreadCounts()

    // Setup Pusher for real-time updates
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      })

      const channel = pusher.subscribe(`user-${session.user.id}`)
      
      // Listen for new messages
      channel.bind('new-message', () => {
        setChatUnread(prev => prev + 1)
      })

      // Listen for message read
      channel.bind('message-read', (data: { roomId: string, count: number }) => {
        setChatUnread(prev => Math.max(0, prev - data.count))
      })

      // Listen for new notifications
      channel.bind('notification', () => {
        setNotifUnread(prev => prev + 1)
      })

      // Listen for notification read
      channel.bind('notification-read', (data: { count: number }) => {
        setNotifUnread(prev => Math.max(0, prev - data.count))
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [session?.user?.id])

  // Update navigation items with badges
  const updateCategoriesWithBadges = (categories: NavCategory[]): NavCategory[] => {
    return categories.map(category => ({
      ...category,
      items: category.items.map(item => {
        if (item.href === '/chat' && chatUnread > 0) {
          return { ...item, badge: chatUnread.toString() }
        }
        if ((item.href === '/notifications' || item.href === '/admin/notifications') && notifUnread > 0) {
          return { ...item, badge: notifUnread.toString() }
        }
        return item
      })
    }))
  }

  // Get base navigation by role
  let baseNavigation = navigationByRole[userRole as keyof typeof navigationByRole] || navigationByRole.MEMBER_FREE
  
  // Add affiliate menu for non-affiliate users if affiliateMenuEnabled
  if (affiliateMenuEnabled && userRole !== 'AFFILIATE') {
    const affiliateMenuCategory: NavCategory = {
      title: 'Program Affiliate',
      items: hasAffiliateProfile && affiliateStatus === 'APPROVED'
        ? [
            // Full affiliate menu for approved users
            { name: 'Dashboard Affiliate', href: '/affiliate/dashboard', icon: Home },
            { name: 'Link Affiliasi', href: '/affiliate/links', icon: Share2 },
            { name: 'Kredit Broadcast', href: '/affiliate/credits', icon: CreditCard },
            { name: 'Statistik', href: '/affiliate/statistics', icon: BarChart3 },
            { name: 'Penghasilan', href: '/affiliate/earnings', icon: DollarSign },
          ]
        : hasAffiliateProfile && affiliateStatus === 'PENDING'
        ? [
            // Pending application - redirect to status page
            { name: '⏳ Menunggu Approval', href: '/dashboard/affiliate-status', icon: Clock },
          ]
        : hasAffiliateProfile && affiliateStatus === 'REJECTED'
        ? [
            // Rejected - show status and option to reapply
            { name: '❌ Aplikasi Ditolak', href: '/dashboard/affiliate-status', icon: XCircle },
          ]
        : [
            // Not yet applied
            { name: 'Jadi Affiliate', href: '/dashboard/apply-affiliate', icon: Share2 },
          ]
    }
    baseNavigation = [...baseNavigation, affiliateMenuCategory]
  }
  
  const categoriesWithBadges = updateCategoriesWithBadges(baseNavigation)

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-lg border border-gray-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          // Desktop
          'lg:translate-x-0',
          collapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile
          'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!collapsed && (
            <Link href={
              userRole === 'ADMIN' ? '/admin' :
              userRole === 'MENTOR' ? '/mentor/dashboard' :
              userRole === 'AFFILIATE' ? '/affiliate/dashboard' :
              '/dashboard'
            } className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: theme.primary }}
              >
                {theme.icon}
              </div>
              <span className="font-bold text-lg" style={{ color: theme.primary }}>
                Eksporyuk
              </span>
            </Link>
          )}
          {collapsed && (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg font-bold mx-auto"
              style={{ backgroundColor: theme.primary }}
            >
              {theme.icon}
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {categoriesWithBadges.map((category, idx) => (
            <div key={idx}>
              {!collapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category.title}
                </h3>
              )}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                      style={isActive ? { backgroundColor: theme.primary } : {}}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={cn('w-5 h-5 flex-shrink-0', collapsed && 'mx-auto')} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.name}</span>
                          {'badge' in item && item.badge && (
                            <span 
                            className="px-2 py-0.5 text-xs font-semibold rounded-full"
                            style={{ 
                              backgroundColor: theme.accent + '20',
                              color: theme.primary 
                            }}
                          >
                            {item.badge as React.ReactNode}
                          </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
              style={{ backgroundColor: theme.primary }}
            >
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs truncate" style={{ color: theme.primary }}>
                  {userRole.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer - Hidden on mobile, visible on desktop */}
      <div className={cn('hidden lg:block transition-all duration-300', collapsed ? 'w-20' : 'w-64')} />
    </>
  )
}
