/**
 * Integration Config Helper
 * Load integration configurations from database (IntegrationConfig)
 * Used by checkout, payment, and other services to get Xendit credentials dynamically
 */

import { prisma } from '@/lib/prisma'

export interface XenditConfig {
  XENDIT_SECRET_KEY: string
  XENDIT_WEBHOOK_TOKEN: string
  XENDIT_ENVIRONMENT: 'development' | 'production'
  XENDIT_VA_COMPANY_CODE?: string
}

export interface MailketingConfig {
  MAILKETING_API_KEY: string
  MAILKETING_SENDER_EMAIL: string
  MAILKETING_SENDER_NAME: string
  MAILKETING_REPLY_TO_EMAIL: string
  MAILKETING_FORWARD_EMAIL: string
}

export interface StarSenderConfig {
  STARSENDER_API_KEY: string
  STARSENDER_DEVICE_ID: string
}

export interface OneSignalConfig {
  ONESIGNAL_APP_ID: string
  ONESIGNAL_API_KEY: string
}

export interface PusherConfig {
  PUSHER_APP_ID: string
  PUSHER_KEY: string
  PUSHER_SECRET: string
  PUSHER_CLUSTER: string
}

export interface GoogleOAuthConfig {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_CALLBACK_URL?: string
}

/**
 * Get Xendit configuration from database or fallback to environment variables
 * Priority: Database config > Environment variables
 */
export async function getXenditConfig(): Promise<XenditConfig | null> {
  try {
    // Try to get from database first
    const integrationConfig = await prisma.integrationConfig.findFirst({
      where: { service: 'xendit' }
    })

    if (integrationConfig && integrationConfig.isActive) {
      const config = integrationConfig.config as any
      
      // Validate required fields
      if (config.XENDIT_SECRET_KEY && config.XENDIT_WEBHOOK_TOKEN && config.XENDIT_ENVIRONMENT) {
        console.log('✅ Using Xendit config from database')
        return {
          XENDIT_SECRET_KEY: config.XENDIT_SECRET_KEY,
          XENDIT_WEBHOOK_TOKEN: config.XENDIT_WEBHOOK_TOKEN,
          XENDIT_ENVIRONMENT: config.XENDIT_ENVIRONMENT,
          XENDIT_VA_COMPANY_CODE: config.XENDIT_VA_COMPANY_CODE || '88088'
        }
      }
    }

    // Fallback to environment variables
    if (process.env.XENDIT_SECRET_KEY) {
      console.log('⚠️ Using Xendit config from environment variables (fallback)')
      return {
        XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY,
        XENDIT_WEBHOOK_TOKEN: process.env.XENDIT_WEBHOOK_TOKEN || '',
        XENDIT_ENVIRONMENT: (process.env.XENDIT_ENVIRONMENT as 'development' | 'production') || 'development',
        XENDIT_VA_COMPANY_CODE: process.env.XENDIT_VA_COMPANY_CODE || '88088'
      }
    }

    console.warn('⚠️ No Xendit configuration found in database or environment')
    return null
  } catch (error) {
    console.error('❌ Error loading Xendit config:', error)
    
    // Final fallback to environment variables
    if (process.env.XENDIT_SECRET_KEY) {
      return {
        XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY,
        XENDIT_WEBHOOK_TOKEN: process.env.XENDIT_WEBHOOK_TOKEN || '',
        XENDIT_ENVIRONMENT: (process.env.XENDIT_ENVIRONMENT as 'development' | 'production') || 'development',
        XENDIT_VA_COMPANY_CODE: process.env.XENDIT_VA_COMPANY_CODE || '88088'
      }
    }
    
    return null
  }
}

/**
 * Get Mailketing configuration from database or fallback to environment variables
 */
export async function getMailketingConfig(): Promise<MailketingConfig | null> {
  try {
    const integrationConfig = await prisma.integrationConfig.findFirst({
      where: { service: 'mailketing' }
    })

    if (integrationConfig && integrationConfig.isActive) {
      const config = integrationConfig.config as any
      
      if (config.MAILKETING_API_KEY) {
        return {
          MAILKETING_API_KEY: config.MAILKETING_API_KEY,
          MAILKETING_SENDER_EMAIL: config.MAILKETING_SENDER_EMAIL || '',
          MAILKETING_SENDER_NAME: config.MAILKETING_SENDER_NAME || 'EksporYuk',
          MAILKETING_REPLY_TO_EMAIL: config.MAILKETING_REPLY_TO_EMAIL || config.MAILKETING_SENDER_EMAIL || '',
          MAILKETING_FORWARD_EMAIL: config.MAILKETING_FORWARD_EMAIL || ''
        }
      }
    }

    // Fallback to environment
    if (process.env.MAILKETING_API_KEY) {
      return {
        MAILKETING_API_KEY: process.env.MAILKETING_API_KEY,
        MAILKETING_SENDER_EMAIL: process.env.MAILKETING_SENDER_EMAIL || '',
        MAILKETING_SENDER_NAME: process.env.MAILKETING_SENDER_NAME || 'EksporYuk',
        MAILKETING_REPLY_TO_EMAIL: process.env.MAILKETING_REPLY_TO_EMAIL || process.env.MAILKETING_SENDER_EMAIL || '',
        MAILKETING_FORWARD_EMAIL: process.env.MAILKETING_FORWARD_EMAIL || ''
      }
    }

    return null
  } catch (error) {
    console.error('Error loading Mailketing config:', error)
    return null
  }
}

/**
 * Get StarSender configuration from database or fallback to environment variables
 */
export async function getStarSenderConfig(): Promise<StarSenderConfig | null> {
  try {
    const integrationConfig = await prisma.integrationConfig.findFirst({
      where: { service: 'starsender' }
    })

    if (integrationConfig && integrationConfig.isActive) {
      const config = integrationConfig.config as any
      
      if (config.STARSENDER_API_KEY && config.STARSENDER_DEVICE_ID) {
        return {
          STARSENDER_API_KEY: config.STARSENDER_API_KEY,
          STARSENDER_DEVICE_ID: config.STARSENDER_DEVICE_ID
        }
      }
    }

    // Fallback to environment
    if (process.env.STARSENDER_API_KEY && process.env.STARSENDER_DEVICE_ID) {
      return {
        STARSENDER_API_KEY: process.env.STARSENDER_API_KEY,
        STARSENDER_DEVICE_ID: process.env.STARSENDER_DEVICE_ID
      }
    }

    return null
  } catch (error) {
    console.error('Error loading StarSender config:', error)
    return null
  }
}

/**
 * Get OneSignal configuration from database or fallback to environment variables
 */
export async function getOneSignalConfig(): Promise<OneSignalConfig | null> {
  try {
    const integrationConfig = await prisma.integrationConfig.findFirst({
      where: { service: 'onesignal' }
    })

    if (integrationConfig && integrationConfig.isActive) {
      const config = integrationConfig.config as any
      
      if (config.ONESIGNAL_APP_ID && config.ONESIGNAL_API_KEY) {
        return {
          ONESIGNAL_APP_ID: config.ONESIGNAL_APP_ID,
          ONESIGNAL_API_KEY: config.ONESIGNAL_API_KEY
        }
      }
    }

    // Fallback to environment
    if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY) {
      return {
        ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID,
        ONESIGNAL_API_KEY: process.env.ONESIGNAL_API_KEY
      }
    }

    return null
  } catch (error) {
    console.error('Error loading OneSignal config:', error)
    return null
  }
}

/**
 * Get Pusher configuration from database or fallback to environment variables
 */
export async function getPusherConfig(): Promise<PusherConfig | null> {
  try {
    const integrationConfig = await prisma.integrationConfig.findFirst({
      where: { service: 'pusher' }
    })

    if (integrationConfig && integrationConfig.isActive) {
      const config = integrationConfig.config as any
      
      if (config.PUSHER_APP_ID && config.PUSHER_KEY && config.PUSHER_SECRET) {
        return {
          PUSHER_APP_ID: config.PUSHER_APP_ID,
          PUSHER_KEY: config.PUSHER_KEY,
          PUSHER_SECRET: config.PUSHER_SECRET,
          PUSHER_CLUSTER: config.PUSHER_CLUSTER || 'ap1'
        }
      }
    }

    // Fallback to environment
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
      return {
        PUSHER_APP_ID: process.env.PUSHER_APP_ID,
        PUSHER_KEY: process.env.PUSHER_KEY,
        PUSHER_SECRET: process.env.PUSHER_SECRET,
        PUSHER_CLUSTER: process.env.PUSHER_CLUSTER || 'ap1'
      }
    }

    return null
  } catch (error) {
    console.error('Error loading Pusher config:', error)
    return null
  }
}

/**
 * Get Google OAuth configuration from database or fallback to environment variables
 */
export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig | null> {
  try {
    const integrationConfig = await prisma.integrationConfig.findFirst({
      where: { service: 'google' }
    })

    if (integrationConfig && integrationConfig.isActive) {
      const config = integrationConfig.config as any
      
      if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
        console.log('✅ Using Google OAuth config from database')
        return {
          GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET: config.GOOGLE_CLIENT_SECRET,
          GOOGLE_CALLBACK_URL: config.GOOGLE_CALLBACK_URL
        }
      }
    }

    // Fallback to environment
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      console.log('⚠️ Using Google OAuth config from environment variables (fallback)')
      return {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
      }
    }

    console.warn('⚠️ No Google OAuth configuration found in database or environment')
    return null
  } catch (error) {
    console.error('❌ Error loading Google OAuth config:', error)
    
    // Final fallback to environment
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      return {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
      }
    }
    
    return null
  }
}

/**
 * Check if a service is configured and active
 */
export async function getIntegrationStatus(service: string): Promise<boolean> {
  try {
    const config = await prisma.integrationConfig.findFirst({
      where: { service }
    })
    
    return config?.isActive === true
  } catch (error) {
    console.error(`Error checking ${service} config:`, error)
    return false
  }
}
