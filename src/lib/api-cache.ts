// Simple in-memory cache for API responses
// This helps reduce database queries for frequently accessed data

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()

  set<T>(key: string, data: T, ttlSeconds: number = 30): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Get or set pattern - fetch from cache or execute function
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlSeconds: number = 30
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetchFn()
    this.set(key, data, ttlSeconds)
    return data
  }
}

// Global singleton
const globalForCache = globalThis as unknown as {
  apiCache: SimpleCache | undefined
}

export const apiCache = globalForCache.apiCache ?? new SimpleCache()

if (process.env.NODE_ENV !== 'production') {
  globalForCache.apiCache = apiCache
}

// Cache keys constants
export const CACHE_KEYS = {
  ADMIN_STATS: 'admin:stats',
  ADMIN_ANALYTICS: (period: string) => `admin:analytics:${period}`,
  SETTINGS: 'settings',
  MEMBERSHIP_PLANS: 'membership:plans',
  PRODUCTS_LIST: 'products:list',
  COURSES_LIST: 'courses:list',
} as const

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 30,       // 30 seconds - for frequently changing data
  MEDIUM: 60,      // 1 minute - for moderate data
  LONG: 120,       // 2 minutes - for rarely changing data
  VERY_LONG: 300,  // 5 minutes - for static data
} as const
