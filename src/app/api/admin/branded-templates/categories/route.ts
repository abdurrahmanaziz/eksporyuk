import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'

// Template categories with descriptions
const TEMPLATE_CATEGORIES = {
  'SYSTEM': {
    label: 'System Templates',
    icon: '⚙️',
    description: 'Email verifikasi, reset password, 2FA, login notifications, account security',
    types: ['EMAIL', 'SMS', 'PUSH']
  },
  'MEMBERSHIP': {
    label: 'Membership Templates',
    icon: '👑',
    description: 'Aktivasi member, upgrade/downgrade, perpanjangan, kadaluarsa, welcome member',
    types: ['EMAIL', 'WHATSAPP', 'PUSH']
  },
  'AFFILIATE': {
    label: 'Affiliate Templates',
    icon: '🤝',
    description: 'Pendaftaran, approval, komisi masuk, withdrawal, leaderboard, referral',
    types: ['EMAIL', 'WHATSAPP', 'PUSH']
  },
  'COURSE': {
    label: 'Course Templates',
    icon: '🎓',
    description: 'Enrollment, progress, sertifikat, reminder belajar, kelas baru, homework',
    types: ['EMAIL', 'WHATSAPP', 'PUSH']
  },
  'PAYMENT': {
    label: 'Payment Templates',
    icon: '💳',
    description: 'Invoice, kwitansi, reminder pembayaran, payment success/failed, refund',
    types: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH']
  },
  'MARKETING': {
    label: 'Marketing Templates',
    icon: '📣',
    description: 'Promosi, newsletter, campaign, broadcast, flash sale, event invitation',
    types: ['EMAIL', 'WHATSAPP', 'PUSH']
  },
  'NOTIFICATION': {
    label: 'Notification Templates',
    icon: '🔔',
    description: 'Pengumuman sistem, update, maintenance, info penting',
    types: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH']
  },
  'TRANSACTION': {
    label: 'Transaction Templates',
    icon: '🧾',
    description: 'Order created, payment pending, completed, failed, expired, refund',
    types: ['EMAIL', 'WHATSAPP', 'PUSH']
  }
}

// Shortcodes yang tersedia untuk setiap kategori
const AVAILABLE_SHORTCODES: Record<string, string[]> = {
  'SYSTEM': [
    '{name}', '{email}', '{url}', '{code}', '{expiryTime}', '{loginDate}', 
    '{ipAddress}', '{device}', '{location}'
  ],
  'MEMBERSHIP': [
    '{name}', '{membershipType}', '{startDate}', '{endDate}', '{price}', '{benefits}',
    '{renewalUrl}', '{contactEmail}'
  ],
  'AFFILIATE': [
    '{name}', '{commissionAmount}', '{commissionRate}', '{totalEarnings}', 
    '{approvalUrl}', '{withdrawalUrl}', '{referralLink}', '{dashboardUrl}'
  ],
  'COURSE': [
    '{name}', '{courseName}', '{courseUrl}', '{instructorName}', '{completionDate}',
    '{certificateUrl}', '{progressPercent}', '{daysUntilDeadline}'
  ],
  'PAYMENT': [
    '{name}', '{invoiceNumber}', '{amount}', '{dueDate}', '{paymentUrl}', 
    '{itemDescription}', '{refundAmount}', '{bankDetails}'
  ],
  'MARKETING': [
    '{name}', '{promotionCode}', '{discountPercent}', '{offerUrl}', '{expiryDate}',
    '{productName}', '{eventDate}', '{eventLocation}'
  ],
  'NOTIFICATION': [
    '{name}', '{systemName}', '{maintenanceTime}', '{affectedFeatures}', 
    '{estimatedDuration}', '{announcementLink}'
  ],
  'TRANSACTION': [
    '{name}', '{orderId}', '{totalAmount}', '{itemCount}', '{statusChangeDate}',
    '{trackingUrl}', '{refundAmount}', '{supportEmail}'
  ]
}

/**
 * GET /api/admin/branded-templates/categories
 * Get all available categories and types
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = Object.entries(TEMPLATE_CATEGORIES).map(([key, value]) => ({
      id: key,
      ...value,
      shortcodes: AVAILABLE_SHORTCODES[key] || []
    }))

    const types = [
      { id: 'EMAIL', label: 'Email', icon: '📧' },
      { id: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
      { id: 'SMS', label: 'SMS', icon: '📱' },
      { id: 'PUSH', label: 'Push Notification', icon: '🔔' }
    ]

    const priorities = [
      { id: 'LOW', label: 'Low' },
      { id: 'NORMAL', label: 'Normal' },
      { id: 'HIGH', label: 'High' },
      { id: 'URGENT', label: 'Urgent' }
    ]

    const roles = [
      { id: 'ADMIN', label: 'Admin' },
      { id: 'FOUNDER', label: 'Founder' },
      { id: 'MENTOR', label: 'Mentor' },
      { id: 'AFFILIATE', label: 'Affiliate' },
      { id: 'MEMBER_PREMIUM', label: 'Premium Member' },
      { id: 'MEMBER_FREE', label: 'Free Member' },
      { id: 'ALL', label: 'All Roles' }
    ]

    return NextResponse.json({
      success: true,
      data: {
        categories,
        types,
        priorities,
        roles,
        shortcodeSyntax: '{variableName}',
        exampleUsage: 'Hello {name}, your commission is {commissionAmount}'
      }
    })

  } catch (error) {
    console.error('[Template Categories API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
