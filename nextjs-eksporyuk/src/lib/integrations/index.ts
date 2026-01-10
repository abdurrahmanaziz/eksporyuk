/**
 * Integrations Hub - All External Services
 * 
 * This module exports all integration services:
 * - Mailketing (Email)
 * - Starsender (WhatsApp)
 * - OneSignal (Push Notifications)
 * - Pusher (Real-time Updates)
 */

// Email Service
export {
  mailketing,
  MailketingService,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPaymentConfirmation,
} from './mailketing'

// WhatsApp Service
export {
  starsender,
  StarsenderService,
  sendVerificationWhatsApp,
  sendWelcomeWhatsApp,
  sendPaymentReminderWhatsApp,
  sendFollowUpWhatsApp,
} from './starsender'

// Push Notification Service
export {
  onesignal,
  OneSignalService,
  sendWelcomeNotification,
  sendPaymentSuccessNotification,
  sendNewCourseNotification,
  sendExpiryReminderNotification,
  sendBulkAnnouncementNotification,
} from './onesignal'

// Real-time Service
export {
  pusher,
  PusherService,
  createPusherClient,
  triggerNewMessage,
  triggerUserOnline,
  triggerNotification,
  triggerNewPost,
  triggerMembershipActivated,
  triggerPaymentUpdate,
  broadcastAnnouncement,
  triggerCourseProgress,
} from './pusher'

/**
 * Unified notification sender
 * Sends via Email, WhatsApp, and Push simultaneously
 */
export async function sendUnifiedNotification(params: {
  userId: string
  email?: string
  phone?: string
  name: string
  notification: {
    subject: string
    message: string
    type: 'welcome' | 'payment' | 'course' | 'reminder' | 'announcement'
    data?: any
  }
}) {
  const results = {
    email: null as any,
    whatsapp: null as any,
    push: null as any,
  }

  // Send Email
  if (params.email) {
    const { mailketing } = await import('./mailketing')
    results.email = await mailketing.sendEmail({
      to: params.email,
      subject: params.notification.subject,
      html: params.notification.message,
      tags: [params.notification.type],
    })
  }

  // Send WhatsApp
  if (params.phone) {
    const { starsender } = await import('./starsender')
    results.whatsapp = await starsender.sendMessage({
      phone: params.phone,
      message: params.notification.message,
    })
  }

  // Send Push Notification
  const { onesignal } = await import('./onesignal')
  results.push = await onesignal.sendToUsers(
    [params.userId],
    params.notification.subject,
    params.notification.message,
    { data: params.notification.data }
  )

  return results
}

/**
 * Send notification to admin team
 */
export async function notifyAdminTeam(params: {
  subject: string
  message: string
  priority?: 'low' | 'medium' | 'high'
  data?: any
}) {
  const { onesignal } = await import('./onesignal')
  
  return onesignal.sendToSegment(
    'admins',
    params.subject,
    params.message,
    {
      data: {
        ...params.data,
        priority: params.priority || 'medium',
      },
      android_accent_color: params.priority === 'high' ? 'FF0000' : '4285F4',
    }
  )
}
