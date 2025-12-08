/**
 * Integration Configuration Service
 * Provides fallback mechanism for getting integration configs
 * Priority: Environment Variables → Database → Default Values
 */

import { prisma } from '@/lib/prisma'

export class IntegrationService {
  private static configCache = new Map<string, any>()
  private static cacheExpiry = new Map<string, number>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get configuration for a service with fallback mechanism
   */
  static async getConfig(service: string): Promise<any> {
    try {
      // Check cache first
      if (this.isConfigCached(service)) {
        console.log(`[CONFIG] Using cached config for ${service}`)
        return this.configCache.get(service)
      }

      // Try environment variables first
      const envConfig = this.getEnvConfig(service)
      if (envConfig && Object.keys(envConfig).length > 0) {
        console.log(`[CONFIG] Using environment config for ${service}`)
        this.setCache(service, envConfig)
        return envConfig
      }

      // Fallback to database
      console.log(`[CONFIG] Falling back to database for ${service}`)
      const dbConfig = await this.getDbConfig(service)
      if (dbConfig) {
        this.setCache(service, dbConfig)
        return dbConfig
      }

      // Return empty config if nothing found
      console.log(`[CONFIG] No config found for ${service}, using defaults`)
      return {}

    } catch (error) {
      console.error(`[CONFIG] Error getting config for ${service}:`, error)
      return {}
    }
  }

  /**
   * Get configuration from environment variables
   */
  private static getEnvConfig(service: string): any {
    const envMappings: Record<string, string[]> = {
      xendit: ['XENDIT_SECRET_KEY', 'XENDIT_WEBHOOK_TOKEN', 'XENDIT_ENVIRONMENT', 'XENDIT_VA_COMPANY_CODE'],
      mailketing: ['MAILKETING_API_KEY', 'MAILKETING_SENDER_EMAIL', 'MAILKETING_SENDER_NAME'],
      starsender: ['STARSENDER_API_KEY', 'STARSENDER_DEVICE_ID'],
      onesignal: ['ONESIGNAL_APP_ID', 'ONESIGNAL_API_KEY'],
      pusher: ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER'],
    }

    const envVars = envMappings[service] || []
    const config: any = {}

    for (const envVar of envVars) {
      const value = process.env[envVar]
      if (value) {
        config[envVar] = value
      }
    }

    return config
  }

  /**
   * Get configuration from database
   */
  private static async getDbConfig(service: string): Promise<any> {
    try {
      const integrationConfig = await prisma.integrationConfig.findUnique({
        where: { service },
      })

      if (integrationConfig && integrationConfig.isActive) {
        return integrationConfig.config
      }

      return null
    } catch (error) {
      console.error(`[CONFIG] Database error for ${service}:`, error)
      return null
    }
  }

  /**
   * Check if config is cached and not expired
   */
  private static isConfigCached(service: string): boolean {
    const expiry = this.cacheExpiry.get(service)
    if (!expiry || Date.now() > expiry) {
      return false
    }
    return this.configCache.has(service)
  }

  /**
   * Cache config with expiry
   */
  private static setCache(service: string, config: any): void {
    this.configCache.set(service, config)
    this.cacheExpiry.set(service, Date.now() + this.CACHE_DURATION)
  }

  /**
   * Clear cache for a service
   */
  static clearCache(service?: string): void {
    if (service) {
      this.configCache.delete(service)
      this.cacheExpiry.delete(service)
    } else {
      this.configCache.clear()
      this.cacheExpiry.clear()
    }
  }

  /**
   * Check if a service is properly configured
   */
  static async isConfigured(service: string): Promise<boolean> {
    const config = await this.getConfig(service)
    
    const requiredFields: Record<string, string[]> = {
      xendit: ['XENDIT_SECRET_KEY', 'XENDIT_ENVIRONMENT'],
      mailketing: ['MAILKETING_API_KEY'],
      starsender: ['STARSENDER_API_KEY', 'STARSENDER_DEVICE_ID'],
      onesignal: ['ONESIGNAL_APP_ID', 'ONESIGNAL_API_KEY'],
      pusher: ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET'],
    }

    const required = requiredFields[service] || []
    return required.every(field => config[field])
  }

  /**
   * Get status of all services
   */
  static async getServicesStatus(): Promise<Record<string, 'connected' | 'not-configured' | 'error'>> {
    const services = ['xendit', 'mailketing', 'starsender', 'onesignal', 'pusher']
    const status: Record<string, 'connected' | 'not-configured' | 'error'> = {}

    await Promise.all(
      services.map(async (service) => {
        try {
          const isConfigured = await this.isConfigured(service)
          status[service] = isConfigured ? 'connected' : 'not-configured'
        } catch (error) {
          status[service] = 'error'
        }
      })
    )

    return status
  }
}

export default IntegrationService