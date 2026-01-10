/**
 * Simple Rate Limiter for Email APIs
 * Prevents spam and abuse without external dependencies
 * 
 * Strategy: In-memory store with automatic cleanup
 * Limit: 3 requests per 15 minutes per identifier (email/IP)
 */

interface RateLimitRecord {
  count: number
  resetAt: number
  requests: number[]
}

class SimpleRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number
  private readonly cleanupInterval: number

  constructor(maxRequests = 3, windowMinutes = 15) {
    this.maxRequests = maxRequests
    this.windowMs = windowMinutes * 60 * 1000
    this.cleanupInterval = 5 * 60 * 1000 // Cleanup every 5 minutes

    // Auto cleanup old entries
    if (typeof window === 'undefined') { // Only in server-side
      setInterval(() => this.cleanup(), this.cleanupInterval)
    }
  }

  /**
   * Check if identifier (email or IP) is rate limited
   * @param identifier Unique identifier (email or IP address)
   * @returns { limited: boolean, remaining: number, resetAt: number }
   */
  async check(identifier: string): Promise<{
    limited: boolean
    remaining: number
    resetAt: number
    current: number
  }> {
    const now = Date.now()
    const key = this.normalizeKey(identifier)
    
    let record = this.store.get(key)

    // Create new record if doesn't exist or expired
    if (!record || record.resetAt < now) {
      record = {
        count: 0,
        resetAt: now + this.windowMs,
        requests: []
      }
      this.store.set(key, record)
    }

    // Filter out old requests (older than window)
    record.requests = record.requests.filter(timestamp => timestamp > now - this.windowMs)

    // Add current request
    record.requests.push(now)
    record.count = record.requests.length

    const limited = record.count > this.maxRequests
    const remaining = Math.max(0, this.maxRequests - record.count)

    return {
      limited,
      remaining,
      resetAt: record.resetAt,
      current: record.count
    }
  }

  /**
   * Reset rate limit for specific identifier
   */
  reset(identifier: string): void {
    const key = this.normalizeKey(identifier)
    this.store.delete(key)
  }

  /**
   * Get current status without incrementing
   */
  getStatus(identifier: string): {
    count: number
    remaining: number
    resetAt: number
  } | null {
    const key = this.normalizeKey(identifier)
    const record = this.store.get(key)
    
    if (!record) {
      return {
        count: 0,
        remaining: this.maxRequests,
        resetAt: Date.now() + this.windowMs
      }
    }

    return {
      count: record.count,
      remaining: Math.max(0, this.maxRequests - record.count),
      resetAt: record.resetAt
    }
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, record] of this.store.entries()) {
      if (record.resetAt < now) {
        this.store.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleanup: ${cleaned} expired records removed`)
    }
  }

  /**
   * Normalize key to lowercase
   */
  private normalizeKey(identifier: string): string {
    return identifier.toLowerCase().trim()
  }

  /**
   * Get total stored records
   */
  getStoreSize(): number {
    return this.store.size
  }
}

// Singleton instances for different use cases
export const emailRateLimiter = new SimpleRateLimiter(3, 15) // 3 requests per 15 min
export const verificationRateLimiter = new SimpleRateLimiter(5, 30) // 5 requests per 30 min
export const generalRateLimiter = new SimpleRateLimiter(10, 5) // 10 requests per 5 min

/**
 * Helper function to get client IP from request
 */
export function getClientIP(request: Request): string {
  // Try various headers (Cloudflare, Vercel, nginx, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIp) return cfConnectingIp
  if (realIp) return realIp
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  return 'unknown'
}

/**
 * Helper function to format reset time
 */
export function formatResetTime(resetAt: number): string {
  const minutes = Math.ceil((resetAt - Date.now()) / 60000)
  return minutes > 1 ? `${minutes} menit` : '1 menit'
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(resetAt: number, current: number, max: number) {
  return {
    error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
    details: `Anda telah mencapai batas ${max} permintaan. Coba lagi dalam ${formatResetTime(resetAt)}.`,
    retryAfter: Math.ceil((resetAt - Date.now()) / 1000), // seconds
    limit: max,
    current: current,
    resetAt: new Date(resetAt).toISOString()
  }
}

export default emailRateLimiter
