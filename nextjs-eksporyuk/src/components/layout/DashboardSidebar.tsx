'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useSettings } from '@/components/providers/SettingsProvider'
import RoleSwitcher from '@/components/dashboard/RoleSwitcher'
import { usePendingTransactions } from '@/hooks/usePendingTransactions'
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
  Wallet,
  Settings,
  MessageSquare,
  BarChart3,
  Plug,
  ChevronLeft,
  TrendingUp,
  DollarSign,
  Target,
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
  ShieldCheck,
  Store,
  LogOut,
  Sun,
  Moon,
  Globe,
} from 'lucide-react'

type NavItem = {
  name: string
  href: string
  icon: any
  badge?: string
  badgeType?: 'pending' | 'new' | 'default'
}

type NavCategory = {
  title: string
  items: NavItem[]
  condition?: (session: any) => boolean
}

// Navigation config by role
const navigationByRole = {
  ADMIN: [
    {
      title: 'RINGKASAN',
      items: [
        { name: 'Dashboard', href: '/admin', icon: Home },
        { name: 'Analitik', href: '/admin/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'MEMBERSHIP',
      items: [
        { name: 'Fitur Membership', href: '/admin/features', icon: Zap },
        { name: 'Paket Membership', href: '/admin/membership-plans', icon: Package },
        { name: 'Kelola Member', href: '/admin/membership', icon: Users },
        { name: 'Dokumen Membership', href: '/admin/membership-documents', icon: FileText },
      ]
    },
    {
      title: 'PENGGUNA',
      items: [
        { name: 'Semua Pengguna', href: '/admin/users', icon: Users },
        { name: 'Direktori Member', href: '/admin/member-directory', icon: MapPin },
        { name: 'Wallet Pengguna', href: '/admin/wallets', icon: Wallet },
      ]
    },
    {
      title: 'PRODUK',
      items: [
        { name: 'Produk Digital', href: '/admin/products', icon: ShoppingBag },
        { name: 'Kupon & Diskon', href: '/admin/coupons', icon: Tag },
        { name: 'Sales Page', href: '/admin/salespage', icon: Layout },
      ]
    },
    {
      title: 'KURSUS',
      items: [
        { name: 'Semua Kursus', href: '/admin/courses', icon: BookOpen },
        { name: 'Pendaftaran', href: '/admin/enrollments', icon: Users },
        { name: 'Review Kursus', href: '/admin/course-reviews', icon: Star },
        { name: 'Course Consents', href: '/admin/course-consents', icon: ShieldCheck },
        { name: 'Quiz', href: '/admin/quiz', icon: ClipboardList },
        { name: 'Sertifikat', href: '/admin/certificates', icon: Award },
        { name: 'Template Sertifikat', href: '/admin/certificate-templates', icon: FileCheck },
      ]
    },
    {
      title: 'KOMUNITAS',
      items: [
        { name: 'Feed Komunitas', href: '/community/feed', icon: MessageSquare },
        { name: 'Grup Komunitas', href: '/community/groups', icon: UsersRound },
        { name: 'Feed (Admin)', href: '/admin/feed', icon: MessageSquare },
        { name: 'Grup (Admin)', href: '/admin/groups', icon: UsersRound },
        { name: 'Acara', href: '/admin/events', icon: Calendar },
      ]
    },
    {
      title: 'DATABASE',
      items: [
        { name: 'Data Buyer', href: '/admin/databases/buyers', icon: Building2 },
        { name: 'Data Supplier', href: '/admin/databases/suppliers', icon: Database },
        { name: 'Data Forwarder', href: '/admin/databases/forwarders', icon: Truck },
        { name: 'Dokumen', href: '/admin/documents', icon: FileText },
        { name: 'Import Data', href: '/admin/import', icon: Database },
      ]
    },
    {
      title: 'SUPPLIER',
      items: [
        { name: 'Semua Supplier', href: '/admin/supplier', icon: Building2 },
        { name: 'Paket Supplier', href: '/admin/supplier/packages', icon: Package },
        { name: 'Verifikasi', href: '/admin/supplier/verifications', icon: FileCheck },
      ]
    },
    {
      title: 'AFFILIATE',
      items: [
        { name: 'Dashboard Affiliate', href: '/admin/affiliates', icon: Share2 },
        { name: 'Short Links', href: '/admin/short-links', icon: Zap },
        { name: 'Leaderboard', href: '/admin/leaderboard', icon: Trophy },
        { name: 'Template Email', href: '/admin/affiliate/templates', icon: BookOpen },
        { name: 'Tantangan', href: '/admin/affiliates/challenges', icon: Target },
        { name: 'Payout', href: '/admin/affiliates/payouts', icon: DollarSign },
      ]
    },
    {
      title: 'MARKETING',
      items: [
        { name: 'Broadcast', href: '/admin/broadcast', icon: Send },
        { name: 'Campaigns', href: '/admin/campaigns', icon: Target },
        { name: 'Template Notifikasi', href: '/admin/templates', icon: Mail },
        { name: 'Branded Templates', href: '/admin/branded-templates', icon: FileCheck },
        { name: 'Marketing Kit', href: '/admin/marketing-kit', icon: Package },
        { name: 'Banner', href: '/admin/banners', icon: Layout },
      ]
    },
    {
      title: 'KEUANGAN',
      items: [
        { name: 'Penjualan', href: '/admin/sales', icon: ShoppingBag },
        { name: 'Konfirmasi Bayar', href: '/admin/payment-confirmation', icon: CreditCard },
        { name: 'Pending Revenue', href: '/admin/pending-revenue', icon: Clock },
        { name: 'Penarikan', href: '/admin/payouts', icon: DollarSign },
        { name: 'Laporan', href: '/admin/reports', icon: FileText },
      ]
    },
    {
      title: 'SISTEM',
      items: [
        { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
        { name: 'Platform Settings', href: '/admin/settings/platform', icon: Globe },
        { name: 'Affiliate Settings', href: '/admin/settings/affiliate', icon: Share2 },
        { name: 'Course Settings', href: '/admin/settings/course', icon: BookOpen },
        { name: 'Withdrawal Settings', href: '/admin/settings/withdrawal', icon: DollarSign },
        { name: 'Follow-up Settings', href: '/admin/settings/followup', icon: Clock },
        { name: 'Integrasi', href: '/admin/integrations', icon: Plug },
        { name: 'Mailketing', href: '/admin/mailketing', icon: Mail },
        { name: 'OneSignal', href: '/admin/onesignal', icon: Bell },
        { name: 'Support', href: '/admin/support', icon: MessageSquare },
        { name: 'Dokumentasi', href: '/admin/documentation', icon: Book },
      ]
    },
  ],
  MENTOR: [
    {
      title: 'MENGAJAR',
      items: [
        { name: 'Dashboard', href: '/mentor/dashboard', icon: Home },
        { name: 'Analytics', href: '/mentor/analytics', icon: BarChart3 },
        { name: 'Kursus Saya', href: '/mentor/courses', icon: BookOpen },
        { name: 'Siswa', href: '/mentor/students', icon: Users },
      ]
    },
    {
      title: 'PEMBELAJARAN',
      items: [
        { name: 'Belajar Kursus', href: '/mentor/learn', icon: BookOpen },
        { name: 'Jelajah Kursus', href: '/mentor/explore-courses', icon: GraduationCap },
        { name: 'Sertifikat Saya', href: '/mentor/certificates', icon: Award },
      ]
    },
    {
      title: 'MEMBERSHIP',
      items: [
        { name: 'My Membership', href: '/mentor/my-membership', icon: Crown },
        { name: 'Produk Saya', href: '/mentor/my-products', icon: Package },
        { name: 'Upgrade', href: '/mentor/upgrade', icon: Zap },
      ]
    },
    {
      title: 'KOMUNITAS',
      items: [
        { name: 'Feed', href: '/mentor/community/feed', icon: MessageSquare },
        { name: 'Grup', href: '/mentor/community/groups', icon: UsersRound },
        { name: 'Acara', href: '/mentor/events', icon: Calendar },
        { name: 'Region', href: '/mentor/member-directory', icon: MapPin },
      ]
    },
    {
      title: 'DATABASE',
      items: [
        { name: 'Buyer', href: '/mentor/databases/buyers', icon: Building2 },
        { name: 'Supplier', href: '/mentor/databases/suppliers', icon: Database },
        { name: 'Forwarder', href: '/mentor/databases/forwarders', icon: Truck },
        { name: 'Dokumen', href: '/mentor/documents', icon: FileText },
      ]
    },
    {
      title: 'BISNIS',
      items: [
        { name: 'Pendapatan', href: '/mentor/earnings', icon: DollarSign },
        { name: 'Saldo Saya', href: '/mentor/wallet', icon: Wallet },
      ]
    },
    {
      title: 'PENGATURAN',
      items: [
        { name: 'Profil Saya', href: '/mentor/user-profile', icon: User },
        { name: 'Pengaturan', href: '/mentor/profile', icon: Settings },
      ]
    },
  ],
  AFFILIATE: [
    {
      title: 'RINGKASAN',
      items: [
        { name: 'Dashboard', href: '/affiliate/dashboard', icon: Home },
        { name: 'Performa', href: '/affiliate/performance', icon: TrendingUp },
      ]
    },
    // Hide BOOSTER SUITE in production, only show in development
    ...(process.env.NODE_ENV === 'development' ? [{
      title: 'BOOSTER SUITE',
      items: [
        { name: 'Bio Page', href: '/affiliate/bio', icon: Layout },
        { name: 'Optin Forms', href: '/affiliate/optin-forms', icon: ClipboardList },
        { name: 'Leads (CRM)', href: '/affiliate/leads', icon: UserPlus },
        { name: 'Follow Up', href: '/affiliate/follow-ups', icon: Send },
        { name: 'Broadcast', href: '/affiliate/broadcast', icon: Mail },
        { name: 'Automation', href: '/affiliate/automation', icon: Zap },
        { name: 'Kredit', href: '/affiliate/credits', icon: Coins },
      ]
    }] : []),
    {
      title: 'AFFILIATE',
      items: [
        { name: 'Link Affiliasi', href: '/affiliate/links', icon: Share2 },
        { name: 'Short Link', href: '/affiliate/short-links', icon: Zap },
        { name: 'Kupon', href: '/affiliate/coupons', icon: Ticket },
        { name: 'Statistik', href: '/affiliate/statistics', icon: BarChart3 },
        { name: 'Konversi', href: '/affiliate/conversions', icon: Target },
        { name: 'Materi', href: '/affiliate/materials', icon: FileText },
      ]
    },
    {
      title: 'KEUANGAN',
      items: [
        { name: 'Tantangan', href: '/affiliate/challenges', icon: Trophy },
        { name: 'Penghasilan', href: '/affiliate/earnings', icon: DollarSign },
        { name: 'Saldo Saya', href: '/affiliate/wallet', icon: CreditCard },
        { name: 'Penarikan', href: '/affiliate/payouts', icon: Wallet },
      ]
    },
    {
      title: 'PENGATURAN',
      items: [
        { name: 'Profil Saya', href: '/affiliate/user-profile', icon: User },
        { name: 'Pengaturan', href: '/affiliate/profile', icon: Settings },
      ]
    },
  ],
  MEMBER_PREMIUM: [
    {
      title: 'UTAMA',
      items: [
        { name: 'Dashboard', href: '/member/dashboard', icon: Home },
        { name: 'Kelas', href: '/member/learn', icon: GraduationCap },
        { name: 'Grup', href: '/member/community/groups', icon: UsersRound },
      ]
    },
    {
      title: 'PEMBELAJARAN',
      items: [
        { name: 'Kursus Saya', href: '/member/learn', icon: BookOpen },
        { name: 'Jelajah Kursus', href: '/member/courses', icon: GraduationCap },
        { name: 'Sertifikat', href: '/member/certificates', icon: Award },
      ]
    },
    {
      title: 'KOMUNITAS',
      items: [
        { name: 'Feed', href: '/member/community/feed', icon: MessageSquare },
        { name: 'Grup', href: '/member/community/groups', icon: UsersRound },
        { name: 'Acara', href: '/member/community/events', icon: Calendar },
        { name: 'Region', href: '/member/member-directory', icon: MapPin },
        { name: 'Tersimpan', href: '/member/saved-posts', icon: Bookmark },
      ]
    },
    {
      title: 'DATABASE',
      items: [
        { name: 'Buyer', href: '/member/databases/buyers', icon: Building2 },
        { name: 'Supplier', href: '/member/databases/suppliers', icon: Database },
        { name: 'Forwarder', href: '/member/databases/forwarders', icon: Truck },
        { name: 'Dokumen', href: '/member/documents', icon: FileText },
      ]
    },
    {
      title: 'MEMBERSHIP',
      items: [
        { name: 'My Membership', href: '/member/my-membership', icon: Crown },
        { name: 'Produk Saya', href: '/member/my-products', icon: Package },
        { name: 'Tagihan Saya', href: '/member/billing', icon: Receipt },
        { name: 'Riwayat Transaksi', href: '/member/transactions', icon: CreditCard },
        { name: 'Upgrade', href: '/member/upgrade', icon: Zap },
      ]
    },
    {
      title: 'AKUN',
      items: [
        { name: 'Saldo Saya', href: '/member/wallet', icon: Wallet },
        { name: 'Profil Saya', href: '/member/profile', icon: User },
      ]
    },
  ],
  MEMBER_FREE: [
    {
      title: 'UTAMA',
      items: [
        { name: 'Dashboard', href: '/member-free/dashboard', icon: Home },
        { name: 'Profil Saya', href: '/member-free/profile', icon: User },
      ]
    },
    {
      title: 'KOMUNITAS',
      items: [
        { name: 'Feed', href: '/pricing', icon: MessageSquare, badge: '🔒', condition: () => false },
        { name: 'Grup', href: '/pricing', icon: UsersRound, badge: '🔒', condition: () => false },
        { name: 'Acara', href: '/pricing', icon: Calendar, badge: '🔒', condition: () => false },
      ]
    },
    {
      title: 'MEMBERSHIP',
      items: [
        { name: 'My Membership', href: '/member-free/my-membership', icon: Crown },
        { name: 'Tagihan Saya', href: '/member-free/billing', icon: Receipt },
        { name: '🚀 Upgrade Premium', href: '/member-free/upgrade', icon: Zap, badge: '🔥' },
      ]
    },
  ],
  SUPPLIER: [
    {
      title: 'DASHBOARD',
      items: [
        { name: 'Dashboard', href: '/supplier/dashboard', icon: Home },
        { name: 'Analitik', href: '/supplier/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'PRODUK',
      items: [
        { name: 'Produk Saya', href: '/supplier/products', icon: Package },
        { name: 'Tambah Produk', href: '/supplier/products/create', icon: UserPlus },
      ]
    },
    {
      title: 'PROFIL',
      items: [
        { name: 'Profil Perusahaan', href: '/supplier/profile', icon: Building2 },
        { name: 'Upgrade Paket', href: '/pricing/supplier', icon: TrendingUp },
      ]
    },
    {
      title: 'AKUN',
      items: [
        { name: 'Profil Saya', href: '/supplier/user-profile', icon: User },
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
  const [darkMode, setDarkMode] = useState(false)
  const { hasPending, transactions, loading: pendingLoading } = usePendingTransactions()
  
  const userRole = session?.user?.role || 'MEMBER_FREE'
  const allRoles = session?.user?.allRoles || [userRole]
  const preferredDashboard = session?.user?.preferredDashboard || null
  const { settings } = useSettings()

  // Detect current dashboard context from pathname AND preferredDashboard
  // This ensures menu stays consistent when navigating to shared pages
  const getCurrentDashboardContext = (): string => {
    // Role-specific paths ALWAYS take precedence (explicit dashboard routes)
    if (pathname?.startsWith('/admin')) return 'ADMIN'
    if (pathname?.startsWith('/mentor')) return 'MENTOR'
    if (pathname?.startsWith('/affiliate')) return 'AFFILIATE'
    if (pathname?.startsWith('/supplier')) return 'SUPPLIER'
    if (pathname?.startsWith('/member-free')) return 'MEMBER_FREE'
    if (pathname?.startsWith('/member')) return 'MEMBER_PREMIUM'
    
    // For ALL other paths, use preferredDashboard if set
    // This includes: /dashboard/*, /learn, /courses, /community/*, /profile, etc.
    // User's preferred dashboard should persist across all non-role-specific pages
    if (preferredDashboard) {
      switch (preferredDashboard) {
        case 'admin':
          if (allRoles.includes('ADMIN')) return 'ADMIN'
          break
        case 'mentor':
          if (allRoles.includes('MENTOR') || allRoles.includes('ADMIN')) return 'MENTOR'
          break
        case 'affiliate':
          if (allRoles.includes('AFFILIATE') || allRoles.includes('ADMIN')) return 'AFFILIATE'
          break
        case 'member':
          return userRole === 'MEMBER_FREE' ? 'MEMBER_FREE' : 'MEMBER_PREMIUM'
        case 'member-free':
          return 'MEMBER_FREE'
      }
    }
    
    // Fallback: If no preferredDashboard, use primary role
    // But for AFFILIATE/MENTOR primary roles accessing member pages, show member menu
    const memberPaths = ['/dashboard', '/community', '/learn', '/courses', '/chat', '/profile', '/notifications', '/certificates', '/saved-posts', '/member-directory', '/my-events', '/databases', '/documents', '/wallet']
    if (memberPaths.some(path => pathname?.startsWith(path))) {
      return userRole === 'MEMBER_FREE' ? 'MEMBER_FREE' : 'MEMBER_PREMIUM'
    }
    
    // Final fallback to primary role
    return userRole === 'MEMBER_FREE' ? 'MEMBER_FREE' : (userRole || 'MEMBER_PREMIUM')
  }
  
  const currentDashboardContext = getCurrentDashboardContext()

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true'
      setDarkMode(isDark)
      document.documentElement.classList.toggle('dark', isDark)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [])

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    document.documentElement.classList.toggle('dark', newDarkMode)
  }

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

  // Save collapsed state
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('sidebarCollapsed', newCollapsed.toString())
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new Event('sidebarToggle'))
  }
  
  // Fetch unread counts
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchUnreadCounts = async () => {
      try {
        const chatRes = await fetch('/api/chat/rooms')
        if (chatRes.ok) {
          const chatData = await chatRes.json()
          setChatUnread(chatData.totalUnread || 0)
        }

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
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (typeof window !== 'undefined' && pusherKey) {
      const pusher = new Pusher(pusherKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
      })

      const channel = pusher.subscribe(`user-${session.user.id}`)
      
      channel.bind('new-message', () => setChatUnread(prev => prev + 1))
      channel.bind('message-read', (data: { count: number }) => setChatUnread(prev => Math.max(0, prev - data.count)))
      channel.bind('notification', () => setNotifUnread(prev => prev + 1))
      channel.bind('notification-read', (data: { count: number }) => setNotifUnread(prev => Math.max(0, prev - data.count)))

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [session?.user?.id])

  // Update navigation items with badges
  const updateCategoriesWithBadges = (categories: NavCategory[]): NavCategory[] => {
    return categories
      .filter(category => !category.condition || category.condition(session))
      .map(category => ({
        ...category,
        items: category.items
          // Filter out Upgrade Premium if user has pending transaction
          .filter(item => {
            if (item.href === '/dashboard/upgrade' && hasPending && transactions.length > 0) {
              return false // Hide Upgrade menu when has pending
            }
            return true
          })
          .map(item => {
            if (item.href === '/chat' && chatUnread > 0) {
              return { ...item, badge: chatUnread.toString() }
            }
            if ((item.href === '/notifications') && notifUnread > 0) {
              return { ...item, badge: notifUnread.toString() }
            }
            // Add badge to Tagihan Saya if there are pending transactions
            if (item.href === '/dashboard/billing' && hasPending && transactions.length > 0) {
              return { ...item, badge: transactions.length.toString(), badgeType: 'pending' }
            }
            return item
          })
      }))
  }

  // Get base navigation by current dashboard context (not just primary role)
  // This allows users with additional roles to see proper menu when they switch dashboards
  let baseNavigation = navigationByRole[currentDashboardContext as keyof typeof navigationByRole] || navigationByRole.MEMBER_FREE
  
  // Add affiliate menu for non-affiliate users if enabled
  if (affiliateMenuEnabled && userRole !== 'AFFILIATE') {
    if (hasAffiliateProfile && affiliateStatus === 'APPROVED') {
      // Full affiliate menu for approved affiliates (same as AFFILIATE role)
      const fullAffiliateMenu: NavCategory[] = [
        {
          title: 'PROGRAM AFFILIATE',
          items: [
            { name: 'Dashboard', href: '/affiliate/dashboard', icon: Home },
            { name: 'Performa', href: '/affiliate/performance', icon: TrendingUp },
          ]
        },
        // Hide BOOSTER SUITE in production, only show in development
        ...(process.env.NODE_ENV === 'development' ? [{
          title: 'BOOSTER SUITE',
          items: [
            { name: 'Bio Page', href: '/affiliate/bio', icon: Layout },
            { name: 'Optin Forms', href: '/affiliate/optin-forms', icon: ClipboardList },
            { name: 'Leads (CRM)', href: '/affiliate/leads', icon: UserPlus },
            { name: 'Follow Up', href: '/affiliate/follow-ups', icon: Send },
            { name: 'Broadcast', href: '/affiliate/broadcast', icon: Mail },
            { name: 'Automation', href: '/affiliate/automation', icon: Zap },
            { name: 'Kredit', href: '/affiliate/credits', icon: Coins },
          ]
        }] : []),
        {
          title: 'AFFILIATE',
          items: [
            { name: 'Link Affiliasi', href: '/affiliate/links', icon: Share2 },
            { name: 'Short Link', href: '/affiliate/short-links', icon: Zap },
            { name: 'Kupon', href: '/affiliate/coupons', icon: Ticket },
            { name: 'Statistik', href: '/affiliate/statistics', icon: BarChart3 },
            { name: 'Konversi', href: '/affiliate/conversions', icon: Target },
            { name: 'Materi', href: '/affiliate/materials', icon: FileText },
          ]
        },
        {
          title: 'KEUANGAN',
          items: [
            { name: 'Tantangan', href: '/affiliate/challenges', icon: Trophy },
            { name: 'Penghasilan', href: '/affiliate/earnings', icon: DollarSign },
            { name: 'Saldo Saya', href: '/affiliate/wallet', icon: CreditCard },
            { name: 'Penarikan', href: '/affiliate/payouts', icon: Wallet },
          ]
        },
      ]
      baseNavigation = [...baseNavigation, ...fullAffiliateMenu]
    } else {
      // Status menu for pending/rejected/not-applied
      const affiliateStatusMenu: NavCategory = {
        title: 'PROGRAM AFFILIATE',
        items: hasAffiliateProfile && affiliateStatus === 'PENDING'
          ? [{ name: '⏳ Menunggu Approval', href: '/dashboard/affiliate-status', icon: Clock }]
          : hasAffiliateProfile && affiliateStatus === 'REJECTED'
          ? [{ name: '❌ Aplikasi Ditolak', href: '/dashboard/affiliate-status', icon: XCircle }]
          : [{ name: 'Jadi Affiliate', href: '/dashboard/apply-affiliate', icon: Share2 }]
      }
      baseNavigation = [...baseNavigation, affiliateStatusMenu]
    }
  }
  
  const categoriesWithBadges = updateCategoriesWithBadges(baseNavigation)

  // Get logo based on role
  const getLogo = () => {
    // For affiliate, could use different logo if configured
    return settings.siteLogo || '/logo.png'
  }

  const getDashboardUrl = () => {
    // Use current dashboard context instead of primary role
    if (currentDashboardContext === 'ADMIN') return '/admin'
    if (currentDashboardContext === 'MENTOR') return '/mentor/dashboard'
    if (currentDashboardContext === 'AFFILIATE') return '/affiliate/dashboard'
    if (currentDashboardContext === 'SUPPLIER') return '/supplier/dashboard'
    return '/dashboard'
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

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
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
          'lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-60',
          'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800">
          <Link href={getDashboardUrl()} className="flex items-center gap-3">
            {settings.siteLogo ? (
              /* When logo is uploaded - show only the logo image (no green box, no text) */
              <div className="flex items-center">
                <Image 
                  src={getLogo()} 
                  alt="Logo" 
                  width={collapsed ? 32 : 140} 
                  height={32} 
                  className={cn(
                    "object-contain",
                    collapsed ? "w-8 h-8" : "h-8 w-auto max-w-[140px]"
                  )}
                />
              </div>
            ) : (
              /* Fallback when no logo uploaded - show green box + text */
              <>
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                {!collapsed && (
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {userRole === 'AFFILIATE' ? 'Affiliate' : 'Eksporyuk'}
                  </span>
                )}
              </>
            )}
          </Link>
          
          {/* Collapse Button */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
          
          {/* Mobile Close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {categoriesWithBadges.map((category, idx) => (
            <div key={idx} className="mb-6">
              {/* Category Title */}
              {!collapsed && (
                <h3 className="px-3 mb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {category.title}
                </h3>
              )}
              
              {/* Menu Items */}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-gray-600 hover:bg-gray-100',
                        collapsed && 'justify-center px-0'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-emerald-600')} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.badge && (
                            <span className={cn(
                              'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                              item.badge === 'NEW' || item.badge === '🔥'
                                ? 'bg-orange-100 text-orange-600'
                                : (item as any).badgeType === 'pending'
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'bg-emerald-100 text-emerald-600'
                            )}>
                              {item.badge}
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

        {/* Footer Section */}
        <div className="border-t border-gray-200 p-3 space-y-2">
          {/* Role Switcher - only shows for multi-role users */}
          <RoleSwitcher collapsed={collapsed} />

          {/* User Profile */}
          <div className={cn(
            'flex items-center gap-3 px-3 py-2',
            collapsed && 'justify-center px-0'
          )}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
              {session?.user?.avatar ? (
                <Image
                  src={session.user.avatar}
                  alt={session.user.name || 'User'}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                session?.user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userRole.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className={cn('hidden lg:block transition-all duration-300', collapsed ? 'w-[72px]' : 'w-60')} />
    </>
  )
}
