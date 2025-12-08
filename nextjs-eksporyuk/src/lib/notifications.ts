/**
 * Notification Helper
 * Central service untuk kirim email dan WhatsApp notifications
 * Uses Mailketing API for all email sending
 */

import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'

interface NotificationVariables {
  [key: string]: string
}

interface SendEmailParams {
  templateName: string  // Nama template (e.g., 'welcome_email')
  to: string            // Email tujuan
  variables: NotificationVariables
}

interface SendWhatsAppParams {
  templateName: string  // Nama template (e.g., 'wa_welcome')
  to: string            // Nomor WA (628xxx)
  variables: NotificationVariables
}

interface SendNotificationParams {
  emailTemplate?: string
  whatsappTemplate?: string
  to: string            // Email
  toPhone?: string      // WhatsApp number
  variables: NotificationVariables
}

/**
 * Replace variables in template text
 */
function replaceVariables(text: string, variables: NotificationVariables): string {
  let result = text
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(regex, value)
  })
  
  return result
}

/**
 * Send Email via Mailketing API
 */
export async function sendEmail({ 
  templateName, 
  to, 
  variables 
}: SendEmailParams): Promise<boolean> {
  try {
    // Get template from database
    const template = await prisma.emailTemplate.findFirst({
      where: { 
        name: templateName,
        isActive: true
      }
    })
    
    if (!template) {
      console.error(`❌ Email template '${templateName}' not found or inactive`)
      return false
    }

    // Replace variables in subject and body
    const subject = replaceVariables(template.subject, variables)
    const body = replaceVariables(template.body, variables)

    // Send via Mailketing service (uses correct API format)
    const result = await mailketing.sendEmail({
      to,
      subject,
      html: body,
      tags: ['notification', templateName]
    })

    if (!result.success) {
      console.error(`❌ Mailketing API error: ${result.error}`)
      return false
    }

    console.log(`✅ Email sent successfully: ${templateName} to ${to}`)

    // Log notification
    await prisma.notificationLog.create({
      data: {
        type: templateName,
        channel: 'EMAIL',
        templateId: template.id,
        recipient: to,
        status: 'SENT',
        sentAt: new Date(),
      },
    }).catch(err => console.error('Failed to log notification:', err))

    return true
  } catch (error) {
    console.error(`❌ Failed to send email '${templateName}' to ${to}:`, error)
    
    // Log failed notification
    await prisma.notificationLog.create({
      data: {
        type: templateName,
        channel: 'EMAIL',
        templateId: templateName,
        recipient: to,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
        sentAt: new Date(),
      },
    }).catch(err => console.error('Failed to log notification:', err))

    return false
  }
}

/**
 * Send WhatsApp via StarSender API
 */
export async function sendWhatsApp({ 
  templateName, 
  to, 
  variables 
}: SendWhatsAppParams): Promise<boolean> {
  try {
    // Normalize phone number (remove +, -, spaces)
    const normalizedPhone = to.replace(/[\s\-\+]/g, '')
    
    // Ensure starts with 62
    const phone = normalizedPhone.startsWith('62') 
      ? normalizedPhone 
      : `62${normalizedPhone.startsWith('0') ? normalizedPhone.substring(1) : normalizedPhone}`

    // Get template from database
    const template = await prisma.whatsAppTemplate.findFirst({
      where: { 
        name: templateName,
        isActive: true
      }
    })
    
    if (!template) {
      console.error(`❌ WhatsApp template '${templateName}' not found or inactive`)
      return false
    }

    // Replace variables in message
    const message = replaceVariables(template.message, variables)

    // Send via StarSender API
    const response = await fetch('https://api.starsender.online/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STARSENDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: process.env.STARSENDER_DEVICE_ID,
        number: phone,
        message,
        type: 'text',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`StarSender API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ WhatsApp sent successfully: ${templateName} to ${phone}`)
    console.log('Response:', result)

    // Log notification
    await prisma.notificationLog.create({
      data: {
        type: templateName,
        channel: 'WHATSAPP',
        templateId: template.id,
        recipient: phone,
        status: 'SENT',
        sentAt: new Date(),
      },
    }).catch(err => console.error('Failed to log notification:', err))

    return true
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp '${templateName}' to ${to}:`, error)
    
    // Log failed notification
    await prisma.notificationLog.create({
      data: {
        type: templateName,
        channel: 'WHATSAPP',
        templateId: templateName,
        recipient: to,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
        sentAt: new Date(),
      },
    }).catch(err => console.error('Failed to log notification:', err))

    return false
  }
}

/**
 * Send both Email and WhatsApp notification
 */
export async function sendNotification({
  emailTemplate,
  whatsappTemplate,
  to,
  toPhone,
  variables,
}: SendNotificationParams): Promise<{ email: boolean; whatsapp: boolean }> {
  const results = {
    email: false,
    whatsapp: false,
  }

  // Send email if template provided
  if (emailTemplate && to) {
    results.email = await sendEmail({ 
      templateName: emailTemplate, 
      to, 
      variables 
    })
  }

  // Send WhatsApp if template and phone provided
  if (whatsappTemplate && toPhone) {
    results.whatsapp = await sendWhatsApp({ 
      templateName: whatsappTemplate, 
      to: toPhone, 
      variables 
    })
  }

  return results
}

/**
 * Send notification to admin
 */
export async function sendAdminNotification({
  whatsappTemplate,
  variables,
}: {
  whatsappTemplate: string
  variables: NotificationVariables
}): Promise<boolean> {
  const adminPhone = process.env.ADMIN_PHONE || process.env.ADMIN_WHATSAPP
  
  if (!adminPhone) {
    console.warn('⚠️ ADMIN_PHONE not configured, skipping admin notification')
    return false
  }

  return await sendWhatsApp({
    templateName: whatsappTemplate,
    to: adminPhone,
    variables,
  })
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Calculate time left until expiry
 */
export function calculateTimeLeft(expiryDate: Date): string {
  const now = new Date()
  const diff = expiryDate.getTime() - now.getTime()
  
  if (diff < 0) return '0 jam'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days} hari ${hours % 24} jam`
  }
  
  return `${hours} jam`
}

// ============================================
// COURSE NOTIFICATION HELPERS
// ============================================

/**
 * Create in-app notification
 */
export async function createInAppNotification(data: {
  userId: string
  type: string
  title: string
  message: string
  link?: string
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false,
      },
    })
    console.log(`✅ In-app notification created for user ${data.userId}`)
  } catch (error) {
    console.error('❌ Failed to create in-app notification:', error)
  }
}

/**
 * Send course approval notification
 */
export async function notifyCourseApproved(
  courseId: string,
  mentorId: string
): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  })

  const mentor = await prisma.user.findUnique({
    where: { id: mentorId },
    select: { name: true, email: true, phoneNumber: true, emailNotifications: true, whatsappNotifications: true },
  })

  if (!course || !mentor) return

  // In-app notification
  await createInAppNotification({
    userId: mentorId,
    type: 'COURSE_APPROVED',
    title: 'Kursus Disetujui! 🎉',
    message: `Kursus "${course.title}" telah disetujui dan sekarang aktif.`,
    link: `/mentor/courses/${courseId}`,
  })

  const vars = {
    name: mentor.name || 'Mentor',
    course_title: course.title,
    link: `${process.env.NEXT_PUBLIC_APP_URL}/mentor/courses/${courseId}`,
  }

  // Email notification
  if (mentor.emailNotifications && mentor.email) {
    await sendEmail({
      templateName: 'course_approved',
      to: mentor.email,
      variables: vars,
    })
  }

  // WhatsApp notification
  if (mentor.whatsappNotifications && mentor.phoneNumber) {
    await sendWhatsApp({
      templateName: 'wa_course_approved',
      to: mentor.phoneNumber,
      variables: vars,
    })
  }
}

/**
 * Send course rejection notification
 */
export async function notifyCourseRejected(
  courseId: string,
  mentorId: string,
  reason?: string
): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  })

  const mentor = await prisma.user.findUnique({
    where: { id: mentorId },
    select: { name: true, email: true, phoneNumber: true, emailNotifications: true, whatsappNotifications: true },
  })

  if (!course || !mentor) return

  // In-app notification
  await createInAppNotification({
    userId: mentorId,
    type: 'COURSE_REJECTED',
    title: 'Kursus Ditolak',
    message: `Kursus "${course.title}" ditolak${reason ? `: ${reason}` : '.'}`,
    link: `/mentor/courses/${courseId}`,
  })

  const vars = {
    name: mentor.name || 'Mentor',
    course_title: course.title,
    reason: reason || 'Tidak memenuhi kriteria platform',
    link: `${process.env.NEXT_PUBLIC_APP_URL}/mentor/courses/${courseId}`,
  }

  if (mentor.emailNotifications && mentor.email) {
    await sendEmail({
      templateName: 'course_rejected',
      to: mentor.email,
      variables: vars,
    })
  }
}

/**
 * Send enrollment confirmation
 */
export async function notifyCourseEnrollment(
  courseId: string,
  userId: string
): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phoneNumber: true, emailNotifications: true, whatsappNotifications: true },
  })

  if (!course || !user) return

  // In-app notification
  await createInAppNotification({
    userId,
    type: 'COURSE_ENROLLMENT',
    title: 'Berhasil Mendaftar Kursus! 🎓',
    message: `Anda telah terdaftar di kursus "${course.title}". Mulai belajar sekarang!`,
    link: `/dashboard/courses/${courseId}`,
  })

  const vars = {
    name: user.name || 'Student',
    course_title: course.title,
    link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/courses/${courseId}`,
  }

  if (user.emailNotifications && user.email) {
    await sendEmail({
      templateName: 'course_enrollment',
      to: user.email,
      variables: vars,
    })
  }

  if (user.whatsappNotifications && user.phoneNumber) {
    await sendWhatsApp({
      templateName: 'wa_course_enrollment',
      to: user.phoneNumber,
      variables: vars,
    })
  }
}

/**
 * Send certificate earned notification
 */
export async function notifyCertificateEarned(
  certificateId: string,
  userId: string,
  courseName: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phoneNumber: true, emailNotifications: true, whatsappNotifications: true },
  })

  if (!user) return

  // In-app notification
  await createInAppNotification({
    userId,
    type: 'CERTIFICATE_EARNED',
    title: 'Sertifikat Tersedia! 🏆',
    message: `Selamat! Anda telah menyelesaikan kursus "${courseName}" dan sertifikat sudah tersedia untuk diunduh.`,
    link: `/dashboard/certificates`,
  })

  const vars = {
    name: user.name || 'Student',
    course_name: courseName,
    certificate_link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/certificates`,
  }

  if (user.emailNotifications && user.email) {
    await sendEmail({
      templateName: 'certificate_earned',
      to: user.email,
      variables: vars,
    })
  }

  if (user.whatsappNotifications && user.phoneNumber) {
    await sendWhatsApp({
      templateName: 'wa_certificate_earned',
      to: user.phoneNumber,
      variables: vars,
    })
  }
}

/**
 * Send study reminder
 */
export async function notifyStudyReminder(
  userId: string,
  courseName: string,
  courseId: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phoneNumber: true, emailNotifications: true, whatsappNotifications: true },
  })

  if (!user) return

  // In-app notification
  await createInAppNotification({
    userId,
    type: 'STUDY_REMINDER',
    title: 'Lanjutkan Belajar! 📚',
    message: `Hai ${user.name}, kamu belum melanjutkan kursus "${courseName}" minggu ini. Yuk lanjutkan belajarmu!`,
    link: `/dashboard/courses/${courseId}`,
  })

  const vars = {
    name: user.name || 'Student',
    course_name: courseName,
    link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/courses/${courseId}`,
  }

  if (user.emailNotifications && user.email) {
    await sendEmail({
      templateName: 'study_reminder',
      to: user.email,
      variables: vars,
    })
  }

  if (user.whatsappNotifications && user.phoneNumber) {
    await sendWhatsApp({
      templateName: 'wa_study_reminder',
      to: user.phoneNumber,
      variables: vars,
    })
  }
}
