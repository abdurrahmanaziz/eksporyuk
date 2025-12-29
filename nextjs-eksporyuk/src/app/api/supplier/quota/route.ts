/**
 * GET /api/supplier/quota
 * Get current supplier's feature usage and limits
 * Returns quotas, current usage, and upgrade prompts
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get supplier profile
    const profile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil supplier tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get membership with package
    const membership = await prisma.supplierMembership.findUnique({
      where: { userId: session.user.id },
      include: {
        package: true,
      },
    })

    if (!membership || !membership.isActive) {
      return NextResponse.json(
        { error: 'Tidak ada membership supplier aktif' },
        { status: 403 }
      )
    }

    const features = membership.package.features as any

    // Get current product count
    const productCount = await prisma.supplierProduct.count({
      where: {
        supplierId: profile.id,
        status: { in: ['DRAFT', 'ACTIVE'] },
      },
    })

    // Get chat count this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const chatCountThisMonth = await prisma.chatRoom.count({
      where: {
        type: 'DIRECT',
        createdAt: { gte: startOfMonth },
        participants: {
          some: { userId: session.user.id }
        }
      }
    })

    // Build quota response
    const quotas = {
      products: {
        used: productCount,
        max: features.maxProducts ?? 1,
        unlimited: features.maxProducts === -1,
        remaining: features.maxProducts === -1 ? 'unlimited' : Math.max(0, (features.maxProducts ?? 1) - productCount),
      },
      images: {
        max: features.maxImages ?? 3,
        perProduct: true,
      },
      documents: {
        max: features.maxDocuments ?? 1,
        perProduct: true,
      },
      chat: {
        enabled: features.chatEnabled ?? false,
        usedThisMonth: chatCountThisMonth,
        maxPerMonth: features.maxChatsPerMonth ?? 0,
        unlimited: features.maxChatsPerMonth === -1,
        remaining: features.maxChatsPerMonth === -1 ? 'unlimited' : Math.max(0, (features.maxChatsPerMonth ?? 0) - chatCountThisMonth),
      },
    }

    // Build features status
    const featureStatus = {
      verifiedBadge: features.verifiedBadge ?? false,
      customURL: features.customURL ?? false,
      customLogo: features.customLogo ?? false,
      statistics: features.statistics ?? false,
      ranking: features.ranking ?? false,
      priority: features.priority ?? false,
      catalogDownload: features.catalogDownload ?? false,
      multiLanguage: features.multiLanguage ?? false,
      featuredListing: features.featuredListing ?? false,
      supportPriority: features.supportPriority ?? 'normal',
    }

    // Generate upgrade prompts
    const needsUpgrade = []
    
    if (!quotas.products.unlimited && quotas.products.remaining === 0) {
      needsUpgrade.push({
        feature: 'products',
        message: 'Kuota produk habis. Upgrade untuk menambah produk.',
      })
    }
    
    if (!quotas.chat.enabled) {
      needsUpgrade.push({
        feature: 'chat',
        message: 'Aktifkan fitur chat dengan upgrade ke paket Premium.',
      })
    } else if (!quotas.chat.unlimited && quotas.chat.remaining === 0) {
      needsUpgrade.push({
        feature: 'chat',
        message: 'Kuota chat bulan ini habis. Upgrade untuk chat unlimited.',
      })
    }

    if (!featureStatus.verifiedBadge) {
      needsUpgrade.push({
        feature: 'verifiedBadge',
        message: 'Dapatkan verified badge dengan upgrade ke Premium.',
      })
    }

    if (!featureStatus.statistics) {
      needsUpgrade.push({
        feature: 'statistics',
        message: 'Akses statistik & analytics dengan upgrade.',
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        packageName: membership.package.name,
        packageType: membership.package.type,
        quotas,
        features: featureStatus,
        upgradePrompts: needsUpgrade,
        endDate: membership.endDate,
      },
    })
  } catch (error) {
    console.error('[SUPPLIER_QUOTA_GET]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
