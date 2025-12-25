import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const banner = await prisma.banner.findUnique({
      where: { id: params.id },
    })

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error fetching banner:', error)
    return NextResponse.json({ error: 'Failed to fetch banner' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    const banner = await prisma.banner.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
        ...(data.linkText !== undefined && { linkText: data.linkText }),
        ...(data.placement !== undefined && { placement: data.placement }),
        ...(data.displayType !== undefined && { displayType: data.displayType }),
        ...(data.backgroundColor !== undefined && { backgroundColor: data.backgroundColor }),
        ...(data.textColor !== undefined && { textColor: data.textColor }),
        ...(data.buttonColor !== undefined && { buttonColor: data.buttonColor }),
        ...(data.buttonTextColor !== undefined && { buttonTextColor: data.buttonTextColor }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.viewLimit !== undefined && { viewLimit: data.viewLimit }),
        ...(data.clickLimit !== undefined && { clickLimit: data.clickLimit }),
        ...(data.dailyBudget !== undefined && { dailyBudget: data.dailyBudget }),
        ...(data.isSponsored !== undefined && { isSponsored: data.isSponsored }),
        ...(data.sponsorName !== undefined && { sponsorName: data.sponsorName }),
        ...(data.sponsorLogo !== undefined && { sponsorLogo: data.sponsorLogo }),
        ...(data.targetRoles !== undefined && { targetRoles: data.targetRoles }),
        ...(data.targetMemberships !== undefined && { targetMemberships: data.targetMemberships }),
        ...(data.targetProvinces !== undefined && { targetProvinces: data.targetProvinces }),
      },
    })

    return NextResponse.json(banner)
  } catch (error) {
    console.error('Error updating banner:', error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.banner.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
