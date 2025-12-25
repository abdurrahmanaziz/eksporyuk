import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/stats/traffic-source - Get traffic source statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all clicks from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const clicks = await prisma.affiliateClick.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        referrer: true
      }
    })

    // Categorize referrers into social media sources
    const sources: Record<string, number> = {
      whatsapp: 0,
      tiktok: 0,
      facebook: 0,
      instagram: 0,
      twitter: 0,
      youtube: 0,
      telegram: 0,
      other: 0,
      direct: 0
    }

    clicks.forEach(click => {
      const referrer = (click.referrer || '').toLowerCase()
      
      if (!referrer || referrer === 'null' || referrer === '') {
        sources.direct++
      } else if (referrer.includes('whatsapp') || referrer.includes('wa.me') || referrer.includes('api.whatsapp')) {
        sources.whatsapp++
      } else if (referrer.includes('tiktok') || referrer.includes('tiktok.com')) {
        sources.tiktok++
      } else if (referrer.includes('facebook') || referrer.includes('fb.com') || referrer.includes('fb.me') || referrer.includes('m.facebook')) {
        sources.facebook++
      } else if (referrer.includes('instagram') || referrer.includes('ig.me') || referrer.includes('l.instagram')) {
        sources.instagram++
      } else if (referrer.includes('twitter') || referrer.includes('t.co') || referrer.includes('x.com')) {
        sources.twitter++
      } else if (referrer.includes('youtube') || referrer.includes('youtu.be') || referrer.includes('yt.be')) {
        sources.youtube++
      } else if (referrer.includes('telegram') || referrer.includes('t.me')) {
        sources.telegram++
      } else {
        sources.other++
      }
    })

    // Calculate total and percentages
    const total = Object.values(sources).reduce((a, b) => a + b, 0)
    
    const trafficSources = [
      { name: 'WhatsApp', key: 'whatsapp', count: sources.whatsapp, color: '#25D366', icon: 'whatsapp' },
      { name: 'TikTok', key: 'tiktok', count: sources.tiktok, color: '#000000', icon: 'tiktok' },
      { name: 'Facebook', key: 'facebook', count: sources.facebook, color: '#1877F2', icon: 'facebook' },
      { name: 'Instagram', key: 'instagram', count: sources.instagram, color: '#E4405F', icon: 'instagram' },
      { name: 'YouTube', key: 'youtube', count: sources.youtube, color: '#FF0000', icon: 'youtube' },
      { name: 'Twitter/X', key: 'twitter', count: sources.twitter, color: '#1DA1F2', icon: 'twitter' },
      { name: 'Telegram', key: 'telegram', count: sources.telegram, color: '#0088CC', icon: 'telegram' },
      { name: 'Direct', key: 'direct', count: sources.direct, color: '#6B7280', icon: 'direct' },
      { name: 'Lainnya', key: 'other', count: sources.other, color: '#9CA3AF', icon: 'other' },
    ]
      .map(source => ({
        ...source,
        percentage: total > 0 ? Math.round((source.count / total) * 100) : 0
      }))
      .filter(source => source.count > 0) // Only show sources with clicks
      .sort((a, b) => b.count - a.count) // Sort by count descending

    return NextResponse.json({
      sources: trafficSources,
      total
    })

  } catch (error) {
    console.error('Error fetching traffic sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch traffic sources' },
      { status: 500 }
    )
  }
}
