import { prisma } from '@/lib/prisma'
import { mailketingService } from '@/lib/services/mailketingService'

/**
 * Challenge Email Helper
 * Sends templated emails for challenge lifecycle events
 */

interface ChallengeEmailData {
  email: string
  name: string
  challengeName: string
  challengeDescription?: string
  targetValue?: number
  targetType?: string
  rewardValue?: number
  rewardType?: string
  currentValue?: number
  progressPercentage?: number
  daysRemaining?: number
  startDate?: string
  endDate?: string
  ranking?: number
  finalValue?: number
  completedDate?: string
  daysTaken?: number
  finalRanking?: number
  claimDate?: string
  claimStatus?: string
  approvalDate?: string
  rejectionReason?: string
  [key: string]: any
}

async function sendChallengeEmail(
  templateSlug: string,
  data: ChallengeEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch the template
    const template = await prisma.brandedTemplate.findFirst({
      where: { slug: templateSlug }
    })

    if (!template) {
      console.error(`Challenge email template not found: ${templateSlug}`)
      return { success: false, error: 'Template not found' }
    }

    // Replace variables in subject and content
    let subject = template.subject || ''
    let content = template.content || ''

    // Replace all variables in the format {variable_name}
    const allData = {
      site_name: process.env.NEXT_PUBLIC_SITE_NAME || 'Eksporyuk',
      affiliate_name: data.name,
      challenge_name: data.challengeName,
      challenge_description: data.challengeDescription || '',
      target_value: data.targetValue?.toString() || '',
      target_type: data.targetType || '',
      reward_value: data.rewardValue?.toString() || '',
      reward_type: data.rewardType || '',
      current_value: data.currentValue?.toString() || '',
      progress_percentage: data.progressPercentage?.toString() || '',
      days_remaining: data.daysRemaining?.toString() || '',
      start_date: data.startDate || '',
      end_date: data.endDate || '',
      ranking: data.ranking?.toString() || '',
      final_value: data.finalValue?.toString() || '',
      completed_date: data.completedDate || '',
      days_taken: data.daysTaken?.toString() || '',
      final_ranking: data.finalRanking?.toString() || '',
      claim_date: data.claimDate || '',
      claim_status: data.claimStatus || '',
      approval_date: data.approvalDate || '',
      rejection_reason: data.rejectionReason || '',
      support_email: process.env.SUPPORT_EMAIL || 'support@eksporyuk.com',
      support_phone: process.env.SUPPORT_PHONE || '+62',
      ...data
    }

    // Replace all {variable} patterns
    for (const [key, value] of Object.entries(allData)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi')
      subject = subject.replace(regex, String(value))
      content = content.replace(regex, String(value))
    }

    // Also replace {{variable}} patterns (double braces) for compatibility
    for (const [key, value] of Object.entries(allData)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi')
      subject = subject.replace(regex, String(value))
      content = content.replace(regex, String(value))
    }

    // Send the email
    if (!mailketingService.isConfigured()) {
      console.warn('Mailketing service not configured, skipping email send')
      return { success: true } // Don't fail, just skip
    }

    const result = await mailketingService.sendEmail({
      to: data.email,
      subject,
      html: content
    })

    return result
  } catch (error: any) {
    console.error(`Error sending challenge email (${templateSlug}):`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send challenge announcement to new challenge creation
 */
export async function sendChallengeAnnouncementEmail(
  emails: string[],
  challengeData: ChallengeEmailData[]
) {
  const promises = challengeData.map(data =>
    sendChallengeEmail('challenge-announcement', data)
  )
  return Promise.all(promises)
}

/**
 * Send challenge joined confirmation
 */
export async function sendChallengeJoinedEmail(data: ChallengeEmailData) {
  return sendChallengeEmail('challenge-joined', data)
}

/**
 * Send progress update email
 */
export async function sendChallengeProgressUpdateEmail(data: ChallengeEmailData) {
  return sendChallengeEmail('challenge-progress-update', data)
}

/**
 * Send challenge completed email
 */
export async function sendChallengeCompletedEmail(data: ChallengeEmailData) {
  return sendChallengeEmail('challenge-completed', data)
}

/**
 * Send reward claimed email
 */
export async function sendChallengeRewardClaimedEmail(data: ChallengeEmailData) {
  return sendChallengeEmail('challenge-reward-claimed', data)
}

/**
 * Send reward approved email
 */
export async function sendChallengeRewardApprovedEmail(data: ChallengeEmailData) {
  return sendChallengeEmail('challenge-reward-approved', data)
}

/**
 * Send reward rejected email
 */
export async function sendChallengeRewardRejectedEmail(data: ChallengeEmailData) {
  return sendChallengeEmail('challenge-reward-rejected', data)
}

/**
 * Send challenge failed/expired email
 */
export async function sendChallengeFailedEmail(data: ChallengeEmailData) {
  return sendChallengeEmail('challenge-failed-expired', data)
}

export { sendChallengeEmail }
