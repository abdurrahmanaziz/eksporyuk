/**
 * BRANDED TEMPLATE ENGINE
 * Sistem template email dengan branding konsisten untuk EksporYuk
 * Content text-only untuk admin, HTML branding otomatis
 * Menggunakan settings dari database untuk logo dan email footer
 */

import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// Interface for email settings from database
interface EmailSettings {
  siteLogo: string
  siteTitle: string
  siteDescription: string
  primaryColor: string
  secondaryColor: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  emailFooterText: string
  emailFooterCompany: string
  emailFooterAddress: string
  emailFooterPhone: string
  emailFooterEmail: string
  emailFooterWebsiteUrl: string
  emailFooterInstagramUrl: string
  emailFooterFacebookUrl: string
  emailFooterLinkedinUrl: string
  emailFooterCopyrightText: string
  contactPhone: string
  whatsappNumber: string
}

// Default Brand Configuration (fallback)
const DEFAULT_BRAND_CONFIG = {
  name: 'EksporYuk',
  tagline: 'Platform Pembelajaran & Komunitas Ekspor Terbaik di Indonesia',
  logoUrl: 'https://via.placeholder.com/150x60/3B82F6/FFFFFF?text=EksporYuk', // Accessible placeholder logo
  primaryColor: '#3B82F6', // Blue from settings
  secondaryColor: '#1F2937',
  buttonBg: '#3B82F6',
  buttonText: '#FFFFFF',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  supportEmail: 'support@eksporyuk.com',
  supportPhone: '+62 812-3456-7890',
  website: process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com',
  address: 'Jakarta, Indonesia',
  copyrightText: 'EksporYuk. All rights reserved.',
  socialMedia: {
    instagram: 'https://instagram.com/eksporyuk',
    facebook: '',
    linkedin: '',
    whatsapp: 'https://wa.me/6281234567890'
  }
}

/**
 * Fetch email settings from database
 */
export async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const settings = await prisma.settings.findFirst()
    if (settings) {
      return {
        siteLogo: settings.siteLogo || '',
        siteTitle: settings.siteTitle || 'EksporYuk',
        siteDescription: settings.siteDescription || '',
        primaryColor: settings.primaryColor || '#3B82F6',
        secondaryColor: settings.secondaryColor || '#1F2937',
        buttonPrimaryBg: settings.buttonPrimaryBg || '#3B82F6',
        buttonPrimaryText: settings.buttonPrimaryText || '#FFFFFF',
        emailFooterText: (settings as any).emailFooterText || 'Platform Edukasi & Mentoring Ekspor Terpercaya',
        emailFooterCompany: (settings as any).emailFooterCompany || 'EksporYuk',
        emailFooterAddress: (settings as any).emailFooterAddress || 'Jakarta, Indonesia',
        emailFooterPhone: (settings as any).emailFooterPhone || '',
        emailFooterEmail: (settings as any).emailFooterEmail || 'support@eksporyuk.com',
        emailFooterWebsiteUrl: (settings as any).emailFooterWebsiteUrl || 'https://eksporyuk.com',
        emailFooterInstagramUrl: (settings as any).emailFooterInstagramUrl || '',
        emailFooterFacebookUrl: (settings as any).emailFooterFacebookUrl || '',
        emailFooterLinkedinUrl: (settings as any).emailFooterLinkedinUrl || '',
        emailFooterCopyrightText: (settings as any).emailFooterCopyrightText || 'EksporYuk. All rights reserved.',
        contactPhone: settings.contactPhone || '',
        whatsappNumber: settings.whatsappNumber || '',
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching email settings:', error)
    return null
  }
}

/**
 * Get brand config with settings from database
 */
export async function getBrandConfig() {
  const settings = await getEmailSettings()
  
  if (settings) {
    // Ensure logo URL is accessible (not relative path)
    let logoUrl = settings.siteLogo || DEFAULT_BRAND_CONFIG.logoUrl
    
    // If logo is relative path, convert to absolute URL
    if (logoUrl && logoUrl.startsWith('/')) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com'
      logoUrl = `${appUrl}${logoUrl}`
    }
    
    // If logo is localhost, use default (email clients can't access localhost)
    if (logoUrl && (logoUrl.includes('localhost') || logoUrl.startsWith('http://localhost'))) {
      console.warn('[BrandConfig] Logo URL contains localhost, using default logo')
      logoUrl = DEFAULT_BRAND_CONFIG.logoUrl
    }
    
    return {
      name: settings.emailFooterCompany || DEFAULT_BRAND_CONFIG.name,
      tagline: settings.emailFooterText || DEFAULT_BRAND_CONFIG.tagline,
      logoUrl: logoUrl,
      primaryColor: settings.buttonPrimaryBg || DEFAULT_BRAND_CONFIG.primaryColor,
      secondaryColor: settings.secondaryColor || DEFAULT_BRAND_CONFIG.secondaryColor,
      buttonBg: settings.buttonPrimaryBg || DEFAULT_BRAND_CONFIG.buttonBg,
      buttonText: settings.buttonPrimaryText || DEFAULT_BRAND_CONFIG.buttonText,
      backgroundColor: DEFAULT_BRAND_CONFIG.backgroundColor,
      textColor: DEFAULT_BRAND_CONFIG.textColor,
      supportEmail: settings.emailFooterEmail || DEFAULT_BRAND_CONFIG.supportEmail,
      supportPhone: settings.emailFooterPhone || settings.contactPhone || DEFAULT_BRAND_CONFIG.supportPhone,
      website: settings.emailFooterWebsiteUrl || DEFAULT_BRAND_CONFIG.website,
      address: settings.emailFooterAddress || DEFAULT_BRAND_CONFIG.address,
      copyrightText: settings.emailFooterCopyrightText || DEFAULT_BRAND_CONFIG.copyrightText,
      socialMedia: {
        instagram: settings.emailFooterInstagramUrl || DEFAULT_BRAND_CONFIG.socialMedia.instagram,
        facebook: settings.emailFooterFacebookUrl || DEFAULT_BRAND_CONFIG.socialMedia.facebook,
        linkedin: settings.emailFooterLinkedinUrl || DEFAULT_BRAND_CONFIG.socialMedia.linkedin,
        whatsapp: settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}` : DEFAULT_BRAND_CONFIG.socialMedia.whatsapp
      }
    }
  }
  
  return DEFAULT_BRAND_CONFIG
}

// For synchronous usage - uses default config
const BRAND_CONFIG = DEFAULT_BRAND_CONFIG

// Default branded templates (auto-created when missing)
const DEFAULT_BRANDED_TEMPLATES: Record<string, any> = {
  'email-verification': {
    name: 'Email Verification',
    description: 'Template verifikasi email untuk aktivasi akun',
    category: 'SYSTEM',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Verifikasi Email Anda - EksporYuk',
    content: [
      'Halo {name},',
      '',
      'Terima kasih telah mendaftar di EksporYuk.',
      'Silakan verifikasi email Anda dengan klik tombol di bawah ini:',
      '',
      'Jika tombol tidak bisa diklik, salin link berikut ke browser:',
      '{verification_url}',
      '',
      'Jika Anda tidak merasa mendaftar atau meminta perubahan ini, abaikan email ini.',
      '',
      'Salam hangat,',
      'Tim EksporYuk'
    ].join('\n'),
    ctaText: 'Verifikasi Email Sekarang',
    ctaLink: '{verification_url}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ['verification', 'system', 'auth'],
    variables: {
      required: ['name', 'verification_url']
    },
    previewData: {
      name: 'Free User',
      email: 'user@example.com',
      verification_url: 'https://eksporyuk.com/auth/verify-email?token=example'
    }
  },
  'welcome-registration': {
    name: 'Welcome Registration',
    description: 'Template sambutan untuk member baru yang berhasil registrasi',
    category: 'REGISTRATION',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Selamat Datang di EksporYuk, {name}! 🎉',
    content: [
      'Halo {name},',
      '',
      'Selamat datang di EksporYuk - Platform Pembelajaran & Komunitas Ekspor Terbaik di Indonesia!',
      '',
      'Akun Anda telah berhasil dibuat dan siap digunakan. Kami sangat senang Anda bergabung dengan ribuan exporters lainnya yang terus berkembang bersama kami.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'INFORMASI AKUN ANDA',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Email: {email}',
      'Nama: {name}',
      'Terdaftar: {registration_date}',
      'Role: {role}',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'LANGKAH SELANJUTNYA',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '✅ 1. Lengkapi Profil Anda',
      '   Pergi ke pengaturan akun dan lengkapi informasi profil Anda untuk pengalaman yang lebih personal.',
      '',
      '✅ 2. Jelajahi Fitur EksporYuk',
      '   • Pelajari materi ekspor dari para ahli',
      '   • Bergabung dengan komunitas eksportir',
      '   • Akses template dan checklist ekspor',
      '   • Konsultasi dengan mentor berpengalaman',
      '',
      '✅ 3. Mulai Belajar',
      '   Dashboard Anda penuh dengan resources berkualitas tinggi siap membantu perjalanan ekspor Anda.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'FITUR UNGGULAN UNTUK ANDA',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '📚 Kursus & Pelatihan',
      '   Kurikulum ekspor dari basic hingga advanced dari praktisi berpengalaman.',
      '',
      '👥 Komunitas Aktif',
      '   Networking dengan ribuan exporters, share pengalaman, dan kolaborasi bisnis.',
      '',
      '📋 Template & Tools',
      '   Akses lengkap ke template dokumen ekspor, checklist, dan tools bisnis.',
      '',
      '🎓 Mentoring',
      '   Konsultasi langsung dengan mentor expert untuk membantu mengembangkan bisnis ekspor Anda.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Jika ada pertanyaan atau butuh bantuan, jangan ragu untuk menghubungi tim support kami:',
      '📧 Email: {support_email}',
      '📞 WhatsApp: {support_phone}',
      '',
      'Kami siap membantu kesuksesan Anda!',
      '',
      'Salam sukses,',
      'Tim EksporYuk',
      '',
      '---',
      'Email ini adalah notifikasi otomatis. Jangan balas ke email ini.'
    ].join('\n'),
    ctaText: 'Akses Dashboard',
    ctaLink: '{dashboard_link}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ['welcome', 'registration', 'onboarding'],
    variables: {
      required: ['name', 'email', 'registration_date']
    },
    previewData: {
      name: 'John Exporter',
      email: 'john@example.com',
      registration_date: '2 Januari 2024',
      role: 'Member Free',
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      dashboard_link: 'https://eksporyuk.com/dashboard'
    }
  },
  'order-confirmation': {
    name: 'Order Confirmation',
    description: 'Template konfirmasi pesanan untuk membership atau produk',
    category: 'TRANSACTION',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Konfirmasi Pesanan #{invoice_number} - EksporYuk',
    content: [
      'Halo {name},',
      '',
      'Terima kasih telah melakukan pemesanan di EksporYuk!',
      'Pesanan Anda telah kami terima dan sedang diproses.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'DETAIL PESANAN',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Nomor Invoice: {invoice_number}',
      'Tanggal Pesanan: {transaction_date}',
      'Status Pesanan: PENDING PEMBAYARAN',
      '',
      'Produk/Paket: {product_name}',
      'Deskripsi: {product_description}',
      '',
      'Nominal Pembayaran: {amount}',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'INSTRUKSI PEMBAYARAN',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Untuk melengkapi pesanan Anda, silakan lakukan pembayaran sesuai dengan metode yang tersedia.',
      '',
      'Metode Pembayaran:',
      '✅ Transfer Bank (Virtual Account)',
      '✅ E-Wallet (GCash, OVO, Dana, dll)',
      '✅ QRIS',
      '',
      'Langkah Pembayaran:',
      '1. Buka tautan pembayaran atau ke Dashboard Anda',
      '2. Pilih metode pembayaran yang tersedia',
      '3. Ikuti instruksi pembayaran',
      '4. Upload bukti pembayaran jika diminta',
      '5. Tunggu verifikasi admin (biasanya 1-2 jam)',
      '',
      'Jatuh Tempo Pembayaran: {due_date}',
      '⏰ Harap segera lakukan pembayaran untuk menghindari pembatalan otomatis.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Setelah pembayaran dikonfirmasi:',
      '✅ Akses penuh ke {product_name} akan langsung aktif',
      '✅ Anda akan menerima email konfirmasi aktivasi',
      '✅ Mulai belajar dan berkembang bersama EksporYuk',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Pertanyaan atau Bantuan?',
      '📧 Email: {support_email}',
      '📞 WhatsApp: {support_phone}',
      '🕐 Customer Service: Senin-Jumat 09:00-17:00 WIB',
      '',
      'Terima kasih telah memilih EksporYuk. Kami tunggu pembayaran Anda!',
      '',
      'Salam sukses,',
      'Tim EksporYuk',
      '',
      '---',
      'Email ini adalah notifikasi otomatis. Jangan balas ke email ini.'
    ].join('\n'),
    ctaText: 'Lakukan Pembayaran',
    ctaLink: '{payment_link}',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ['order', 'payment', 'transaction'],
    variables: {
      required: ['name', 'invoice_number', 'product_name', 'amount']
    },
    previewData: {
      name: 'John Exporter',
      invoice_number: 'INV-2024-001',
      transaction_date: '2 Januari 2024',
      product_name: 'Membership Pro Eksportir',
      product_description: 'Akses penuh ke semua kursus, template, dan mentoring',
      amount: 'Rp 500.000',
      due_date: '9 Januari 2024',
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      payment_link: 'https://eksporyuk.com/payment/INV-2024-001'
    }
  },
  'payment-confirmation': {
    name: 'Payment Confirmation',
    description: 'Template konfirmasi pembayaran ketika customer upload bukti transfer',
    category: 'TRANSACTION',
    type: 'EMAIL',
    roleTarget: 'ALL',
    subject: 'Bukti Pembayaran Diterima - Invoice #{invoice_number}',
    content: [
      'Halo {name},',
      '',
      'Terima kasih telah mengirimkan bukti pembayaran!',
      'Kami telah menerima bukti pembayaran Anda dan sedang melakukan verifikasi.',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'INFORMASI PEMBAYARAN',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Nomor Invoice: {invoice_number}',
      'Jumlah Pembayaran: {amount}',
      'Tanggal Diterima: {transaction_date}',
      'Status Verifikasi: ⏳ SEDANG DIVERIFIKASI',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'PROSES VERIFIKASI',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Tim admin kami sedang memverifikasi bukti pembayaran Anda.',
      '',
      'Estimasi Waktu: 1-2 jam (jam kerja)',
      '',
      'Apa yang akan terjadi setelah verifikasi:',
      '✅ Anda akan menerima email konfirmasi pembayaran diterima',
      '✅ Akses penuh ke produk/membership akan langsung aktif',
      '✅ Dashboard Anda akan diperbarui dengan status "AKTIF"',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'PANTAU STATUS PEMBAYARAN',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Anda dapat memantau status pembayaran secara real-time di Dashboard Anda:',
      'Link: {dashboard_link}/transactions',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      'Catatan Penting:',
      '• Harap pastikan bukti pembayaran yang dikirim jelas dan terbaca',
      '• Nominal pembayaran harus sesuai dengan nominal invoice',
      '• Verifikasi dilakukan secara manual oleh tim kami',
      '',
      'Jika ada pertanyaan atau pembayaran belum terverifikasi dalam 2 jam:',
      '📧 Email: {support_email}',
      '📞 WhatsApp: {support_phone}',
      '🕐 Customer Service: Senin-Jumat 09:00-17:00 WIB',
      '',
      'Terima kasih atas kepercayaan Anda kepada EksporYuk!',
      '',
      'Salam sukses,',
      'Tim EksporYuk',
      '',
      '---',
      'Email ini adalah notifikasi otomatis. Jangan balas ke email ini.'
    ].join('\n'),
    ctaText: 'Lihat Status Transaksi',
    ctaLink: '{dashboard_link}/transactions',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    tags: ['payment', 'confirmation', 'transaction'],
    variables: {
      required: ['name', 'invoice_number', 'amount']
    },
    previewData: {
      name: 'John Exporter',
      invoice_number: 'INV-2024-001',
      amount: 'Rp 500.000',
      transaction_date: '2 Januari 2024 10:30 WIB',
      support_email: 'support@eksporyuk.com',
      support_phone: '+62 812-3456-7890',
      dashboard_link: 'https://eksporyuk.com/dashboard'
    }
  }
}

// Complete shortcode mapping
export const SHORTCODE_DEFINITIONS = {
  // User Data
  '{name}': 'Nama lengkap user',
  '{first_name}': 'Nama depan user',
  '{last_name}': 'Nama belakang user',
  '{email}': 'Email user',
  '{phone}': 'Nomor telepon',
  '{whatsapp}': 'Nomor WhatsApp',
  '{role}': 'Role user (Member, Affiliate, dll)',
  '{registration_date}': 'Tanggal pendaftaran',
  '{last_login}': 'Login terakhir',
  '{profile_url}': 'URL profil user',
  
  // Membership Data
  '{membership_plan}': 'Nama paket membership',
  '{membership_status}': 'Status membership',
  '{membership_type}': 'Tipe membership',
  '{expiry_date}': 'Tanggal berakhir membership',
  '{start_date}': 'Tanggal mulai membership',
  '{days_left}': 'Sisa hari aktif',
  '{days_since_start}': 'Hari sejak mulai',
  '{renewal_date}': 'Tanggal perpanjangan',
  
  // Transaction Data
  '{invoice_number}': 'Nomor invoice',
  '{transaction_id}': 'ID transaksi',
  '{amount}': 'Jumlah pembayaran (Rp)',
  '{amount_raw}': 'Jumlah tanpa format',
  '{payment_method}': 'Metode pembayaran',
  '{payment_status}': 'Status pembayaran',
  '{transaction_date}': 'Tanggal transaksi',
  '{due_date}': 'Tanggal jatuh tempo',
  '{product_name}': 'Nama produk/paket',
  '{product_description}': 'Deskripsi produk',
  
  // Affiliate Data
  '{affiliate_code}': 'Kode referral affiliate',
  '{commission}': 'Komisi yang didapat (Rp)',
  '{commission_rate}': 'Persentase komisi',
  '{referral_count}': 'Jumlah referral',
  '{total_earnings}': 'Total pendapatan affiliate',
  '{tier_level}': 'Level tier affiliate',
  '{tier_name}': 'Nama tier affiliate',
  '{referral_link}': 'Link referral',
  '{affiliate_dashboard}': 'Link dashboard affiliate',
  
  // Course Data
  '{course_name}': 'Nama kursus',
  '{course_progress}': 'Progress kursus (%)',
  '{course_completion_date}': 'Tanggal selesai kursus',
  '{certificate_url}': 'Link sertifikat',
  '{next_lesson}': 'Lesson selanjutnya',
  '{mentor_name}': 'Nama mentor',
  
  // Event Data
  '{event_name}': 'Nama event',
  '{event_date}': 'Tanggal event',
  '{event_time}': 'Waktu event',
  '{event_location}': 'Lokasi/link event',
  '{zoom_link}': 'Link Zoom',
  '{meeting_id}': 'Meeting ID',
  '{meeting_password}': 'Password meeting',
  
  // System Links
  '{site_name}': 'Nama website',
  '{site_url}': 'URL website',
  '{dashboard_link}': 'Link ke dashboard',
  '{login_link}': 'Link login',
  '{profile_link}': 'Link ke profil',
  '{settings_link}': 'Link pengaturan',
  '{support_email}': 'Email support',
  '{support_phone}': 'Nomor support',
  '{unsubscribe_link}': 'Link unsubscribe',
  
  // Payment Links
  '{payment_link}': 'Link pembayaran',
  '{renewal_link}': 'Link perpanjangan membership',
  '{upgrade_link}': 'Link upgrade',
  '{checkout_link}': 'Link checkout',
  
  // Content Links
  '{course_link}': 'Link ke kursus',
  '{group_link}': 'Link grup komunitas',
  '{material_link}': 'Link materi pembelajaran',
  '{download_link}': 'Link download',
  
  // Date & Time
  '{current_date}': 'Tanggal sekarang',
  '{current_time}': 'Waktu sekarang',
  '{current_year}': 'Tahun sekarang',
  '{current_month}': 'Bulan sekarang',
  '{tomorrow_date}': 'Tanggal besok',
  
  // Company Info
  '{company_name}': 'Nama perusahaan',
  '{company_address}': 'Alamat perusahaan',
  '{company_phone}': 'Nomor perusahaan',
  '{company_email}': 'Email perusahaan',
  '{instagram_link}': 'Link Instagram',
  '{youtube_link}': 'Link YouTube',
  '{whatsapp_link}': 'Link WhatsApp',
}

export interface TemplateData {
  // User info
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  whatsapp?: string
  role?: string
  registrationDate?: string
  lastLogin?: string
  profileUrl?: string
  
  // Membership info
  membershipPlan?: string
  membershipStatus?: string
  membershipType?: string
  expiryDate?: string
  startDate?: string
  daysLeft?: number
  daysSinceStart?: number
  renewalDate?: string
  
  // Transaction info
  invoiceNumber?: string
  transactionId?: string
  amount?: number
  amountFormatted?: string
  paymentMethod?: string
  paymentStatus?: string
  transactionDate?: string
  dueDate?: string
  productName?: string
  productDescription?: string
  
  // Affiliate info
  affiliateCode?: string
  commission?: number
  commissionFormatted?: string
  commissionRate?: number
  referralCount?: number
  totalEarnings?: number
  tierLevel?: number
  tierName?: string
  referralLink?: string
  affiliateDashboard?: string
  
  // Course info
  courseName?: string
  courseProgress?: number
  courseCompletionDate?: string
  certificateUrl?: string
  nextLesson?: string
  mentorName?: string
  
  // Event info
  eventName?: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  zoomLink?: string
  meetingId?: string
  meetingPassword?: string
  
  // Additional data
  [key: string]: any
}

/**
 * Process shortcodes in template content
 */
export function processShortcodes(content: string, data: TemplateData): string {
  let processedContent = content
  
  // Replace user data - support both {name} and {{name}} format
  if (data.name) {
    processedContent = processedContent.replace(/{name}/g, data.name)
    processedContent = processedContent.replace(/\{\{name\}\}/g, data.name)
    processedContent = processedContent.replace(/\{\{userName\}\}/g, data.name)
  }
  if (data.firstName) {
    processedContent = processedContent.replace(/{first_name}/g, data.firstName)
    processedContent = processedContent.replace(/\{\{firstName\}\}/g, data.firstName)
  }
  if (data.lastName) {
    processedContent = processedContent.replace(/{last_name}/g, data.lastName)
    processedContent = processedContent.replace(/\{\{lastName\}\}/g, data.lastName)
  }
  if (data.email) {
    processedContent = processedContent.replace(/{email}/g, data.email)
    processedContent = processedContent.replace(/\{\{email\}\}/g, data.email)
    processedContent = processedContent.replace(/\{\{userEmail\}\}/g, data.email)
  }
  if (data.phone) {
    processedContent = processedContent.replace(/{phone}/g, data.phone)
    processedContent = processedContent.replace(/\{\{phone\}\}/g, data.phone)
  }
  if (data.whatsapp) {
    processedContent = processedContent.replace(/{whatsapp}/g, data.whatsapp)
    processedContent = processedContent.replace(/\{\{whatsapp\}\}/g, data.whatsapp)
  }
  if (data.role) {
    processedContent = processedContent.replace(/{role}/g, data.role)
    processedContent = processedContent.replace(/\{\{role\}\}/g, data.role)
  }
  if (data.registrationDate) {
    processedContent = processedContent.replace(/{registration_date}/g, data.registrationDate)
    processedContent = processedContent.replace(/\{\{registrationDate\}\}/g, data.registrationDate)
  }
  if (data.lastLogin) {
    processedContent = processedContent.replace(/{last_login}/g, data.lastLogin)
    processedContent = processedContent.replace(/\{\{lastLogin\}\}/g, data.lastLogin)
  }
  
  // Replace membership data
  if (data.membershipPlan) {
    processedContent = processedContent.replace(/{membership_plan}/g, data.membershipPlan)
    processedContent = processedContent.replace(/\{\{membershipPlan\}\}/g, data.membershipPlan)
  }
  if (data.membershipStatus) {
    processedContent = processedContent.replace(/{membership_status}/g, data.membershipStatus)
    processedContent = processedContent.replace(/\{\{membershipStatus\}\}/g, data.membershipStatus)
  }
  if (data.membershipType) {
    processedContent = processedContent.replace(/{membership_type}/g, data.membershipType)
    processedContent = processedContent.replace(/\{\{membershipType\}\}/g, data.membershipType)
  }
  if (data.expiryDate) {
    processedContent = processedContent.replace(/{expiry_date}/g, data.expiryDate)
    processedContent = processedContent.replace(/\{\{expiryDate\}\}/g, data.expiryDate)
  }
  if (data.startDate) {
    processedContent = processedContent.replace(/{start_date}/g, data.startDate)
    processedContent = processedContent.replace(/\{\{startDate\}\}/g, data.startDate)
  }
  if (data.daysLeft !== undefined) {
    processedContent = processedContent.replace(/{days_left}/g, data.daysLeft.toString())
    processedContent = processedContent.replace(/\{\{daysLeft\}\}/g, data.daysLeft.toString())
  }
  if (data.daysSinceStart !== undefined) {
    processedContent = processedContent.replace(/{days_since_start}/g, data.daysSinceStart.toString())
    processedContent = processedContent.replace(/\{\{daysSinceStart\}\}/g, data.daysSinceStart.toString())
  }
  if (data.renewalDate) {
    processedContent = processedContent.replace(/{renewal_date}/g, data.renewalDate)
    processedContent = processedContent.replace(/\{\{renewalDate\}\}/g, data.renewalDate)
  }
  
  // Replace transaction data
  if (data.invoiceNumber) {
    processedContent = processedContent.replace(/{invoice_number}/g, data.invoiceNumber)
    processedContent = processedContent.replace(/\{\{invoiceNumber\}\}/g, data.invoiceNumber)
  }
  if (data.transactionId) {
    processedContent = processedContent.replace(/{transaction_id}/g, data.transactionId)
    processedContent = processedContent.replace(/\{\{transactionId\}\}/g, data.transactionId)
  }
  if (data.amountFormatted) {
    processedContent = processedContent.replace(/{amount}/g, data.amountFormatted)
    processedContent = processedContent.replace(/\{\{amount\}\}/g, data.amountFormatted)
  }
  if (data.amount !== undefined) {
    processedContent = processedContent.replace(/{amount_raw}/g, data.amount.toString())
    processedContent = processedContent.replace(/\{\{amountRaw\}\}/g, data.amount.toString())
  }
  if (data.paymentMethod) {
    processedContent = processedContent.replace(/{payment_method}/g, data.paymentMethod)
    processedContent = processedContent.replace(/\{\{paymentMethod\}\}/g, data.paymentMethod)
  }
  if (data.paymentStatus) {
    processedContent = processedContent.replace(/{payment_status}/g, data.paymentStatus)
    processedContent = processedContent.replace(/\{\{paymentStatus\}\}/g, data.paymentStatus)
  }
  if (data.transactionDate) {
    processedContent = processedContent.replace(/{transaction_date}/g, data.transactionDate)
    processedContent = processedContent.replace(/\{\{transactionDate\}\}/g, data.transactionDate)
  }
  if (data.dueDate) {
    processedContent = processedContent.replace(/{due_date}/g, data.dueDate)
    processedContent = processedContent.replace(/\{\{dueDate\}\}/g, data.dueDate)
  }
  if (data.productName) {
    processedContent = processedContent.replace(/{product_name}/g, data.productName)
    processedContent = processedContent.replace(/\{\{productName\}\}/g, data.productName)
  }
  if (data.productDescription) {
    processedContent = processedContent.replace(/{product_description}/g, data.productDescription)
    processedContent = processedContent.replace(/\{\{productDescription\}\}/g, data.productDescription)
  }
  
  // Replace affiliate data
  if (data.affiliateCode) {
    processedContent = processedContent.replace(/{affiliate_code}/g, data.affiliateCode)
    processedContent = processedContent.replace(/\{\{affiliateCode\}\}/g, data.affiliateCode)
  }
  if (data.commissionFormatted) {
    processedContent = processedContent.replace(/{commission}/g, data.commissionFormatted)
    processedContent = processedContent.replace(/\{\{commission\}\}/g, data.commissionFormatted)
  }
  if (data.commissionRate !== undefined) {
    const rateStr = data.commissionRate.toString() + '%'
    processedContent = processedContent.replace(/{commission_rate}/g, rateStr)
    processedContent = processedContent.replace(/\{\{commissionRate\}\}/g, rateStr)
  }
  if (data.referralCount !== undefined) {
    processedContent = processedContent.replace(/{referral_count}/g, data.referralCount.toString())
    processedContent = processedContent.replace(/\{\{referralCount\}\}/g, data.referralCount.toString())
  }
  if (data.totalEarnings !== undefined) {
    const earningsStr = formatCurrency(data.totalEarnings)
    processedContent = processedContent.replace(/{total_earnings}/g, earningsStr)
    processedContent = processedContent.replace(/\{\{totalEarnings\}\}/g, earningsStr)
  }
  if (data.tierLevel !== undefined) {
    processedContent = processedContent.replace(/{tier_level}/g, data.tierLevel.toString())
    processedContent = processedContent.replace(/\{\{tierLevel\}\}/g, data.tierLevel.toString())
  }
  if (data.tierName) {
    processedContent = processedContent.replace(/{tier_name}/g, data.tierName)
    processedContent = processedContent.replace(/\{\{tierName\}\}/g, data.tierName)
  }
  if (data.referralLink) {
    processedContent = processedContent.replace(/{referral_link}/g, data.referralLink)
    processedContent = processedContent.replace(/\{\{referralLink\}\}/g, data.referralLink)
  }
  if (data.affiliateDashboard) {
    processedContent = processedContent.replace(/{affiliate_dashboard}/g, data.affiliateDashboard)
    processedContent = processedContent.replace(/\{\{affiliateDashboard\}\}/g, data.affiliateDashboard)
  }
  
  // Replace course data
  if (data.courseName) {
    processedContent = processedContent.replace(/{course_name}/g, data.courseName)
    processedContent = processedContent.replace(/\{\{courseName\}\}/g, data.courseName)
  }
  if (data.courseProgress !== undefined) {
    const progressStr = data.courseProgress.toString() + '%'
    processedContent = processedContent.replace(/{course_progress}/g, progressStr)
    processedContent = processedContent.replace(/\{\{courseProgress\}\}/g, progressStr)
  }
  if (data.courseCompletionDate) {
    processedContent = processedContent.replace(/{course_completion_date}/g, data.courseCompletionDate)
    processedContent = processedContent.replace(/\{\{courseCompletionDate\}\}/g, data.courseCompletionDate)
  }
  if (data.certificateUrl) {
    processedContent = processedContent.replace(/{certificate_url}/g, data.certificateUrl)
    processedContent = processedContent.replace(/\{\{certificateUrl\}\}/g, data.certificateUrl)
  }
  if (data.nextLesson) {
    processedContent = processedContent.replace(/{next_lesson}/g, data.nextLesson)
    processedContent = processedContent.replace(/\{\{nextLesson\}\}/g, data.nextLesson)
  }
  if (data.mentorName) {
    processedContent = processedContent.replace(/{mentor_name}/g, data.mentorName)
    processedContent = processedContent.replace(/\{\{mentorName\}\}/g, data.mentorName)
  }
  
  // Replace event data
  if (data.eventName) processedContent = processedContent.replace(/{event_name}/g, data.eventName)
  if (data.eventDate) processedContent = processedContent.replace(/{event_date}/g, data.eventDate)
  if (data.eventTime) processedContent = processedContent.replace(/{event_time}/g, data.eventTime)
  if (data.eventLocation) processedContent = processedContent.replace(/{event_location}/g, data.eventLocation)
  if (data.zoomLink) processedContent = processedContent.replace(/{zoom_link}/g, data.zoomLink)
  if (data.meetingId) processedContent = processedContent.replace(/{meeting_id}/g, data.meetingId)
  if (data.meetingPassword) processedContent = processedContent.replace(/{meeting_password}/g, data.meetingPassword)
  
  // Replace system data
  processedContent = processedContent.replace(/{site_name}/g, BRAND_CONFIG.name)
  processedContent = processedContent.replace(/{site_url}/g, BRAND_CONFIG.website)
  processedContent = processedContent.replace(/{company_name}/g, BRAND_CONFIG.name)
  processedContent = processedContent.replace(/{company_address}/g, BRAND_CONFIG.address)
  processedContent = processedContent.replace(/{company_phone}/g, BRAND_CONFIG.supportPhone)
  processedContent = processedContent.replace(/{company_email}/g, BRAND_CONFIG.supportEmail)
  processedContent = processedContent.replace(/{support_email}/g, BRAND_CONFIG.supportEmail)
  processedContent = processedContent.replace(/{support_phone}/g, BRAND_CONFIG.supportPhone)
  
  // Replace social media links
  processedContent = processedContent.replace(/{instagram_link}/g, BRAND_CONFIG.socialMedia.instagram)
  processedContent = processedContent.replace(/{facebook_link}/g, BRAND_CONFIG.socialMedia.facebook)
  processedContent = processedContent.replace(/{linkedin_link}/g, BRAND_CONFIG.socialMedia.linkedin)
  processedContent = processedContent.replace(/{whatsapp_link}/g, BRAND_CONFIG.socialMedia.whatsapp)
  
  // Replace system links
  processedContent = processedContent.replace(/{dashboard_link}/g, `${BRAND_CONFIG.website}/dashboard`)
  processedContent = processedContent.replace(/{login_link}/g, `${BRAND_CONFIG.website}/login`)
  processedContent = processedContent.replace(/{profile_link}/g, `${BRAND_CONFIG.website}/dashboard/profile`)
  processedContent = processedContent.replace(/{settings_link}/g, `${BRAND_CONFIG.website}/dashboard/settings`)
  processedContent = processedContent.replace(/{course_link}/g, `${BRAND_CONFIG.website}/dashboard/courses`)
  processedContent = processedContent.replace(/{group_link}/g, `${BRAND_CONFIG.website}/dashboard/groups`)
  
  // Replace date/time data
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  processedContent = processedContent.replace(/{current_date}/g, now.toLocaleDateString('id-ID'))
  processedContent = processedContent.replace(/{current_time}/g, now.toLocaleTimeString('id-ID'))
  processedContent = processedContent.replace(/{current_year}/g, now.getFullYear().toString())
  processedContent = processedContent.replace(/{current_month}/g, (now.getMonth() + 1).toString())
  processedContent = processedContent.replace(/{tomorrow_date}/g, tomorrow.toLocaleDateString('id-ID'))
  
  // Replace any additional custom data
  Object.entries(data).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      const regex = new RegExp(`{${key}}`, 'g')
      processedContent = processedContent.replace(regex, value)
    }
  })
  
  return processedContent
}

/**
 * Generate branded HTML email template
 */
// Background design configurations
const BACKGROUND_DESIGNS = {
  simple: {
    background: '#ffffff',
    containerBg: '#ffffff',
    textColor: '#1f2937'
  },
  blue: {
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    containerBg: '#f8fafc',
    textColor: '#1e3a8a'
  },
  green: {
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    containerBg: '#f0fdf4',
    textColor: '#14532d'
  },
  elegant: {
    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    containerBg: '#ffffff',
    textColor: '#374151'
  },
  warm: {
    background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
    containerBg: '#fef3c7',
    textColor: '#9a3412'
  },
  modern: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    containerBg: '#334155',
    textColor: '#f1f5f9'
  }
}

/**
 * Create simple branded email with background design and text content
 */
export function createSimpleBrandedEmail(
  subject: string,
  content: string,
  ctaText?: string,
  ctaLink?: string,
  backgroundDesign: string = 'simple',
  data: TemplateData = {},
  brandConfig: any = null
): string {
  const config = brandConfig || BRAND_CONFIG
  const design = BACKGROUND_DESIGNS[backgroundDesign as keyof typeof BACKGROUND_DESIGNS] || BACKGROUND_DESIGNS.simple
  
  // Process shortcodes in content
  const processedSubject = processShortcodes(subject, data)
  const processedContent = processShortcodes(content, data)
  const processedCtaText = ctaText ? processShortcodes(ctaText, data) : undefined
  const processedCtaLink = ctaLink ? processShortcodes(ctaLink, data) : undefined
  
  // Convert line breaks to paragraphs with proper text color
  const contentParagraphs = processedContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="margin: 0 0 16px 0; color: ${design.textColor}; font-size: 16px; line-height: 1.6;">${line}</p>`)
    .join('')

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${processedSubject}</title>
</head>
<body style="margin: 0; padding: 0; background: ${design.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: ${design.containerBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 30px 20px; background-color: ${design.containerBg};">
              <img src="${config.logoUrl}" alt="${config.name}" style="max-height: 60px; width: auto;" />
              <h1 style="margin: 16px 0 0; color: ${design.textColor}; font-size: 24px; font-weight: 600;">${config.name}</h1>
              <p style="margin: 8px 0 0; color: ${design.textColor}; font-size: 14px; opacity: 0.7;">${config.tagline}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 30px;">
              <div style="color: ${design.textColor};">
                ${contentParagraphs}
              </div>
              
              ${processedCtaText && processedCtaLink ? `
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${processedCtaLink}" style="display: inline-block; padding: 16px 32px; background-color: ${config.buttonBg}; color: ${config.buttonText}; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                  ${processedCtaText}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: ${backgroundDesign === 'modern' ? '#0f172a' : '#f8fafc'}; border-top: 1px solid ${backgroundDesign === 'modern' ? '#334155' : '#e5e7eb'};">
              <div style="text-align: center;">
                <p style="margin: 0 0 12px; color: ${backgroundDesign === 'modern' ? '#94a3b8' : '#6b7280'}; font-size: 14px; font-weight: 600;">
                  ${config.name}
                </p>
                <p style="margin: 0 0 12px; color: ${backgroundDesign === 'modern' ? '#64748b' : '#9ca3af'}; font-size: 12px; line-height: 1.5;">
                  ${config.address}<br/>
                  Email: <a href="mailto:${config.supportEmail}" style="color: ${config.primaryColor}; text-decoration: none;">${config.supportEmail}</a><br/>
                  Phone: ${config.supportPhone}
                </p>
                <p style="margin: 0; color: ${backgroundDesign === 'modern' ? '#64748b' : '#9ca3af'}; font-size: 11px;">
                  © 2024 ${config.copyrightText}
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function createBrandedEmail(
  subject: string,
  content: string,
  ctaText?: string,
  ctaLink?: string,
  data: TemplateData = {}
): string {
  // Process shortcodes in content
  const processedSubject = processShortcodes(subject, data)
  const processedContent = processShortcodes(content, data)
  const processedCtaText = ctaText ? processShortcodes(ctaText, data) : undefined
  const processedCtaLink = ctaLink ? processShortcodes(ctaLink, data) : undefined
  
  // Convert line breaks to paragraphs
  const contentParagraphs = processedContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="margin: 0 0 16px 0; color: ${BRAND_CONFIG.textColor}; font-size: 16px; line-height: 1.6;">${line}</p>`)
    .join('')
  
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${processedSubject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: ${BRAND_CONFIG.backgroundColor}; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header dengan Logo dan Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_CONFIG.primaryColor} 0%, ${BRAND_CONFIG.secondaryColor} 100%); padding: 32px; text-align: center;">
              <img src="${BRAND_CONFIG.logoUrl}" alt="${BRAND_CONFIG.name}" style="max-width: 120px; height: auto; margin-bottom: 16px;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${BRAND_CONFIG.name}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
                ${BRAND_CONFIG.tagline}
              </p>
            </td>
          </tr>
          
          <!-- Content Area -->
          <tr>
            <td style="padding: 40px 32px;">
              ${contentParagraphs}
              
              ${processedCtaText && processedCtaLink ? `
              <!-- Call to Action Button -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${processedCtaLink}" style="
                      display: inline-block;
                      padding: 16px 40px;
                      background: linear-gradient(135deg, ${BRAND_CONFIG.primaryColor} 0%, #ea580c 100%);
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 600;
                      font-size: 16px;
                      text-align: center;
                      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
                      transition: all 0.3s ease;
                    ">
                      ${processedCtaText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Separator -->
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent); margin: 32px 0;"></div>
              
              <!-- Additional Info -->
              <table role="presentation" style="width: 100%; background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 16px; color: ${BRAND_CONFIG.primaryColor}; font-size: 18px;">
                      🚀 Yang Bisa Anda Lakukan:
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                      <li>✅ Akses dashboard pribadi Anda</li>
                      <li>✅ Bergabung dengan komunitas ekspor</li>
                      <li>✅ Download materi dan template</li>
                      <li>✅ Konsultasi dengan mentor expert</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Social Media -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; font-weight: 600;">
                📱 Ikuti Kami di Media Sosial
              </p>
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="${BRAND_CONFIG.socialMedia.instagram}" style="display: inline-block; padding: 8px 16px; background-color: #e91e63; color: #ffffff; text-decoration: none; border-radius: 20px; font-size: 12px; font-weight: 600;">
                      📸 Instagram
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="${BRAND_CONFIG.socialMedia.facebook}" style="display: inline-block; padding: 8px 16px; background-color: #1877f2; color: #ffffff; text-decoration: none; border-radius: 20px; font-size: 12px; font-weight: 600;">
                      📘 Facebook
                    </a>
                  </td>
                  <td style="padding: 0 8px;">
                    <a href="${BRAND_CONFIG.socialMedia.whatsapp}" style="display: inline-block; padding: 8px 16px; background-color: #25d366; color: #ffffff; text-decoration: none; border-radius: 20px; font-size: 12px; font-weight: 600;">
                      💬 WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <h4 style="margin: 0 0 12px; color: ${BRAND_CONFIG.textColor}; font-size: 16px; font-weight: bold;">
                      ${BRAND_CONFIG.name}
                    </h4>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                      ${BRAND_CONFIG.address}
                    </p>
                    <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">
                      📧 ${BRAND_CONFIG.supportEmail} | 📞 ${BRAND_CONFIG.supportPhone}
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                        © ${new Date().getFullYear()} ${BRAND_CONFIG.copyrightText}<br>
                        Email ini dikirim karena Anda adalah member ${BRAND_CONFIG.name}.
                      </p>
                      ${data.email ? `
                      <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px;">
                        Email dikirim ke: ${data.email}
                      </p>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Generate branded HTML email template with settings from database (ASYNC VERSION)
 * Use this version when you need to load settings from database
 */
export async function createBrandedEmailAsync(
  subject: string,
  content: string,
  ctaText?: string,
  ctaLink?: string,
  data: TemplateData = {}
): Promise<string> {
  // Get brand config from database
  const brandConfig = await getBrandConfig()
  
  // Process shortcodes in content
  const processedSubject = processShortcodes(subject, data)
  const processedContent = processShortcodes(content, data)
  const processedCtaText = ctaText ? processShortcodes(ctaText, data) : undefined
  const processedCtaLink = ctaLink ? processShortcodes(ctaLink, data) : undefined
  
  // Convert line breaks to paragraphs
  const contentParagraphs = processedContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p style="margin: 0 0 16px 0; color: ${brandConfig.textColor}; font-size: 16px; line-height: 1.6;">${line}</p>`)
    .join('')

  // Build social media links HTML
  const socialLinks = []
  if (brandConfig.socialMedia.instagram) {
    socialLinks.push(`<a href="${brandConfig.socialMedia.instagram}" style="display: inline-block; padding: 8px 16px; background-color: #e91e63; color: #ffffff; text-decoration: none; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 0 4px;">📸 Instagram</a>`)
  }
  if (brandConfig.socialMedia.facebook) {
    socialLinks.push(`<a href="${brandConfig.socialMedia.facebook}" style="display: inline-block; padding: 8px 16px; background-color: #1877f2; color: #ffffff; text-decoration: none; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 0 4px;">📘 Facebook</a>`)
  }
  if (brandConfig.socialMedia.linkedin) {
    socialLinks.push(`<a href="${brandConfig.socialMedia.linkedin}" style="display: inline-block; padding: 8px 16px; background-color: #0077b5; color: #ffffff; text-decoration: none; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 0 4px;">💼 LinkedIn</a>`)
  }
  if (brandConfig.socialMedia.whatsapp) {
    socialLinks.push(`<a href="${brandConfig.socialMedia.whatsapp}" style="display: inline-block; padding: 8px 16px; background-color: #25d366; color: #ffffff; text-decoration: none; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 0 4px;">💬 WhatsApp</a>`)
  }
  
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${processedSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: ${brandConfig.backgroundColor}; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header dengan Logo EksporYuk -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandConfig.buttonBg} 0%, ${brandConfig.secondaryColor} 100%); padding: 32px; text-align: center;">
              ${brandConfig.logoUrl ? `<img src="${brandConfig.logoUrl}" alt="${brandConfig.name}" style="max-width: 150px; height: auto; margin-bottom: 16px;" />` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ${brandConfig.name}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
                ${brandConfig.tagline}
              </p>
            </td>
          </tr>
          
          <!-- Content Area -->
          <tr>
            <td style="padding: 40px 32px;">
              ${contentParagraphs}
              
              ${processedCtaText && processedCtaLink ? `
              <!-- Call to Action Button - menggunakan warna dari settings -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${processedCtaLink}" style="
                      display: inline-block;
                      padding: 16px 40px;
                      background-color: ${brandConfig.buttonBg};
                      color: ${brandConfig.buttonText};
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 600;
                      font-size: 16px;
                      text-align: center;
                      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    ">
                      ${processedCtaText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          ${socialLinks.length > 0 ? `
          <!-- Social Media -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; font-weight: 600;">
                📱 Ikuti Kami di Media Sosial
              </p>
              <div style="text-align: center;">
                ${socialLinks.join('')}
              </div>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer dari Settings -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <h4 style="margin: 0 0 12px; color: ${brandConfig.textColor}; font-size: 16px; font-weight: bold;">
                      ${brandConfig.name}
                    </h4>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                      ${brandConfig.address}
                    </p>
                    <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">
                      📧 ${brandConfig.supportEmail} ${brandConfig.supportPhone ? `| 📞 ${brandConfig.supportPhone}` : ''}
                    </p>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
                      <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                        © ${new Date().getFullYear()} ${brandConfig.copyrightText}<br>
                        Email ini dikirim karena Anda adalah member ${brandConfig.name}.
                      </p>
                      ${data.email ? `
                      <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px;">
                        Email dikirim ke: ${data.email}
                      </p>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Render branded template by slug.
 * Auto-creates default template (e.g., email-verification) if missing so admin bisa edit tanpa HTML.
 */
export async function renderBrandedTemplateBySlug(
  slug: string,
  data: TemplateData = {},
  options?: {
    type?: string
    fallbackSubject?: string
    fallbackContent?: string
    fallbackCtaText?: string
    fallbackCtaLink?: string
  }
) {
  // Ensure template exists (auto-create from defaults when available)
  const where: any = { slug, isActive: true }
  where.type = options?.type || 'EMAIL'

  let template = await prisma.brandedTemplate.findFirst({ where })

  if (!template && DEFAULT_BRANDED_TEMPLATES[slug]) {
    try {
      template = await prisma.brandedTemplate.create({
        data: {
          id: randomBytes(16).toString('hex'),
          ...DEFAULT_BRANDED_TEMPLATES[slug],
          slug,
          updatedAt: new Date(),
        },
      })
      console.log('🧩 Auto-created default branded template:', slug)
    } catch (error) {
      console.error('⚠️ Failed to auto-create branded template:', slug, error)
    }
  }

  if (!template || !template.isActive) {
    console.warn('⚠️ Branded template not found or inactive:', slug)
    return null
  }

  const subject = processShortcodes(
    template.subject || options?.fallbackSubject || '',
    data
  )

  const contentRaw = template.content || options?.fallbackContent || ''
  const processedContent = processShortcodes(contentRaw, data)

  const processedCtaText = template.ctaText
    ? processShortcodes(template.ctaText, data)
    : options?.fallbackCtaText
      ? processShortcodes(options.fallbackCtaText, data)
      : undefined

  const processedCtaLink = template.ctaLink
    ? processShortcodes(template.ctaLink, data)
    : options?.fallbackCtaLink
      ? processShortcodes(options.fallbackCtaLink, data)
      : undefined

  const html = await createBrandedEmailAsync(
    subject,
    processedContent,
    processedCtaText,
    processedCtaLink,
    data
  )

  const text = processedContent
    .replace(/<[^>]*>/g, '')
    .replace(/\s+$/g, '')
    .trim()

  // Update usage analytics (best-effort)
  await prisma.brandedTemplate.update({
    where: { id: template.id },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  }).catch(() => null)

  await prisma.brandedTemplateUsage.create({
    data: {
      templateId: template.id,
      userId: (data as any).userId || null,
      userRole: (data as any).role || null,
      context: options?.fallbackSubject ? 'rendered-with-fallback' : 'rendered',
      metadata: data ? JSON.parse(JSON.stringify(data)) : undefined,
      success: true,
    },
  }).catch(() => null)

  return {
    templateId: template.id,
    templateName: template.name,
    subject,
    html,
    text,
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/**
 * Create sample template data for preview
 */
export function createSampleData(): TemplateData {
  return {
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+62 812-3456-7890',
    role: 'Member Premium',
    membershipPlan: 'Pro Eksportir',
    membershipStatus: 'Active',
    expiryDate: '15 Maret 2024',
    daysLeft: 30,
    invoiceNumber: 'INV-2024-001',
    amountFormatted: 'Rp 500.000',
    paymentMethod: 'Transfer Bank',
    transactionDate: '15 Februari 2024',
    productName: 'Membership Pro Eksportir',
    affiliateCode: 'JOHN2024',
    commissionFormatted: 'Rp 50.000',
    referralCount: 5,
    courseName: 'Ekspor untuk Pemula',
    courseProgress: 75,
    mentorName: 'Pak Budi'
  }
}