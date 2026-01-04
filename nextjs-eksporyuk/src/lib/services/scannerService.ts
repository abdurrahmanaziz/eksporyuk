/**
 * Health Monitor & Scanner Service
 * Sistem pemindaian otomatis untuk mendeteksi error di platform
 */

import { prisma } from '@/lib/prisma'
import { ScanType, ScanCategory, ResultStatus, ErrorLevel, ScanStatus } from '@prisma/client'

// Types
export interface ScanCheckResult {
  category: ScanCategory
  checkName: string
  status: ResultStatus
  level: ErrorLevel
  message: string
  details?: string
  location?: string
  impact?: string
  suggestion?: string
}

export interface ScanSummary {
  scanId: string
  scanType: ScanType
  status: ScanStatus
  healthScore: number
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warningChecks: number
  duration: number
  results: ScanCheckResult[]
}

// ===========================================
// API SCANNER - ALL ENDPOINTS
// ===========================================
async function scanAPIs(): Promise<ScanCheckResult[]> {
  const results: ScanCheckResult[] = []
  
  // VERIFIED API endpoints that actually exist in codebase
  const allEndpoints = [
    // === AUTH APIs ===
    { name: 'Auth Session', url: '/api/auth/session', method: 'GET', category: 'Auth' },
    { name: 'Auth Providers', url: '/api/auth/providers', method: 'GET', category: 'Auth' },
    
    // === PUBLIC APIs ===
    { name: 'Products List', url: '/api/products', method: 'GET', category: 'Public' },
    { name: 'Suppliers List', url: '/api/suppliers', method: 'GET', category: 'Public' },
    { name: 'Public Settings', url: '/api/settings/public', method: 'GET', category: 'Public' },
    { name: 'Settings', url: '/api/settings', method: 'GET', category: 'Public' },
    { name: 'Posts', url: '/api/posts', method: 'GET', category: 'Public' },
    { name: 'Sales', url: '/api/sales', method: 'GET', category: 'Public' },
    { name: 'Enrollments', url: '/api/enrollments', method: 'GET', category: 'Public' },
    
    // === ADMIN APIs (VERIFIED) ===
    { name: 'Admin Dashboard Stats', url: '/api/admin/dashboard/stats', method: 'GET', category: 'Admin' },
    { name: 'Admin Users', url: '/api/admin/users', method: 'GET', category: 'Admin' },
    { name: 'Admin Transaction Stats', url: '/api/admin/transactions/stats', method: 'GET', category: 'Admin' },
    { name: 'Admin Affiliates', url: '/api/admin/affiliates', method: 'GET', category: 'Admin' },
    { name: 'Admin Memberships', url: '/api/admin/memberships', method: 'GET', category: 'Admin' },
    { name: 'Admin Membership Plans', url: '/api/admin/membership-plans', method: 'GET', category: 'Admin' },
    { name: 'Admin Products', url: '/api/admin/products', method: 'GET', category: 'Admin' },
    { name: 'Admin Courses', url: '/api/admin/courses', method: 'GET', category: 'Admin' },
    { name: 'Admin Supplier Stats', url: '/api/admin/supplier/stats', method: 'GET', category: 'Admin' },
    { name: 'Admin Coupons', url: '/api/admin/coupons', method: 'GET', category: 'Admin' },
    { name: 'Admin Groups', url: '/api/admin/groups', method: 'GET', category: 'Admin' },
    { name: 'Admin Reports', url: '/api/admin/reports', method: 'GET', category: 'Admin' },
    { name: 'Admin Scanner', url: '/api/admin/scanner?action=status', method: 'GET', category: 'Admin' },
    { name: 'Admin Settings', url: '/api/admin/settings', method: 'GET', category: 'Admin' },
    { name: 'Admin Commission Settings', url: '/api/admin/commission/settings', method: 'GET', category: 'Admin' },
    { name: 'Admin Payouts', url: '/api/admin/payouts', method: 'GET', category: 'Admin' },
    { name: 'Admin Pending Revenue', url: '/api/admin/pending-revenue', method: 'GET', category: 'Admin' },
    { name: 'Admin Wallets', url: '/api/admin/wallets', method: 'GET', category: 'Admin' },
    { name: 'Admin Events', url: '/api/admin/events', method: 'GET', category: 'Admin' },
    { name: 'Admin Analytics', url: '/api/admin/analytics', method: 'GET', category: 'Admin' },
    { name: 'Admin Sales', url: '/api/admin/sales', method: 'GET', category: 'Admin' },
    { name: 'Admin Enrollments', url: '/api/admin/enrollments', method: 'GET', category: 'Admin' },
    { name: 'Admin Short Links', url: '/api/admin/short-links', method: 'GET', category: 'Admin' },
    { name: 'Admin Broadcast', url: '/api/admin/broadcast', method: 'GET', category: 'Admin' },
    { name: 'Admin Banners', url: '/api/admin/banners', method: 'GET', category: 'Admin' },
    
    // === AFFILIATE APIs (VERIFIED) ===
    { name: 'Affiliate Links', url: '/api/affiliate/links', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Short Links', url: '/api/affiliate/short-links', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Earnings', url: '/api/affiliate/earnings', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Training', url: '/api/affiliate/training', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Leaderboard', url: '/api/affiliate/leaderboard', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Profile', url: '/api/affiliate/profile', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Materials', url: '/api/affiliate/materials', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Leads', url: '/api/affiliate/leads', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Onboarding', url: '/api/affiliate/onboarding', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Stats', url: '/api/affiliate/stats', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Statistics', url: '/api/affiliate/statistics', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Payouts', url: '/api/affiliate/payouts', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Conversions', url: '/api/affiliate/conversions', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Reports', url: '/api/affiliate/reports', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Credits', url: '/api/affiliate/credits', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Coupons', url: '/api/affiliate/coupons', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Challenges', url: '/api/affiliate/challenges', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Broadcast', url: '/api/affiliate/broadcast', method: 'GET', category: 'Affiliate' },
    { name: 'Affiliate Suppliers', url: '/api/affiliate/suppliers', method: 'GET', category: 'Affiliate' },
    
    // === MEMBER APIs (VERIFIED) ===
    { name: 'Member Root', url: '/api/member', method: 'GET', category: 'Member' },
    { name: 'Member Access', url: '/api/member/access', method: 'GET', category: 'Member' },
    { name: 'Member Onboarding', url: '/api/member/onboarding', method: 'GET', category: 'Member' },
    { name: 'Member Profile Status', url: '/api/member/profile-status', method: 'GET', category: 'Member' },
    
    // === MENTOR APIs (VERIFIED) ===
    { name: 'Mentor Dashboard', url: '/api/mentor/dashboard', method: 'GET', category: 'Mentor' },
    { name: 'Mentor Courses', url: '/api/mentor/courses', method: 'GET', category: 'Mentor' },
    { name: 'Mentor Students', url: '/api/mentor/students', method: 'GET', category: 'Mentor' },
    { name: 'Mentor Profile', url: '/api/mentor/profile', method: 'GET', category: 'Mentor' },
    { name: 'Mentor Analytics', url: '/api/mentor/analytics', method: 'GET', category: 'Mentor' },
    { name: 'Mentor Earnings', url: '/api/mentor/earnings', method: 'GET', category: 'Mentor' },
    { name: 'Mentor Materials', url: '/api/mentor/materials', method: 'GET', category: 'Mentor' },
    { name: 'Mentor Products', url: '/api/mentor/products', method: 'GET', category: 'Mentor' },
    
    // === SUPPLIER APIs (VERIFIED) ===
    { name: 'Supplier Products', url: '/api/supplier/products', method: 'GET', category: 'Supplier' },
    { name: 'Supplier Profile', url: '/api/supplier/profile', method: 'GET', category: 'Supplier' },
    { name: 'Supplier Stats', url: '/api/supplier/stats', method: 'GET', category: 'Supplier' },
    { name: 'Supplier Packages', url: '/api/supplier/packages', method: 'GET', category: 'Supplier' },
    { name: 'Supplier Quota', url: '/api/supplier/quota', method: 'GET', category: 'Supplier' },
    
    // === TRANSACTION APIs (GET-enabled only) ===
    { name: 'Transactions', url: '/api/transactions', method: 'GET', category: 'Transaction' },
    { name: 'Wallet', url: '/api/wallet', method: 'GET', category: 'Transaction' },
    // Note: /api/checkout and /api/payments are POST-only, not scanned
    
    // === FEATURE APIs (VERIFIED) ===
    { name: 'Notifications', url: '/api/notifications', method: 'GET', category: 'Feature' },
    { name: 'Groups', url: '/api/groups', method: 'GET', category: 'Feature' },
    { name: 'Chat Rooms', url: '/api/chat/rooms', method: 'GET', category: 'Feature' },
    { name: 'Posts', url: '/api/posts', method: 'GET', category: 'Feature' },
    { name: 'Progress', url: '/api/progress', method: 'GET', category: 'Feature' },
    { name: 'Messages', url: '/api/messages', method: 'GET', category: 'Feature' },
  ]

  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim()
  
  // Scan APIs in parallel batches
  const batchSize = 10
  for (let i = 0; i < allEndpoints.length; i += batchSize) {
    const batch = allEndpoints.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (endpoint) => {
        try {
          const startTime = Date.now()
          const response = await fetch(`${baseUrl}${endpoint.url}`, {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000)
          })
          const responseTime = Date.now() - startTime

          if (response.ok || response.status === 401 || response.status === 403) {
            // 401/403 is acceptable - means endpoint exists but needs auth
            return {
              category: 'API' as const,
              checkName: `[${endpoint.category}] ${endpoint.name}`,
              status: 'PASS' as const,
              level: 'INFO' as const,
              message: `Aktif (${response.status}) - ${responseTime}ms`,
              location: endpoint.url,
              details: `Response time: ${responseTime}ms`
            }
          } else if (response.status >= 500) {
            return {
              category: 'API' as const,
              checkName: `[${endpoint.category}] ${endpoint.name}`,
              status: 'FAIL' as const,
              level: 'CRITICAL' as const,
              message: `Server error ${response.status}`,
              location: endpoint.url,
              impact: 'Fitur terkait tidak berfungsi',
              suggestion: 'Periksa server logs dan fix error handler'
            }
          } else if (response.status === 404) {
            return {
              category: 'API' as const,
              checkName: `[${endpoint.category}] ${endpoint.name}`,
              status: 'WARNING' as const,
              level: 'MEDIUM' as const,
              message: `Not found (404)`,
              location: endpoint.url,
              suggestion: 'API endpoint mungkin belum dibuat atau path salah'
            }
          } else {
            return {
              category: 'API' as const,
              checkName: `[${endpoint.category}] ${endpoint.name}`,
              status: 'WARNING' as const,
              level: 'LOW' as const,
              message: `Response ${response.status}`,
              location: endpoint.url
            }
          }
        } catch (error: any) {
          return {
            category: 'API' as const,
            checkName: `[${endpoint.category}] ${endpoint.name}`,
            status: 'FAIL' as const,
            level: 'HIGH' as const,
            message: error.name === 'TimeoutError' ? 'Timeout (>10s)' : `Error: ${error.message}`,
            location: endpoint.url,
            impact: 'Endpoint tidak dapat diakses',
            suggestion: 'Periksa koneksi dan server status'
          }
        }
      })
    )
    results.push(...batchResults)
  }

  return results
}

// ===========================================
// DATABASE SCANNER
// ===========================================
async function scanDatabase(): Promise<ScanCheckResult[]> {
  const results: ScanCheckResult[] = []

  // 1. Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    results.push({
      category: 'DATABASE',
      checkName: 'DB: Connection',
      status: 'PASS',
      level: 'INFO',
      message: 'Koneksi database aktif (Neon PostgreSQL)'
    })
  } catch (error: any) {
    results.push({
      category: 'DATABASE',
      checkName: 'DB: Connection',
      status: 'FAIL',
      level: 'CRITICAL',
      message: `Koneksi database gagal: ${error.message}`,
      impact: 'Seluruh sistem tidak berfungsi',
      suggestion: 'Periksa DATABASE_URL dan status Neon'
    })
    return results // Stop if no connection
  }

  // 2. Check critical tables exist and have data
  const criticalTables = [
    { name: 'User', query: () => prisma.user.count() },
    { name: 'Membership', query: () => prisma.membership.count() },
    { name: 'Transaction', query: () => prisma.transaction.count() },
    { name: 'AffiliateProfile', query: () => prisma.affiliateProfile.count() },
    { name: 'Product', query: () => prisma.product.count() },
  ]

  for (const table of criticalTables) {
    try {
      const count = await table.query()
      results.push({
        category: 'DATABASE',
        checkName: `DB: Table ${table.name}`,
        status: 'PASS',
        level: 'INFO',
        message: `Tabel ${table.name} OK (${count} records)`,
        details: `Total records: ${count}`
      })
    } catch (error: any) {
      results.push({
        category: 'DATABASE',
        checkName: `DB: Table ${table.name}`,
        status: 'FAIL',
        level: 'HIGH',
        message: `Error accessing ${table.name}: ${error.message}`,
        suggestion: 'Jalankan prisma db push untuk sync schema'
      })
    }
  }

  // 3. Check for orphaned records (data integrity)
  try {
    // Affiliates without users
    const orphanedAffiliates = await prisma.affiliateProfile.count({
      where: {
        user: null
      }
    })
    if (orphanedAffiliates > 0) {
      results.push({
        category: 'DATABASE',
        checkName: 'DB: Orphaned Affiliates',
        status: 'WARNING',
        level: 'MEDIUM',
        message: `${orphanedAffiliates} affiliate tanpa user`,
        impact: 'Data tidak konsisten',
        suggestion: 'Bersihkan data orphan atau hubungkan ke user'
      })
    } else {
      results.push({
        category: 'DATABASE',
        checkName: 'DB: Orphaned Affiliates',
        status: 'PASS',
        level: 'INFO',
        message: 'Tidak ada affiliate orphan'
      })
    }
  } catch {
    // Skip if query fails
  }

  // 4. Check pending transactions older than 24 hours
  try {
    const oldPending = await prisma.transaction.count({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
    if (oldPending > 0) {
      results.push({
        category: 'DATABASE',
        checkName: 'DB: Stale Pending Transactions',
        status: 'WARNING',
        level: 'MEDIUM',
        message: `${oldPending} transaksi pending > 24 jam`,
        impact: 'Kemungkinan transaksi stuck',
        suggestion: 'Review dan update status transaksi'
      })
    } else {
      results.push({
        category: 'DATABASE',
        checkName: 'DB: Stale Pending Transactions',
        status: 'PASS',
        level: 'INFO',
        message: 'Tidak ada transaksi pending lama'
      })
    }
  } catch {
    // Skip
  }

  // 5. Check wallet balance consistency
  try {
    const negativeWallets = await prisma.wallet.count({
      where: {
        OR: [
          { balance: { lt: 0 } },
          { balancePending: { lt: 0 } }
        ]
      }
    })
    if (negativeWallets > 0) {
      results.push({
        category: 'DATABASE',
        checkName: 'DB: Negative Wallet Balance',
        status: 'FAIL',
        level: 'CRITICAL',
        message: `${negativeWallets} wallet dengan saldo negatif`,
        impact: 'Data keuangan tidak valid',
        suggestion: 'Investigasi dan perbaiki saldo wallet'
      })
    } else {
      results.push({
        category: 'DATABASE',
        checkName: 'DB: Wallet Balance',
        status: 'PASS',
        level: 'INFO',
        message: 'Semua wallet balance valid'
      })
    }
  } catch {
    // Skip
  }

  return results
}

// ===========================================
// FRONTEND SCANNER - ALL PAGES & FEATURES
// ===========================================
async function scanFrontend(): Promise<ScanCheckResult[]> {
  const results: ScanCheckResult[] = []
  
  // Comprehensive list of ALL pages (verified from actual folder structure)
  const allPages = [
    // === PUBLIC PAGES ===
    { name: 'Homepage', url: '/', category: 'Public' },
    { name: 'About', url: '/about', category: 'Public' },
    { name: 'Contact', url: '/contact', category: 'Public' },
    { name: 'Privacy Policy', url: '/privacy-policy', category: 'Public' },
    { name: 'Terms of Service', url: '/terms-of-service', category: 'Public' },
    { name: 'FAQ', url: '/faq', category: 'Public' },
    { name: 'Suppliers Public', url: '/suppliers', category: 'Public' },
    { name: 'Courses Public', url: '/courses', category: 'Public' },
    
    // === AUTH PAGES ===
    { name: 'Login', url: '/auth/login', category: 'Auth' },
    { name: 'Register', url: '/auth/register', category: 'Auth' },
    { name: 'Forgot Password', url: '/auth/forgot-password', category: 'Auth' },
    
    // === MEMBERSHIP PAGES ===
    { name: 'Memberships List', url: '/membership', category: 'Membership' },
    { name: 'Checkout Page', url: '/checkout', category: 'Membership' },
    
    // === ADMIN PAGES (verified from /src/app/(dashboard)/admin/) ===
    { name: 'Admin Dashboard', url: '/admin', category: 'Admin' },
    { name: 'Admin Dashboard Stats', url: '/admin/dashboard', category: 'Admin' },
    { name: 'Admin Users', url: '/admin/users', category: 'Admin' },
    { name: 'Admin Membership Plans', url: '/admin/membership-plans', category: 'Admin' },
    { name: 'Admin Products', url: '/admin/products', category: 'Admin' },
    { name: 'Admin Sales', url: '/admin/sales', category: 'Admin' },
    { name: 'Admin Affiliates', url: '/admin/affiliates', category: 'Admin' },
    { name: 'Admin Courses', url: '/admin/courses', category: 'Admin' },
    { name: 'Admin Supplier', url: '/admin/supplier', category: 'Admin' },
    { name: 'Admin Coupons', url: '/admin/coupons', category: 'Admin' },
    { name: 'Admin Groups', url: '/admin/groups', category: 'Admin' },
    { name: 'Admin Reports', url: '/admin/reports', category: 'Admin' },
    { name: 'Admin Certificates', url: '/admin/certificates', category: 'Admin' },
    { name: 'Admin Wallets', url: '/admin/wallets', category: 'Admin' },
    { name: 'Admin Payouts', url: '/admin/payouts', category: 'Admin' },
    { name: 'Admin Pending Revenue', url: '/admin/pending-revenue', category: 'Admin' },
    { name: 'Admin Analytics', url: '/admin/analytics', category: 'Admin' },
    { name: 'Admin Enrollments', url: '/admin/enrollments', category: 'Admin' },
    { name: 'Admin Events', url: '/admin/events', category: 'Admin' },
    { name: 'Admin Broadcast', url: '/admin/broadcast', category: 'Admin' },
    { name: 'Admin Short Links', url: '/admin/short-links', category: 'Admin' },
    { name: 'Admin Banners', url: '/admin/banners', category: 'Admin' },
    { name: 'Admin Support', url: '/admin/support', category: 'Admin' },
    { name: 'Admin Quiz', url: '/admin/quiz', category: 'Admin' },
    { name: 'Admin Feed', url: '/admin/feed', category: 'Admin' },
    { name: 'Admin Leaderboard', url: '/admin/leaderboard', category: 'Admin' },
    { name: 'Admin Marketing Kit', url: '/admin/marketing-kit', category: 'Admin' },
    { name: 'Admin Import', url: '/admin/import', category: 'Admin' },
    { name: 'Admin Documents', url: '/admin/documents', category: 'Admin' },
    
    // === ADMIN SETTINGS ===
    { name: 'Settings General', url: '/admin/settings', category: 'Admin Settings' },
    { name: 'Settings Branding', url: '/admin/settings/branding', category: 'Admin Settings' },
    { name: 'Settings Payment', url: '/admin/settings/payment', category: 'Admin Settings' },
    { name: 'Settings Withdrawal', url: '/admin/settings/withdrawal', category: 'Admin Settings' },
    { name: 'Settings Affiliate', url: '/admin/settings/affiliate', category: 'Admin Settings' },
    { name: 'Settings Follow-up', url: '/admin/settings/followup', category: 'Admin Settings' },
    { name: 'Settings Course', url: '/admin/settings/course', category: 'Admin Settings' },
    { name: 'Settings Platform', url: '/admin/settings/platform', category: 'Admin Settings' },
    { name: 'Settings Scanner', url: '/admin/settings/scanner', category: 'Admin Settings' },
    
    // === AFFILIATE PAGES (verified from /src/app/(affiliate)/affiliate/) ===
    { name: 'Affiliate Dashboard', url: '/affiliate', category: 'Affiliate' },
    { name: 'Affiliate Dashboard Page', url: '/affiliate/dashboard', category: 'Affiliate' },
    { name: 'Affiliate Links', url: '/affiliate/links', category: 'Affiliate' },
    { name: 'Affiliate Short Links', url: '/affiliate/short-links', category: 'Affiliate' },
    { name: 'Affiliate Earnings', url: '/affiliate/earnings', category: 'Affiliate' },
    { name: 'Affiliate Payouts', url: '/affiliate/payouts', category: 'Affiliate' },
    { name: 'Affiliate Training', url: '/affiliate/training', category: 'Affiliate' },
    { name: 'Affiliate Leaderboard', url: '/affiliate/leaderboard', category: 'Affiliate' },
    { name: 'Affiliate Leads', url: '/affiliate/leads', category: 'Affiliate' },
    { name: 'Affiliate Conversions', url: '/affiliate/conversions', category: 'Affiliate' },
    { name: 'Affiliate Credits', url: '/affiliate/credits', category: 'Affiliate' },
    { name: 'Affiliate Coupons', url: '/affiliate/coupons', category: 'Affiliate' },
    { name: 'Affiliate Broadcast', url: '/affiliate/broadcast', category: 'Affiliate' },
    { name: 'Affiliate Templates', url: '/affiliate/templates', category: 'Affiliate' },
    { name: 'Affiliate Automation', url: '/affiliate/automation', category: 'Affiliate' },
    { name: 'Affiliate Performance', url: '/affiliate/performance', category: 'Affiliate' },
    { name: 'Affiliate Reports', url: '/affiliate/reports', category: 'Affiliate' },
    { name: 'Affiliate Suppliers', url: '/affiliate/suppliers', category: 'Affiliate' },
    { name: 'Affiliate Onboarding', url: '/affiliate/onboarding', category: 'Affiliate' },
    { name: 'Affiliate Profile', url: '/affiliate/user-profile', category: 'Affiliate' },
    
    // === MEMBER PAGES (verified from /src/app/(dashboard)/member/) ===
    { name: 'Member Dashboard', url: '/member', category: 'Member' },
    { name: 'Member Dashboard Page', url: '/member/dashboard', category: 'Member' },
    { name: 'Member Courses', url: '/member/courses', category: 'Member' },
    { name: 'Member Learn', url: '/member/learn', category: 'Member' },
    { name: 'Member Certificates', url: '/member/certificates', category: 'Member' },
    { name: 'Member Documents', url: '/member/documents', category: 'Member' },
    { name: 'Member Profile', url: '/member/profile', category: 'Member' },
    { name: 'Member Transactions', url: '/member/transactions', category: 'Member' },
    { name: 'Member My Membership', url: '/member/my-membership', category: 'Member' },
    { name: 'Member Wallet', url: '/member/wallet', category: 'Member' },
    { name: 'Member Upgrade', url: '/member/upgrade', category: 'Member' },
    { name: 'Member Billing', url: '/member/billing', category: 'Member' },
    { name: 'Member Directory', url: '/member/member-directory', category: 'Member' },
    { name: 'Member Community Feed', url: '/member/community/feed', category: 'Member' },
    { name: 'Member Community Groups', url: '/member/community/groups', category: 'Member' },
    { name: 'Member Community Events', url: '/member/community/events', category: 'Member' },
    { name: 'Member Saved Posts', url: '/member/saved-posts', category: 'Member' },
    
    // === MENTOR PAGES ===
    { name: 'Mentor Dashboard', url: '/mentor', category: 'Mentor' },
    { name: 'Mentor Dashboard Page', url: '/mentor/dashboard', category: 'Mentor' },
    { name: 'Mentor Courses', url: '/mentor/courses', category: 'Mentor' },
    { name: 'Mentor Students', url: '/mentor/students', category: 'Mentor' },
    { name: 'Mentor Supplier Reviews', url: '/mentor/supplier/reviews', category: 'Mentor' },
    
    // === SUPPLIER PAGES ===
    { name: 'Supplier Dashboard', url: '/supplier/dashboard', category: 'Supplier' },
    { name: 'Supplier Products', url: '/supplier/products', category: 'Supplier' },
    { name: 'Supplier Profile', url: '/supplier/profile', category: 'Supplier' },
    { name: 'Supplier Onboarding', url: '/supplier/onboarding', category: 'Supplier' },
    
    // === DATABASE PAGES ===
    { name: 'Database Suppliers', url: '/databases/suppliers', category: 'Database' },
    { name: 'Database Forwarders', url: '/databases/forwarders', category: 'Database' },
    { name: 'Database Buyers', url: '/databases/buyers', category: 'Database' },
    { name: 'Admin Database Suppliers', url: '/admin/databases/suppliers', category: 'Admin Database' },
    { name: 'Admin Database Forwarders', url: '/admin/databases/forwarders', category: 'Admin Database' },
    { name: 'Admin Database Buyers', url: '/admin/databases/buyers', category: 'Admin Database' },
    { name: 'Member Database Suppliers', url: '/member/databases/suppliers', category: 'Member Database' },
    { name: 'Member Database Forwarders', url: '/member/databases/forwarders', category: 'Member Database' },
    { name: 'Member Database Buyers', url: '/member/databases/buyers', category: 'Member Database' },
    
    // === ADMIN EXTRA PAGES ===
    { name: 'Admin Integrations', url: '/admin/integrations', category: 'Admin' },
    { name: 'Admin OneSignal', url: '/admin/onesignal', category: 'Admin' },
    { name: 'Admin Sales Page', url: '/admin/salespage', category: 'Admin' },
    { name: 'Admin Features', url: '/admin/features', category: 'Admin' },
    { name: 'Admin Course Consents', url: '/admin/course-consents', category: 'Admin' },
    { name: 'Admin Documentation', url: '/admin/documentation', category: 'Admin' },
    { name: 'Admin Member Directory', url: '/admin/member-directory', category: 'Admin' },
    { name: 'Admin Supplier Products', url: '/admin/supplier/products', category: 'Admin Supplier' },
    { name: 'Admin Supplier Users', url: '/admin/supplier/users', category: 'Admin Supplier' },
    { name: 'Admin Supplier Verifications', url: '/admin/supplier/verifications', category: 'Admin Supplier' },
    { name: 'Admin Supplier Authorized Mentors', url: '/admin/supplier/authorized-mentors', category: 'Admin Supplier' },
    
    // === AFFILIATE EXTRA PAGES ===
    { name: 'Affiliate Bio', url: '/affiliate/bio', category: 'Affiliate' },
    { name: 'Affiliate Optin Forms', url: '/affiliate/optin-forms', category: 'Affiliate' },
    { name: 'Affiliate Materials', url: '/affiliate/materials', category: 'Affiliate' },
    { name: 'Affiliate Welcome', url: '/affiliate/welcome', category: 'Affiliate' },
    { name: 'Affiliate Statistics', url: '/affiliate/statistics', category: 'Affiliate' },
    { name: 'Affiliate Settings', url: '/affiliate/settings', category: 'Affiliate Settings' },
    { name: 'Affiliate Settings Follow-up', url: '/affiliate/settings/followup', category: 'Affiliate Settings' },
    { name: 'Affiliate Settings Withdrawal', url: '/affiliate/settings/withdrawal', category: 'Affiliate Settings' },
    
    // === OTHER FEATURES ===
    { name: 'Feed/Timeline', url: '/feed', category: 'Feature' },
    { name: 'Groups', url: '/groups', category: 'Feature' },
    { name: 'Notifications', url: '/notifications', category: 'Feature' },
    { name: 'Wallet', url: '/wallet', category: 'Feature' },
    { name: 'Chat', url: '/chat', category: 'Feature' },
    { name: 'Learn', url: '/learn', category: 'Feature' },
    { name: 'Documentation', url: '/documentation', category: 'Feature' },
    { name: 'Member Directory', url: '/member-directory', category: 'Feature' },
    { name: 'My Events', url: '/my-events', category: 'Feature' },
    { name: 'Dashboard Selector', url: '/dashboard-selector', category: 'Feature' },
    
    // === PUBLIC REGISTRATION ===
    { name: 'Daftar Affiliate', url: '/daftar-affiliate', category: 'Public' },
    { name: 'Daftar Supplier', url: '/daftar-supplier', category: 'Public' },
    { name: 'Register Supplier', url: '/register-supplier', category: 'Public' },
    { name: 'Beli Paket', url: '/beli-paket', category: 'Public' },
    { name: 'Migrasi', url: '/migrasi', category: 'Public' },
  ]

  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim()

  // Scan pages in parallel batches for speed
  const batchSize = 10
  for (let i = 0; i < allPages.length; i += batchSize) {
    const batch = allPages.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (page) => {
        try {
          const startTime = Date.now()
          const response = await fetch(`${baseUrl}${page.url}`, {
            method: 'GET',
            redirect: 'follow',
            signal: AbortSignal.timeout(15000)
          })
          const responseTime = Date.now() - startTime

          if (response.ok || response.status === 307 || response.status === 302) {
            const isSlowPage = responseTime > 3000
            return {
              category: 'FRONTEND' as const,
              checkName: `[${page.category}] ${page.name}`,
              status: isSlowPage ? 'WARNING' as const : 'PASS' as const,
              level: isSlowPage ? 'LOW' as const : 'INFO' as const,
              message: isSlowPage 
                ? `Halaman lambat (${responseTime}ms)` 
                : `OK (${responseTime}ms)`,
              location: page.url,
              details: `Load time: ${responseTime}ms`
            }
          } else if (response.status === 404) {
            return {
              category: 'FRONTEND' as const,
              checkName: `[${page.category}] ${page.name}`,
              status: 'FAIL' as const,
              level: 'HIGH' as const,
              message: 'Halaman tidak ditemukan (404)',
              location: page.url,
              impact: 'User tidak bisa akses halaman',
              suggestion: 'Periksa routing dan file page'
            }
          } else if (response.status >= 500) {
            return {
              category: 'FRONTEND' as const,
              checkName: `[${page.category}] ${page.name}`,
              status: 'FAIL' as const,
              level: 'CRITICAL' as const,
              message: `Server error ${response.status}`,
              location: page.url,
              impact: 'Halaman crash',
              suggestion: 'Periksa error logs dan fix component'
            }
          } else {
            return {
              category: 'FRONTEND' as const,
              checkName: `[${page.category}] ${page.name}`,
              status: 'WARNING' as const,
              level: 'MEDIUM' as const,
              message: `Response ${response.status}`,
              location: page.url
            }
          }
        } catch (error: any) {
          return {
            category: 'FRONTEND' as const,
            checkName: `[${page.category}] ${page.name}`,
            status: 'FAIL' as const,
            level: 'HIGH' as const,
            message: error.name === 'TimeoutError' ? 'Timeout (>15s)' : `Error: ${error.message}`,
            location: page.url,
            suggestion: 'Periksa server status'
          }
        }
      })
    )
    results.push(...batchResults)
  }

  return results
}

// ===========================================
// SECURITY SCANNER
// ===========================================
async function scanSecurity(): Promise<ScanCheckResult[]> {
  const results: ScanCheckResult[] = []

  // 1. Check environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ]

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      results.push({
        category: 'SECURITY',
        checkName: `Env: ${envVar}`,
        status: 'PASS',
        level: 'INFO',
        message: `${envVar} configured`
      })
    } else {
      results.push({
        category: 'SECURITY',
        checkName: `Env: ${envVar}`,
        status: 'FAIL',
        level: 'CRITICAL',
        message: `${envVar} tidak dikonfigurasi`,
        impact: 'Sistem tidak aman atau tidak berfungsi',
        suggestion: `Set ${envVar} di environment variables`
      })
    }
  }

  // 2. Check for users without passwords (potential security issue)
  try {
    const usersWithoutPassword = await prisma.user.count({
      where: {
        password: null,
        accounts: {
          none: {}
        }
      }
    })
    if (usersWithoutPassword > 0) {
      results.push({
        category: 'SECURITY',
        checkName: 'Security: Users Without Auth',
        status: 'WARNING',
        level: 'MEDIUM',
        message: `${usersWithoutPassword} user tanpa password/OAuth`,
        suggestion: 'Review akun-akun tersebut'
      })
    } else {
      results.push({
        category: 'SECURITY',
        checkName: 'Security: Users Auth',
        status: 'PASS',
        level: 'INFO',
        message: 'Semua user memiliki metode auth'
      })
    }
  } catch {
    // Skip
  }

  // 3. Check for admin users count (too many admins is a risk)
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    })
    if (adminCount > 5) {
      results.push({
        category: 'SECURITY',
        checkName: 'Security: Admin Count',
        status: 'WARNING',
        level: 'LOW',
        message: `${adminCount} admin users (lebih dari 5)`,
        suggestion: 'Review apakah semua admin diperlukan'
      })
    } else {
      results.push({
        category: 'SECURITY',
        checkName: 'Security: Admin Count',
        status: 'PASS',
        level: 'INFO',
        message: `${adminCount} admin users`
      })
    }
  } catch {
    // Skip
  }

  // 4. Check failed login attempts (if tracking exists)
  try {
    const recentFailedLogins = await prisma.activityLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    })
    if (recentFailedLogins > 10) {
      results.push({
        category: 'SECURITY',
        checkName: 'Security: Failed Logins',
        status: 'WARNING',
        level: 'HIGH',
        message: `${recentFailedLogins} failed logins dalam 1 jam terakhir`,
        impact: 'Kemungkinan brute force attack',
        suggestion: 'Review IP addresses dan implementasi rate limiting'
      })
    } else {
      results.push({
        category: 'SECURITY',
        checkName: 'Security: Failed Logins',
        status: 'PASS',
        level: 'INFO',
        message: `${recentFailedLogins} failed logins (normal)`
      })
    }
  } catch {
    // ActivityLog might not exist
    results.push({
      category: 'SECURITY',
      checkName: 'Security: Login Tracking',
      status: 'WARNING',
      level: 'LOW',
      message: 'Login tracking tidak aktif',
      suggestion: 'Implementasi activity logging untuk keamanan'
    })
  }

  return results
}

// ===========================================
// SYSTEM/PERFORMANCE SCANNER
// ===========================================
async function scanSystem(): Promise<ScanCheckResult[]> {
  const results: ScanCheckResult[] = []

  // 1. Check database query performance
  try {
    const startTime = Date.now()
    await prisma.user.findFirst()
    const queryTime = Date.now() - startTime
    
    if (queryTime > 1000) {
      results.push({
        category: 'PERFORMANCE',
        checkName: 'Performance: DB Query Speed',
        status: 'WARNING',
        level: 'MEDIUM',
        message: `Query lambat (${queryTime}ms)`,
        suggestion: 'Periksa database indexes dan connection pool'
      })
    } else {
      results.push({
        category: 'PERFORMANCE',
        checkName: 'Performance: DB Query Speed',
        status: 'PASS',
        level: 'INFO',
        message: `Query cepat (${queryTime}ms)`
      })
    }
  } catch {
    // Skip
  }

  // 2. Check for large tables that might need optimization
  try {
    const activityLogCount = await prisma.activityLog.count()
    if (activityLogCount > 100000) {
      results.push({
        category: 'SYSTEM',
        checkName: 'System: Activity Log Size',
        status: 'WARNING',
        level: 'LOW',
        message: `Activity log besar (${activityLogCount} records)`,
        suggestion: 'Pertimbangkan archiving atau cleanup'
      })
    } else {
      results.push({
        category: 'SYSTEM',
        checkName: 'System: Activity Log Size',
        status: 'PASS',
        level: 'INFO',
        message: `Activity log OK (${activityLogCount} records)`
      })
    }
  } catch {
    // Skip
  }

  // 3. Check Node.js memory usage
  const memoryUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
  const heapPercent = Math.round((heapUsedMB / heapTotalMB) * 100)

  if (heapPercent > 85) {
    results.push({
      category: 'SYSTEM',
      checkName: 'System: Memory Usage',
      status: 'WARNING',
      level: 'HIGH',
      message: `Memory tinggi (${heapUsedMB}MB / ${heapTotalMB}MB - ${heapPercent}%)`,
      impact: 'Kemungkinan memory leak',
      suggestion: 'Restart server dan monitor memory'
    })
  } else {
    results.push({
      category: 'SYSTEM',
      checkName: 'System: Memory Usage',
      status: 'PASS',
      level: 'INFO',
      message: `Memory OK (${heapUsedMB}MB / ${heapTotalMB}MB - ${heapPercent}%)`
    })
  }

  return results
}

// ===========================================
// MAIN SCAN EXECUTOR
// ===========================================
export async function runScan(
  scanType: ScanType = 'FULL',
  userId?: string
): Promise<ScanSummary> {
  const startTime = Date.now()
  
  // Create scan record
  const scan = await prisma.systemScan.create({
    data: {
      scanType,
      status: 'RUNNING',
      runBy: userId
    }
  })

  let allResults: ScanCheckResult[] = []

  try {
    // Run scans based on type
    switch (scanType) {
      case 'FULL':
        const [apiRes, dbRes, frontendRes, securityRes, systemRes] = await Promise.all([
          scanAPIs(),
          scanDatabase(),
          scanFrontend(),
          scanSecurity(),
          scanSystem()
        ])
        allResults = [...apiRes, ...dbRes, ...frontendRes, ...securityRes, ...systemRes]
        break
      case 'API':
        allResults = await scanAPIs()
        break
      case 'DATABASE':
        allResults = await scanDatabase()
        break
      case 'FRONTEND':
        allResults = await scanFrontend()
        break
      case 'SECURITY':
        allResults = await scanSecurity()
        break
      case 'QUICK':
        // Quick scan: only critical checks
        const [quickApi, quickDb] = await Promise.all([
          scanAPIs(),
          scanDatabase()
        ])
        allResults = [...quickApi, ...quickDb]
        break
    }

    // Calculate stats
    const passedChecks = allResults.filter(r => r.status === 'PASS').length
    const failedChecks = allResults.filter(r => r.status === 'FAIL').length
    const warningChecks = allResults.filter(r => r.status === 'WARNING').length
    const totalChecks = allResults.length

    // Calculate health score (100 - penalties)
    let healthScore = 100
    for (const result of allResults) {
      if (result.status === 'FAIL') {
        switch (result.level) {
          case 'CRITICAL': healthScore -= 20; break
          case 'HIGH': healthScore -= 10; break
          case 'MEDIUM': healthScore -= 5; break
          case 'LOW': healthScore -= 2; break
        }
      } else if (result.status === 'WARNING') {
        switch (result.level) {
          case 'HIGH': healthScore -= 5; break
          case 'MEDIUM': healthScore -= 3; break
          case 'LOW': healthScore -= 1; break
        }
      }
    }
    healthScore = Math.max(0, healthScore) // Don't go below 0

    // Save results to database
    await prisma.scanResult.createMany({
      data: allResults.map(r => ({
        scanId: scan.id,
        category: r.category,
        checkName: r.checkName,
        status: r.status,
        level: r.level,
        message: r.message,
        details: r.details,
        location: r.location,
        impact: r.impact,
        suggestion: r.suggestion
      }))
    })

    // Update scan record
    await prisma.systemScan.update({
      where: { id: scan.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalChecks,
        passedChecks,
        failedChecks,
        warningChecks,
        healthScore
      }
    })

    const duration = Date.now() - startTime

    return {
      scanId: scan.id,
      scanType,
      status: 'COMPLETED',
      healthScore,
      totalChecks,
      passedChecks,
      failedChecks,
      warningChecks,
      duration,
      results: allResults
    }

  } catch (error: any) {
    // Mark scan as failed
    await prisma.systemScan.update({
      where: { id: scan.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        metadata: { error: error.message }
      }
    })

    throw error
  }
}

// ===========================================
// GET SCAN HISTORY
// ===========================================
export async function getScanHistory(limit = 20) {
  return prisma.systemScan.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      _count: {
        select: { results: true }
      }
    }
  })
}

// ===========================================
// GET SCAN DETAILS
// ===========================================
export async function getScanDetails(scanId: string) {
  return prisma.systemScan.findUnique({
    where: { id: scanId },
    include: {
      results: {
        orderBy: [
          { level: 'asc' },
          { status: 'asc' }
        ]
      }
    }
  })
}

// ===========================================
// GET LATEST HEALTH STATUS
// ===========================================
export async function getLatestHealthStatus() {
  const latestScan = await prisma.systemScan.findFirst({
    where: { status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    include: {
      results: {
        where: {
          OR: [
            { status: 'FAIL' },
            { status: 'WARNING' }
          ]
        },
        orderBy: { level: 'asc' }
      }
    }
  })

  if (!latestScan) {
    return {
      hasData: false,
      message: 'Belum ada scan. Jalankan scan pertama.'
    }
  }

  return {
    hasData: true,
    scanId: latestScan.id,
    healthScore: latestScan.healthScore,
    totalChecks: latestScan.totalChecks,
    passedChecks: latestScan.passedChecks,
    failedChecks: latestScan.failedChecks,
    warningChecks: latestScan.warningChecks,
    lastScanAt: latestScan.completedAt,
    activeIssues: latestScan.results
  }
}

// ===========================================
// MARK ISSUE AS FIXED
// ===========================================
export async function markAsFixed(
  resultId: string, 
  userId: string, 
  fixMethod: string,
  notes?: string
) {
  const result = await prisma.scanResult.update({
    where: { id: resultId },
    data: {
      isFixed: true,
      fixedAt: new Date(),
      fixedBy: userId,
      fixMethod
    }
  })

  // Log the fix
  await prisma.fixLog.create({
    data: {
      resultId,
      category: result.category,
      errorType: result.checkName,
      errorMessage: result.message,
      fixMethod,
      fixedBy: userId,
      isAutoFix: false,
      success: true,
      notes
    }
  })

  return result
}

// ===========================================
// IGNORE ISSUE
// ===========================================
export async function ignoreIssue(resultId: string, userId: string) {
  return prisma.scanResult.update({
    where: { id: resultId },
    data: {
      isIgnored: true,
      ignoredAt: new Date(),
      ignoredBy: userId
    }
  })
}

// ===========================================
// GET FIX HISTORY
// ===========================================
export async function getFixHistory(limit = 50) {
  return prisma.fixLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}
