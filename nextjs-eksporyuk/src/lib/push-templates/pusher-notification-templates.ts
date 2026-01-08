/**
 * PUSHER PUSH NOTIFICATION TEMPLATES
 * Branded templates untuk real-time notifications via Pusher
 */

interface PusherNotificationData {
  userId: string
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR' | 'ACHIEVEMENT' | 'REMINDER'
  title: string
  message: string
  icon?: string
  image?: string
  link?: string
  action?: {
    label: string
    url: string
  }
  metadata?: any
}

interface AffiliatePusherTemplateData {
  userName: string
  feature: string
  action: string
  details?: string
  link?: string
  tips?: string[]
  nextSteps?: string[]
}

export class PusherNotificationTemplates {
  
  /**
   * Bio Page Notification Template
   */
  static bioPagUpdated(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'SUCCESS',
      title: `🎉 Bio Page ${data.action}!`,
      message: `${data.feature} siap untuk dishare. ${data.details || 'Mulai tingkatkan engagement sekarang!'}`,
      icon: '📄',
      image: 'https://eksporyuk.com/assets/bio-page-success.png',
      link: data.link || '/affiliate/bio',
      action: {
        label: 'Kelola Bio Page',
        url: '/affiliate/bio'
      },
      metadata: {
        category: 'bio_page',
        feature: data.feature,
        action: data.action,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Challenge Notification Template
   */
  static challengeJoined(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'ACHIEVEMENT',
      title: `🏆 Challenge "${data.feature}" Dimulai!`,
      message: `Selamat bergabung! ${data.details || 'Track progress dan raih target Anda.'}`,
      icon: '🎯',
      image: 'https://eksporyuk.com/assets/challenge-start.png',
      link: data.link || '/affiliate/challenges',
      action: {
        label: 'Lihat Progress',
        url: '/affiliate/challenges'
      },
      metadata: {
        category: 'challenge',
        challengeName: data.feature,
        action: 'joined',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Challenge Milestone Template
   */
  static challengeMilestone(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'ACHIEVEMENT',
      title: `🌟 Milestone Tercapai!`,
      message: `${data.feature} - ${data.details || 'Terus semangat menuju target berikutnya!'}`,
      icon: '⭐',
      image: 'https://eksporyuk.com/assets/milestone-achievement.png',
      link: data.link || '/affiliate/challenges',
      action: {
        label: 'Lihat Achievement',
        url: '/affiliate/challenges'
      },
      metadata: {
        category: 'challenge_milestone',
        challengeName: data.feature,
        milestone: data.action,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Automation Notification Template
   */
  static automationCreated(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'INFO',
      title: `🤖 Automation "${data.feature}" Dibuat!`,
      message: `${data.details || 'Tambahkan email steps untuk mengaktifkan automation Anda.'}`,
      icon: '⚡',
      image: 'https://eksporyuk.com/assets/automation-created.png',
      link: data.link || '/affiliate/automation',
      action: {
        label: 'Setup Automation',
        url: '/affiliate/automation'
      },
      metadata: {
        category: 'automation',
        automationName: data.feature,
        action: 'created',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Automation Status Change Template
   */
  static automationStatusChanged(data: AffiliatePusherTemplateData): PusherNotificationData {
    const isActive = data.action === 'activated'
    
    return {
      userId: '',
      type: isActive ? 'SUCCESS' : 'WARNING',
      title: `${isActive ? '✅' : '⏸️'} Automation ${data.action}`,
      message: `"${data.feature}" ${isActive ? 'siap bekerja otomatis' : 'dihentikan sementara'}. ${data.details || ''}`,
      icon: isActive ? '🚀' : '⏸️',
      image: `https://eksporyuk.com/assets/automation-${isActive ? 'active' : 'paused'}.png`,
      link: data.link || '/affiliate/automation',
      action: {
        label: 'Kelola Automation',
        url: '/affiliate/automation'
      },
      metadata: {
        category: 'automation_status',
        automationName: data.feature,
        action: data.action,
        isActive,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Lead Captured Template
   */
  static leadCaptured(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'SUCCESS',
      title: `📝 Lead Baru Tertangkap!`,
      message: `${data.feature} - ${data.details || 'Lead masuk ke automation sequence Anda.'}`,
      icon: '🎣',
      image: 'https://eksporyuk.com/assets/lead-captured.png',
      link: data.link || '/affiliate/leads',
      action: {
        label: 'Lihat Leads',
        url: '/affiliate/leads'
      },
      metadata: {
        category: 'lead_capture',
        formName: data.feature,
        action: 'captured',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Commission Earned Template
   */
  static commissionEarned(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'SUCCESS',
      title: `💰 Komisi Diterima!`,
      message: `${data.feature} - ${data.details || 'Komisi telah masuk ke wallet Anda.'}`,
      icon: '💰',
      image: 'https://eksporyuk.com/assets/commission-earned.png',
      link: data.link || '/affiliate/wallet',
      action: {
        label: 'Lihat Wallet',
        url: '/affiliate/wallet'
      },
      metadata: {
        category: 'commission',
        source: data.feature,
        action: 'earned',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * System Update Template
   */
  static systemUpdate(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'INFO',
      title: `🔔 Update Sistem`,
      message: `${data.feature} - ${data.details || 'Fitur baru tersedia untuk affiliate.'}`,
      icon: '🆕',
      image: 'https://eksporyuk.com/assets/system-update.png',
      link: data.link || '/affiliate/dashboard',
      action: {
        label: 'Lihat Update',
        url: data.link || '/affiliate/dashboard'
      },
      metadata: {
        category: 'system_update',
        updateType: data.feature,
        action: 'announced',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Training Available Template
   */
  static trainingAvailable(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'INFO',
      title: `🎓 Training Baru Tersedia!`,
      message: `${data.feature} - ${data.details || 'Tingkatkan skill affiliate Anda sekarang.'}`,
      icon: '📚',
      image: 'https://eksporyuk.com/assets/training-available.png',
      link: data.link || '/affiliate/training',
      action: {
        label: 'Mulai Training',
        url: '/affiliate/training'
      },
      metadata: {
        category: 'training',
        trainingName: data.feature,
        action: 'available',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Performance Alert Template
   */
  static performanceAlert(data: AffiliatePusherTemplateData): PusherNotificationData {
    return {
      userId: '',
      type: 'WARNING',
      title: `📊 Performance Alert`,
      message: `${data.feature} - ${data.details || 'Review dan optimasi diperlukan.'}`,
      icon: '📈',
      image: 'https://eksporyuk.com/assets/performance-alert.png',
      link: data.link || '/affiliate/analytics',
      action: {
        label: 'Lihat Analytics',
        url: '/affiliate/analytics'
      },
      metadata: {
        category: 'performance',
        metric: data.feature,
        action: 'alert',
        timestamp: new Date().toISOString()
      }
    }
  }
}

export default PusherNotificationTemplates