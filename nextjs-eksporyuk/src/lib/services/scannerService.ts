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
// API SCANNER
// ===========================================
async function scanAPIs(): Promise<ScanCheckResult[]> {
  const results: ScanCheckResult[] = []
  
  const criticalEndpoints = [
    { name: 'Auth Login', url: '/api/auth/session', method: 'GET' },
    { name: 'User Profile', url: '/api/user/profile', method: 'GET' },
    { name: 'Memberships List', url: '/api/memberships', method: 'GET' },
    { name: 'Products List', url: '/api/products', method: 'GET' },
    { name: 'Affiliate Links', url: '/api/affiliate/links', method: 'GET' },
    { name: 'Admin Dashboard Stats', url: '/api/admin/dashboard/stats', method: 'GET' },
    { name: 'Transactions', url: '/api/transactions', method: 'GET' },
    { name: 'Notifications', url: '/api/notifications', method: 'GET' },
  ]

  for (const endpoint of criticalEndpoints) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        // Short timeout for health check
        signal: AbortSignal.timeout(10000)
      })
      const responseTime = Date.now() - startTime

      if (response.ok || response.status === 401) {
        // 401 is acceptable - means endpoint exists but needs auth
        results.push({
          category: 'API',
          checkName: `API: ${endpoint.name}`,
          status: 'PASS',
          level: 'INFO',
          message: `Endpoint aktif (${response.status}) - ${responseTime}ms`,
          location: endpoint.url,
          details: `Response time: ${responseTime}ms`
        })
      } else if (response.status >= 500) {
        results.push({
          category: 'API',
          checkName: `API: ${endpoint.name}`,
          status: 'FAIL',
          level: 'CRITICAL',
          message: `Server error ${response.status}`,
          location: endpoint.url,
          impact: 'Fitur terkait tidak berfungsi',
          suggestion: 'Periksa server logs dan fix error handler'
        })
      } else if (response.status >= 400) {
        results.push({
          category: 'API',
          checkName: `API: ${endpoint.name}`,
          status: 'WARNING',
          level: 'MEDIUM',
          message: `Client error ${response.status}`,
          location: endpoint.url,
          suggestion: 'Periksa request format atau authentication'
        })
      }
    } catch (error: any) {
      results.push({
        category: 'API',
        checkName: `API: ${endpoint.name}`,
        status: 'FAIL',
        level: 'HIGH',
        message: error.name === 'TimeoutError' ? 'Request timeout' : `Error: ${error.message}`,
        location: endpoint.url,
        impact: 'Endpoint tidak dapat diakses',
        suggestion: 'Periksa koneksi dan server status'
      })
    }
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
// FRONTEND SCANNER
// ===========================================
async function scanFrontend(): Promise<ScanCheckResult[]> {
  const results: ScanCheckResult[] = []
  
  const criticalPages = [
    { name: 'Homepage', url: '/' },
    { name: 'Login', url: '/auth/login' },
    { name: 'Register', url: '/auth/register' },
    { name: 'Memberships', url: '/membership' },
    { name: 'Admin Dashboard', url: '/admin' },
    { name: 'Affiliate Dashboard', url: '/affiliate' },
    { name: 'Checkout', url: '/checkout' },
  ]

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  for (const page of criticalPages) {
    try {
      const startTime = Date.now()
      const response = await fetch(`${baseUrl}${page.url}`, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      })
      const responseTime = Date.now() - startTime

      if (response.ok || response.status === 307 || response.status === 302) {
        // 307/302 redirects are OK (auth redirects)
        const isSlowPage = responseTime > 3000
        results.push({
          category: 'FRONTEND',
          checkName: `Page: ${page.name}`,
          status: isSlowPage ? 'WARNING' : 'PASS',
          level: isSlowPage ? 'LOW' : 'INFO',
          message: isSlowPage 
            ? `Halaman lambat (${responseTime}ms)` 
            : `Halaman OK (${responseTime}ms)`,
          location: page.url,
          details: `Load time: ${responseTime}ms`,
          suggestion: isSlowPage ? 'Optimalkan page load time' : undefined
        })
      } else if (response.status === 404) {
        results.push({
          category: 'FRONTEND',
          checkName: `Page: ${page.name}`,
          status: 'FAIL',
          level: 'HIGH',
          message: 'Halaman tidak ditemukan (404)',
          location: page.url,
          impact: 'User tidak bisa akses halaman',
          suggestion: 'Periksa routing dan file page'
        })
      } else if (response.status >= 500) {
        results.push({
          category: 'FRONTEND',
          checkName: `Page: ${page.name}`,
          status: 'FAIL',
          level: 'CRITICAL',
          message: `Server error ${response.status}`,
          location: page.url,
          impact: 'Halaman crash',
          suggestion: 'Periksa error logs dan fix component'
        })
      }
    } catch (error: any) {
      results.push({
        category: 'FRONTEND',
        checkName: `Page: ${page.name}`,
        status: 'FAIL',
        level: 'HIGH',
        message: `Error: ${error.message}`,
        location: page.url,
        suggestion: 'Periksa server status'
      })
    }
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
