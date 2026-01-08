/**
 * ONESIGNAL PUSH NOTIFICATION TEMPLATES
 * Branded templates untuk browser push notifications via OneSignal
 */

interface OneSignalNotificationData {
  headings: { en: string; id: string }
  contents: { en: string; id: string }
  data?: any
  url?: string
  big_picture?: string
  large_icon?: string
  small_icon?: string
  chrome_web_icon?: string
  chrome_web_badge?: string
  web_buttons?: Array<{
    id: string
    text: string
    url: string
    icon?: string
  }>
  android_accent_color?: string
  android_led_color?: string
  ios_badgeType?: string
  ios_badgeCount?: number
  web_push_topic?: string
  ttl?: number
  priority?: number
  collapse_id?: string
}

interface AffiliateOneSignalTemplateData {
  userName: string
  feature: string
  action: string
  details?: string
  link?: string
  buttonText?: string
  buttonUrl?: string
  urgency?: 'low' | 'normal' | 'high'
}

export class OneSignalNotificationTemplates {
  
  // Base icons and branding
  private static readonly BRAND_CONFIG = {
    smallIcon: 'https://eksporyuk.com/assets/icons/logo-small.png',
    largeIcon: 'https://eksporyuk.com/assets/icons/logo-large.png',
    webIcon: 'https://eksporyuk.com/assets/icons/logo-web.png',
    webBadge: 'https://eksporyuk.com/assets/icons/badge.png',
    accentColor: '#3B82F6',
    ledColor: '#3B82F6'
  }

  /**
   * Bio Page Success Notification
   */
  static bioPageUpdated(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    return {
      headings: {
        en: `🎉 Bio Page ${data.action}!`,
        id: `🎉 Bio Page ${data.action}!`
      },
      contents: {
        en: `${data.feature} ready to share. ${data.details || 'Start boosting your engagement now!'}`,
        id: `${data.feature} siap untuk dishare. ${data.details || 'Mulai tingkatkan engagement sekarang!'}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/bio',
      big_picture: 'https://eksporyuk.com/assets/push/bio-page-success-banner.png',
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'manage_bio',
          text: data.buttonText || 'Kelola Bio Page',
          url: data.buttonUrl || 'https://eksporyuk.com/affiliate/bio',
          icon: 'https://eksporyuk.com/assets/icons/edit.png'
        },
        {
          id: 'view_stats',
          text: 'Lihat Statistik',
          url: 'https://eksporyuk.com/affiliate/analytics',
          icon: 'https://eksporyuk.com/assets/icons/stats.png'
        }
      ],
      android_accent_color: this.BRAND_CONFIG.accentColor,
      android_led_color: this.BRAND_CONFIG.ledColor,
      data: {
        category: 'bio_page',
        feature: data.feature,
        action: data.action,
        timestamp: new Date().toISOString()
      },
      ttl: 86400, // 24 hours
      priority: data.urgency === 'high' ? 10 : 6
    }
  }

  /**
   * Challenge Joined Notification
   */
  static challengeJoined(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    return {
      headings: {
        en: `🏆 Challenge "${data.feature}" Started!`,
        id: `🏆 Challenge "${data.feature}" Dimulai!`
      },
      contents: {
        en: `Welcome aboard! ${data.details || 'Track your progress and achieve your goals.'}`,
        id: `Selamat bergabung! ${data.details || 'Track progress dan raih target Anda.'}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/challenges',
      big_picture: 'https://eksporyuk.com/assets/push/challenge-join-banner.png',
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'view_progress',
          text: data.buttonText || 'Lihat Progress',
          url: data.buttonUrl || 'https://eksporyuk.com/affiliate/challenges',
          icon: 'https://eksporyuk.com/assets/icons/progress.png'
        },
        {
          id: 'view_leaderboard',
          text: 'Leaderboard',
          url: 'https://eksporyuk.com/affiliate/leaderboard',
          icon: 'https://eksporyuk.com/assets/icons/trophy.png'
        }
      ],
      android_accent_color: '#F59E0B', // Golden for achievements
      android_led_color: '#F59E0B',
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      data: {
        category: 'challenge',
        challengeName: data.feature,
        action: 'joined',
        timestamp: new Date().toISOString()
      },
      ttl: 172800, // 48 hours
      priority: 8
    }
  }

  /**
   * Challenge Milestone Achievement
   */
  static challengeMilestone(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    return {
      headings: {
        en: `🌟 Milestone Achieved!`,
        id: `🌟 Milestone Tercapai!`
      },
      contents: {
        en: `${data.feature} - ${data.details || 'Keep the momentum going to the next target!'}`,
        id: `${data.feature} - ${data.details || 'Terus semangat menuju target berikutnya!'}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/challenges',
      big_picture: 'https://eksporyuk.com/assets/push/milestone-achievement-banner.png',
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'view_achievement',
          text: data.buttonText || 'Lihat Achievement',
          url: data.buttonUrl || 'https://eksporyuk.com/affiliate/achievements',
          icon: 'https://eksporyuk.com/assets/icons/medal.png'
        },
        {
          id: 'share_achievement',
          text: 'Share Achievement',
          url: 'https://eksporyuk.com/share/achievement',
          icon: 'https://eksporyuk.com/assets/icons/share.png'
        }
      ],
      android_accent_color: '#10B981', // Green for success
      android_led_color: '#10B981',
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      data: {
        category: 'achievement',
        challengeName: data.feature,
        milestone: data.action,
        timestamp: new Date().toISOString()
      },
      ttl: 259200, // 72 hours
      priority: 9
    }
  }

  /**
   * Automation Created Notification
   */
  static automationCreated(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    return {
      headings: {
        en: `🤖 Automation "${data.feature}" Created!`,
        id: `🤖 Automation "${data.feature}" Dibuat!`
      },
      contents: {
        en: `${data.details || 'Add email steps to activate your automation.'}`,
        id: `${data.details || 'Tambahkan email steps untuk mengaktifkan automation Anda.'}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/automation',
      big_picture: 'https://eksporyuk.com/assets/push/automation-created-banner.png',
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'setup_automation',
          text: data.buttonText || 'Setup Automation',
          url: data.buttonUrl || 'https://eksporyuk.com/affiliate/automation',
          icon: 'https://eksporyuk.com/assets/icons/settings.png'
        },
        {
          id: 'view_templates',
          text: 'Email Templates',
          url: 'https://eksporyuk.com/affiliate/templates',
          icon: 'https://eksporyuk.com/assets/icons/templates.png'
        }
      ],
      android_accent_color: '#8B5CF6', // Purple for automation
      android_led_color: '#8B5CF6',
      data: {
        category: 'automation',
        automationName: data.feature,
        action: 'created',
        timestamp: new Date().toISOString()
      },
      ttl: 86400,
      priority: 6
    }
  }

  /**
   * Automation Status Changed
   */
  static automationStatusChanged(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    const isActive = data.action === 'activated'
    
    return {
      headings: {
        en: `${isActive ? '✅' : '⏸️'} Automation ${data.action}`,
        id: `${isActive ? '✅' : '⏸️'} Automation ${data.action}`
      },
      contents: {
        en: `"${data.feature}" ${isActive ? 'is now running automatically' : 'has been paused'}. ${data.details || ''}`,
        id: `"${data.feature}" ${isActive ? 'sekarang berjalan otomatis' : 'telah dijeda'}. ${data.details || ''}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/automation',
      big_picture: `https://eksporyuk.com/assets/push/automation-${isActive ? 'active' : 'paused'}-banner.png`,
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'manage_automation',
          text: data.buttonText || 'Kelola Automation',
          url: data.buttonUrl || 'https://eksporyuk.com/affiliate/automation',
          icon: 'https://eksporyuk.com/assets/icons/manage.png'
        },
        {
          id: 'view_performance',
          text: 'Lihat Performa',
          url: 'https://eksporyuk.com/affiliate/automation/stats',
          icon: 'https://eksporyuk.com/assets/icons/analytics.png'
        }
      ],
      android_accent_color: isActive ? '#10B981' : '#F59E0B',
      android_led_color: isActive ? '#10B981' : '#F59E0B',
      data: {
        category: 'automation_status',
        automationName: data.feature,
        action: data.action,
        isActive,
        timestamp: new Date().toISOString()
      },
      ttl: 86400,
      priority: isActive ? 7 : 5
    }
  }

  /**
   * Lead Captured Notification
   */
  static leadCaptured(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    return {
      headings: {
        en: `📝 New Lead Captured!`,
        id: `📝 Lead Baru Tertangkap!`
      },
      contents: {
        en: `${data.feature} - ${data.details || 'Lead entered your automation sequence.'}`,
        id: `${data.feature} - ${data.details || 'Lead masuk ke automation sequence Anda.'}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/leads',
      big_picture: 'https://eksporyuk.com/assets/push/lead-captured-banner.png',
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'view_leads',
          text: data.buttonText || 'Lihat Leads',
          url: data.buttonUrl || 'https://eksporyuk.com/affiliate/leads',
          icon: 'https://eksporyuk.com/assets/icons/users.png'
        },
        {
          id: 'view_automation',
          text: 'Kelola Automation',
          url: 'https://eksporyuk.com/affiliate/automation',
          icon: 'https://eksporyuk.com/assets/icons/automation.png'
        }
      ],
      android_accent_color: '#06B6D4', // Cyan for leads
      android_led_color: '#06B6D4',
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      data: {
        category: 'lead_capture',
        formName: data.feature,
        action: 'captured',
        timestamp: new Date().toISOString()
      },
      ttl: 43200, // 12 hours
      priority: 8
    }
  }

  /**
   * Commission Earned Notification
   */
  static commissionEarned(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    return {
      headings: {
        en: `💰 Commission Earned!`,
        id: `💰 Komisi Diterima!`
      },
      contents: {
        en: `${data.feature} - ${data.details || 'Commission has been added to your wallet.'}`,
        id: `${data.feature} - ${data.details || 'Komisi telah masuk ke wallet Anda.'}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/wallet',
      big_picture: 'https://eksporyuk.com/assets/push/commission-earned-banner.png',
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'view_wallet',
          text: data.buttonText || 'Lihat Wallet',
          url: data.buttonUrl || 'https://eksporyuk.com/affiliate/wallet',
          icon: 'https://eksporyuk.com/assets/icons/wallet.png'
        },
        {
          id: 'withdraw',
          text: 'Withdraw',
          url: 'https://eksporyuk.com/affiliate/withdraw',
          icon: 'https://eksporyuk.com/assets/icons/withdraw.png'
        }
      ],
      android_accent_color: '#F59E0B', // Gold for money
      android_led_color: '#F59E0B',
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      data: {
        category: 'commission',
        source: data.feature,
        action: 'earned',
        timestamp: new Date().toISOString()
      },
      ttl: 259200, // 72 hours
      priority: 9
    }
  }

  /**
   * System Update Notification
   */
  static systemUpdate(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    return {
      headings: {
        en: `🔔 System Update`,
        id: `🔔 Update Sistem`
      },
      contents: {
        en: `${data.feature} - ${data.details || 'New features available for affiliates.'}`,
        id: `${data.feature} - ${data.details || 'Fitur baru tersedia untuk affiliate.'}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/dashboard',
      big_picture: 'https://eksporyuk.com/assets/push/system-update-banner.png',
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'view_update',
          text: data.buttonText || 'Lihat Update',
          url: data.buttonUrl || data.link || 'https://eksporyuk.com/affiliate/dashboard',
          icon: 'https://eksporyuk.com/assets/icons/update.png'
        },
        {
          id: 'changelog',
          text: 'Changelog',
          url: 'https://eksporyuk.com/changelog',
          icon: 'https://eksporyuk.com/assets/icons/changelog.png'
        }
      ],
      android_accent_color: this.BRAND_CONFIG.accentColor,
      android_led_color: this.BRAND_CONFIG.ledColor,
      data: {
        category: 'system_update',
        updateType: data.feature,
        action: 'announced',
        timestamp: new Date().toISOString()
      },
      ttl: 604800, // 7 days
      priority: 4
    }
  }

  /**
   * Training Available Notification
   */
  static trainingAvailable(data: AffiliateOneSignalTemplateData): OneSignalNotificationData {
    return {
      headings: {
        en: `🎓 New Training Available!`,
        id: `🎓 Training Baru Tersedia!`
      },
      contents: {
        en: `${data.feature} - ${data.details || 'Enhance your affiliate skills now.'}`,
        id: `${data.feature} - ${data.details || 'Tingkatkan skill affiliate Anda sekarang.'}`
      },
      url: data.link || 'https://eksporyuk.com/affiliate/training',
      big_picture: 'https://eksporyuk.com/assets/push/training-available-banner.png',
      large_icon: this.BRAND_CONFIG.largeIcon,
      small_icon: this.BRAND_CONFIG.smallIcon,
      chrome_web_icon: this.BRAND_CONFIG.webIcon,
      chrome_web_badge: this.BRAND_CONFIG.webBadge,
      web_buttons: [
        {
          id: 'start_training',
          text: data.buttonText || 'Mulai Training',
          url: data.buttonUrl || 'https://eksporyuk.com/affiliate/training',
          icon: 'https://eksporyuk.com/assets/icons/play.png'
        },
        {
          id: 'view_certificate',
          text: 'Lihat Sertifikat',
          url: 'https://eksporyuk.com/affiliate/certificates',
          icon: 'https://eksporyuk.com/assets/icons/certificate.png'
        }
      ],
      android_accent_color: '#7C3AED', // Purple for education
      android_led_color: '#7C3AED',
      data: {
        category: 'training',
        trainingName: data.feature,
        action: 'available',
        timestamp: new Date().toISOString()
      },
      ttl: 432000, // 5 days
      priority: 5
    }
  }
}

export default OneSignalNotificationTemplates