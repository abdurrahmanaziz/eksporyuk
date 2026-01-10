import { prisma } from './prisma'

/**
 * Check if a user has a specific feature permission
 */
export async function hasFeaturePermission(
  userId: string, 
  feature: string
): Promise<boolean> {
  try {
    const permission = await prisma.userPermission.findUnique({
      where: {
        userId_feature: {
          userId,
          feature
        }
      }
    })

    return permission?.enabled === true
  } catch (error) {
    console.error('Error checking feature permission:', error)
    return false
  }
}

/**
 * Get user's feature permission with value
 */
export async function getFeaturePermission(
  userId: string,
  feature: string
) {
  try {
    return await prisma.userPermission.findUnique({
      where: {
        userId_feature: {
          userId,
          feature
        }
      }
    })
  } catch (error) {
    console.error('Error getting feature permission:', error)
    return null
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string) {
  try {
    return await prisma.userPermission.findMany({
      where: { 
        userId,
        enabled: true 
      }
    })
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

/**
 * Grant or update a feature permission for a user
 */
export async function grantFeaturePermission(
  userId: string,
  feature: string,
  enabled: boolean = true,
  value?: any
) {
  try {
    return await prisma.userPermission.upsert({
      where: {
        userId_feature: {
          userId,
          feature
        }
      },
      update: {
        enabled,
        value,
        updatedAt: new Date()
      },
      create: {
        userId,
        feature,
        enabled,
        value
      }
    })
  } catch (error) {
    console.error('Error granting feature permission:', error)
    throw error
  }
}

/**
 * Revoke a feature permission for a user
 */
export async function revokeFeaturePermission(
  userId: string,
  feature: string
) {
  try {
    return await prisma.userPermission.delete({
      where: {
        userId_feature: {
          userId,
          feature
        }
      }
    })
  } catch (error) {
    console.error('Error revoking feature permission:', error)
    throw error
  }
}

/**
 * Available features in the system
 */
export const AVAILABLE_FEATURES = {
  // ========== KEUANGAN ==========
  REVENUE_SHARE: 'revenue_share',
  WALLET_ACCESS: 'wallet_access',
  
  // ========== PENDIDIKAN ==========
  CREATE_COURSE: 'create_course',              // Untuk Mentor - buat kursus
  COURSE_ACCESS: 'course_access',              // Akses kursus (free/premium via value)
  WEBINAR_ACCESS: 'webinar_access',            // Akses webinar live & recording
  MENTORING_ACCESS: 'mentoring_access',        // Akses mentoring 1-on-1
  CERTIFICATE_ACCESS: 'certificate_access',    // Akses download sertifikat
  
  // ========== ADMINISTRASI ==========
  MANAGE_USERS: 'manage_users',
  
  // ========== DATABASE EKSPOR ==========
  DATABASE_BUYER: 'database_buyer',            // Akses database buyer/importir
  DATABASE_SUPPLIER: 'database_supplier',      // Akses database supplier
  DATABASE_FORWARDER: 'database_forwarder',    // Akses database forwarder
  DATABASE_EXPORT: 'database_export',          // Export database ke CSV/Excel
  DATABASE_API: 'database_api',                // Akses API database
  
  // ========== ANALITIK ==========
  ANALYTICS_ACCESS: 'analytics_access',        // Akses analitik & laporan
  
  // ========== MARKETING & AFFILIATE ==========
  AFFILIATE_ACCESS: 'affiliate_access',        // Gabung Rich Affiliate & dapat komisi
  MARKETING_KIT: 'marketing_kit',              // Akses marketing materials
  PRODUCT_LISTING: 'product_listing',          // Listing produk di marketplace
  COUPON_CREATION: 'coupon_creation',          // Buat kupon diskon
  
  // ========== EVENT ==========
  EVENT_ACCESS: 'event_access',                // Akses event & webinar (RSVP, recording)
  EVENT_MANAGEMENT: 'event_management',        // Buat & kelola event (untuk admin/mentor)
  
  // ========== DOKUMEN ==========
  DOCUMENT_TEMPLATES: 'document_templates',    // Akses template dokumen ekspor
  DOCUMENT_GENERATOR: 'document_generator',    // Generate dokumen dengan auto-fill
  DOCUMENT_CUSTOM: 'document_custom',          // Edit & buat template custom
  
  // ========== KOMUNITAS ==========
  COMMUNITY_ACCESS: 'community_access',        // Akses feed, post, komentar
  GROUP_ACCESS: 'group_access',                // Akses grup (private/public)
  MEMBER_DIRECTORY: 'member_directory',        // Akses direktori member
  PREMIUM_CONTENT: 'premium_content',          // Akses konten premium
  
  // ========== CHAT ==========
  CHAT_ACCESS: 'chat_access',                  // Akses chat (DM & grup)
  
  // ========== NOTIFIKASI ==========
  NOTIFICATION_PUSH: 'notification_push',      // Notifikasi push browser
  NOTIFICATION_EMAIL: 'notification_email',    // Notifikasi email
  NOTIFICATION_WHATSAPP: 'notification_whatsapp', // Notifikasi WhatsApp
  
  // ========== BISNIS/SUPPLIER ==========
  SUPPLIER_ACCESS: 'supplier_access',          // Akses jadi supplier
  BUSINESS_REPORTS: 'business_reports',        // Laporan bisnis lanjutan
  INVENTORY_ACCESS: 'inventory_access',        // Manajemen inventori
  
  // ========== FITUR LANJUTAN ==========
  WHITE_LABEL: 'white_label',                  // Custom branding
  API_ACCESS: 'api_access',                    // Integrasi API eksternal
  EARLY_ACCESS: 'early_access',                // Akses fitur beta
  PRIORITY_SUPPORT: 'priority_support',        // Dukungan prioritas
  VERIFIED_BADGE: 'verified_badge'             // Badge terverifikasi
} as const

export type FeatureKey = typeof AVAILABLE_FEATURES[keyof typeof AVAILABLE_FEATURES]

/**
 * Feature definitions with metadata - SIMPLIFIED VERSION
 * Setiap fitur sudah mencakup sub-fitur di dalamnya
 * Pembatasan dilakukan via defaultValue (limit, quota, dll)
 */
export const FEATURE_DEFINITIONS = [
  // ========== KEUANGAN ==========
  {
    key: AVAILABLE_FEATURES.REVENUE_SHARE,
    name: 'Bagi Hasil',
    description: 'Aktifkan bagi hasil revenue (founder/co-founder)',
    category: 'Keuangan',
    defaultValue: { percentage: 10 }
  },
  {
    key: AVAILABLE_FEATURES.WALLET_ACCESS,
    name: 'Akses Dompet',
    description: 'Akses fitur dompet digital & withdrawal',
    category: 'Keuangan',
    defaultValue: { canWithdraw: true, minWithdraw: 50000 }
  },
  
  // ========== PENDIDIKAN ==========
  {
    key: AVAILABLE_FEATURES.CREATE_COURSE,
    name: 'Buat Kursus',
    description: 'Membuat dan mengelola kursus (untuk Mentor)',
    category: 'Pendidikan',
    defaultValue: { maxCourses: 10 }
  },
  {
    key: AVAILABLE_FEATURES.COURSE_ACCESS,
    name: 'Akses Kursus',
    description: 'Akses kursus dengan sertifikat',
    category: 'Pendidikan',
    defaultValue: { type: 'premium', unlimited: true, includeCertificate: true }
  },
  {
    key: AVAILABLE_FEATURES.WEBINAR_ACCESS,
    name: 'Akses Webinar',
    description: 'Akses webinar live & recording',
    category: 'Pendidikan',
    defaultValue: { liveAccess: true, recordingAccess: true, monthlyLimit: null }
  },
  {
    key: AVAILABLE_FEATURES.MENTORING_ACCESS,
    name: 'Akses Mentoring',
    description: 'Sesi mentoring 1-on-1 dengan expert',
    category: 'Pendidikan',
    defaultValue: { sessionsPerMonth: 2, durationMinutes: 60 }
  },
  {
    key: AVAILABLE_FEATURES.CERTIFICATE_ACCESS,
    name: 'Akses Sertifikat',
    description: 'Download sertifikat dalam berbagai format',
    category: 'Pendidikan',
    defaultValue: { formats: ['pdf', 'png'], canCustomize: false }
  },
  
  // ========== ADMINISTRASI ==========
  {
    key: AVAILABLE_FEATURES.MANAGE_USERS,
    name: 'Kelola Pengguna',
    description: 'Manajemen user (untuk Admin)',
    category: 'Administrasi',
    defaultValue: null
  },
  
  // ========== DATABASE EKSPOR ==========
  {
    key: AVAILABLE_FEATURES.DATABASE_BUYER,
    name: 'Database Buyer',
    description: 'Akses database buyer/importir internasional',
    category: 'Database',
    defaultValue: { monthlyLimit: 50, canExport: true, canViewContact: true }
  },
  {
    key: AVAILABLE_FEATURES.DATABASE_SUPPLIER,
    name: 'Database Supplier',
    description: 'Akses database supplier/produsen lokal',
    category: 'Database',
    defaultValue: { monthlyLimit: 50, canExport: true, canViewRating: true }
  },
  {
    key: AVAILABLE_FEATURES.DATABASE_FORWARDER,
    name: 'Database Forwarder',
    description: 'Akses database freight forwarder & shipping agent',
    category: 'Database',
    defaultValue: { monthlyLimit: 50, canExport: true, canCompareRates: true }
  },
  {
    key: AVAILABLE_FEATURES.DATABASE_EXPORT,
    name: 'Export Database',
    description: 'Export database ke CSV/Excel',
    category: 'Database',
    defaultValue: { maxExportsPerMonth: 10, formats: ['csv', 'excel'] }
  },
  {
    key: AVAILABLE_FEATURES.DATABASE_API,
    name: 'API Database',
    description: 'Akses API untuk integrasi database',
    category: 'Database',
    defaultValue: { monthlyQuota: 1000, rateLimit: 60 }
  },
  
  // ========== ANALITIK ==========
  {
    key: AVAILABLE_FEATURES.ANALYTICS_ACCESS,
    name: 'Akses Analitik',
    description: 'Dashboard analitik & laporan performa',
    category: 'Analitik',
    defaultValue: { dashboardAccess: true, exportReport: true }
  },
  
  // ========== MARKETING & AFFILIATE ==========
  {
    key: AVAILABLE_FEATURES.AFFILIATE_ACCESS,
    name: 'Akses Affiliate',
    description: 'Gabung Rich Affiliate, dapat komisi & short link',
    category: 'Marketing',
    defaultValue: { commissionRate: 0, canCreateShortLinks: true, maxLinks: 50 }
  },
  {
    key: AVAILABLE_FEATURES.MARKETING_KIT,
    name: 'Kit Marketing',
    description: 'Akses banner, copy, assets promosi',
    category: 'Marketing',
    defaultValue: { canDownload: true, canCustomize: false }
  },
  {
    key: AVAILABLE_FEATURES.PRODUCT_LISTING,
    name: 'Listing Produk',
    description: 'Listing produk di marketplace',
    category: 'Marketing',
    defaultValue: { maxProducts: 10, priorityListing: false, featured: false }
  },
  {
    key: AVAILABLE_FEATURES.COUPON_CREATION,
    name: 'Buat Kupon',
    description: 'Buat kupon diskon untuk promosi',
    category: 'Marketing',
    defaultValue: { maxCoupons: 5, maxDiscount: 50 }
  },
  
  // ========== EVENT ==========
  {
    key: AVAILABLE_FEATURES.EVENT_ACCESS,
    name: 'Akses Event',
    description: 'Akses semua event (RSVP, live, recording)',
    category: 'Event',
    defaultValue: { canRSVP: true, liveAccess: true, recordingAccess: true, monthlyLimit: null }
  },
  {
    key: AVAILABLE_FEATURES.EVENT_MANAGEMENT,
    name: 'Kelola Event',
    description: 'Buat & kelola event (untuk Admin/Mentor)',
    category: 'Event',
    defaultValue: { maxEvents: 20 }
  },
  
  // ========== DOKUMEN ==========
  {
    key: AVAILABLE_FEATURES.DOCUMENT_TEMPLATES,
    name: 'Template Dokumen',
    description: 'Akses template Invoice, Packing List, COO',
    category: 'Dokumen',
    defaultValue: { templates: ['invoice', 'packing_list', 'coo', 'contract'] }
  },
  {
    key: AVAILABLE_FEATURES.DOCUMENT_GENERATOR,
    name: 'Generator Dokumen',
    description: 'Generate dokumen ekspor dengan auto-fill',
    category: 'Dokumen',
    defaultValue: { monthlyLimit: 50, canSaveAsPDF: true }
  },
  {
    key: AVAILABLE_FEATURES.DOCUMENT_CUSTOM,
    name: 'Template Custom',
    description: 'Buat & edit template dokumen sendiri',
    category: 'Dokumen',
    defaultValue: { maxTemplates: 10 }
  },
  
  // ========== KOMUNITAS ==========
  {
    key: AVAILABLE_FEATURES.COMMUNITY_ACCESS,
    name: 'Akses Komunitas',
    description: 'Akses feed, posting, komentar, react',
    category: 'Komunitas',
    defaultValue: { canPost: true, canComment: true, canReact: true, maxPostsPerDay: 10 }
  },
  {
    key: AVAILABLE_FEATURES.GROUP_ACCESS,
    name: 'Akses Grup',
    description: 'Akses grup diskusi (public & private)',
    category: 'Komunitas',
    defaultValue: { publicGroups: true, privateGroups: true, canCreateGroup: false }
  },
  {
    key: AVAILABLE_FEATURES.MEMBER_DIRECTORY,
    name: 'Direktori Member',
    description: 'Lihat & hubungi member lain untuk networking',
    category: 'Komunitas',
    defaultValue: { canView: true, canContact: true, canExport: false }
  },
  {
    key: AVAILABLE_FEATURES.PREMIUM_CONTENT,
    name: 'Konten Premium',
    description: 'Akses konten eksklusif (video, dokumen)',
    category: 'Komunitas',
    defaultValue: { videoAccess: true, documentAccess: true }
  },
  
  // ========== CHAT ==========
  {
    key: AVAILABLE_FEATURES.CHAT_ACCESS,
    name: 'Akses Chat',
    description: 'Chat personal & grup dengan member lain',
    category: 'Chat',
    defaultValue: { directMessage: true, groupChat: true, canSendMedia: true, maxChatsPerDay: 50 }
  },
  
  // ========== NOTIFIKASI ==========
  {
    key: AVAILABLE_FEATURES.NOTIFICATION_PUSH,
    name: 'Notifikasi Push',
    description: 'Terima notifikasi di browser/aplikasi',
    category: 'Notifikasi',
    defaultValue: { enabled: true }
  },
  {
    key: AVAILABLE_FEATURES.NOTIFICATION_EMAIL,
    name: 'Notifikasi Email',
    description: 'Terima notifikasi via email',
    category: 'Notifikasi',
    defaultValue: { enabled: true, frequency: 'instant' }
  },
  {
    key: AVAILABLE_FEATURES.NOTIFICATION_WHATSAPP,
    name: 'Notifikasi WhatsApp',
    description: 'Terima notifikasi via WhatsApp',
    category: 'Notifikasi',
    defaultValue: { enabled: true }
  },
  
  // ========== BISNIS/SUPPLIER ==========
  {
    key: AVAILABLE_FEATURES.SUPPLIER_ACCESS,
    name: 'Akses Supplier',
    description: 'Jadi supplier & jual produk',
    category: 'Bisnis',
    defaultValue: { maxProducts: 20, canVerify: true }
  },
  {
    key: AVAILABLE_FEATURES.BUSINESS_REPORTS,
    name: 'Laporan Bisnis',
    description: 'Laporan penjualan & performa bisnis',
    category: 'Bisnis',
    defaultValue: { reportTypes: ['sales', 'traffic', 'conversion'], canExport: true }
  },
  {
    key: AVAILABLE_FEATURES.INVENTORY_ACCESS,
    name: 'Manajemen Stok',
    description: 'Kelola inventori & stok produk',
    category: 'Bisnis',
    defaultValue: { trackStock: true, lowStockAlert: true }
  },
  
  // ========== FITUR LANJUTAN ==========
  {
    key: AVAILABLE_FEATURES.WHITE_LABEL,
    name: 'White Label',
    description: 'Custom branding & domain sendiri',
    category: 'Lanjutan',
    defaultValue: { customLogo: true, customDomain: false, hideBranding: false }
  },
  {
    key: AVAILABLE_FEATURES.API_ACCESS,
    name: 'Akses API',
    description: 'Integrasi dengan sistem eksternal via API',
    category: 'Lanjutan',
    defaultValue: { maxWebhooks: 5, rateLimit: 100 }
  },
  {
    key: AVAILABLE_FEATURES.EARLY_ACCESS,
    name: 'Akses Fitur Beta',
    description: 'Coba fitur baru sebelum rilis publik',
    category: 'Lanjutan',
    defaultValue: { betaTester: true }
  },
  {
    key: AVAILABLE_FEATURES.PRIORITY_SUPPORT,
    name: 'Dukungan Prioritas',
    description: 'Support prioritas via chat/email/WA',
    category: 'Lanjutan',
    defaultValue: { responseTime: '1 hour', channels: ['chat', 'email', 'whatsapp'] }
  },
  {
    key: AVAILABLE_FEATURES.VERIFIED_BADGE,
    name: 'Badge Verified',
    description: 'Badge terverifikasi untuk kredibilitas',
    category: 'Lanjutan',
    defaultValue: { showOnProfile: true, showOnPosts: true }
  }
] as const

/**
 * Check if user has multiple features
 */
export async function hasMultipleFeatures(
  userId: string, 
  features: string[]
): Promise<{ [feature: string]: boolean }> {
  try {
    const permissions = await prisma.userPermission.findMany({
      where: {
        userId,
        feature: { in: features },
        enabled: true
      }
    })

    const result: { [feature: string]: boolean } = {}
    features.forEach(feature => {
      result[feature] = permissions.some(p => p.feature === feature)
    })

    return result
  } catch (error) {
    console.error('Error checking multiple features:', error)
    return features.reduce((acc, feature) => ({ ...acc, [feature]: false }), {})
  }
}