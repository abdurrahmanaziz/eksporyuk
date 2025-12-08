/**
 * PUSHER INTEGRATION
 * Real-time updates via WebSocket
 */

import Pusher from 'pusher'
import PusherClient from 'pusher-js'

interface PusherConfig {
  appId: string
  key: string
  secret: string
  cluster: string
}

class PusherService {
  private config: PusherConfig
  private pusherServer: Pusher | null = null
  private pusherClient: PusherClient | null = null

  constructor() {
    this.config = {
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || 'ap1'
    }
  }

  // Server-side pusher (untuk trigger events)
  getServer(): Pusher {
    if (!this.pusherServer && this.isConfigured()) {
      this.pusherServer = new Pusher({
        appId: this.config.appId,
        key: this.config.key,
        secret: this.config.secret,
        cluster: this.config.cluster,
        useTLS: true
      })
    }
    
    if (!this.pusherServer) {
      throw new Error('Pusher not configured')
    }
    
    return this.pusherServer
  }

  // Client-side pusher (untuk subscribe events)
  getClient(): PusherClient {
    if (typeof window === 'undefined') {
      throw new Error('Pusher client can only be used in browser')
    }

    if (!this.pusherClient && this.isConfigured()) {
      this.pusherClient = new PusherClient(this.config.key, {
        cluster: this.config.cluster,
        forceTLS: true,
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      })
    }

    if (!this.pusherClient) {
      throw new Error('Pusher not configured')
    }

    return this.pusherClient
  }

  // Trigger event dari server
  async trigger(channel: string, event: string, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const pusher = this.getServer()
      await pusher.trigger(channel, event, data)
      
      return { success: true }
    } catch (error: any) {
      console.error('[PUSHER] Trigger error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Trigger multiple channels
  async triggerMultiple(
    channels: string[], 
    event: string, 
    data: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const pusher = this.getServer()
      await pusher.trigger(channels, event, data)
      
      return { success: true }
    } catch (error: any) {
      console.error('[PUSHER] Trigger multiple error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Helper: Trigger ke user tertentu
  // IMPORTANT: Must match client-side subscription channel name
  async notifyUser(userId: string, event: string, data: any): Promise<{ success: boolean; error?: string }> {
    return await this.trigger(`user-${userId}`, event, data)
  }

  // Helper: Trigger ke group
  // IMPORTANT: Must match client-side subscription channel name
  async notifyGroup(groupId: string, event: string, data: any): Promise<{ success: boolean; error?: string }> {
    return await this.trigger(`group-${groupId}`, event, data)
  }

  // Helper: Broadcast ke semua
  async broadcast(event: string, data: any): Promise<{ success: boolean; error?: string }> {
    return await this.trigger('public-channel', event, data)
  }

  isConfigured(): boolean {
    return !!(this.config.appId && this.config.key && this.config.secret)
  }
}

export const pusherService = new PusherService()
export default pusherService
