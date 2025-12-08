import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    username: string
  }>
}

/**
 * GET /api/public/bio/[username]
 * Get public bio page by username (no authentication required)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { username } = await params

    // Find affiliate by username
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: {
        shortLinkUsername: username,
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
            bio: true
          }
        },
        bioPage: {
          where: {
            isActive: true
          },
          include: {
            ctaButtons: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
              include: {
                membership: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    originalPrice: true,
                    description: true
                  }
                },
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    originalPrice: true,
                    description: true,
                    thumbnail: true
                  }
                },
                course: {
                  select: {
                    id: true,
                    title: true,
                    price: true,
                    originalPrice: true,
                    description: true,
                    thumbnail: true
                  }
                },
                optinForm: {
                  select: {
                    id: true,
                    formName: true,
                    headline: true
                  }
                }
              }
            },
            optinForms: {
              where: { isActive: true },
              select: {
                id: true,
                formName: true,
                headline: true,
                description: true,
                submitButtonText: true,
                collectName: true,
                collectEmail: true,
                collectPhone: true
              }
            }
          }
        }
      }
    })

    if (!affiliateProfile?.bioPage) {
      return NextResponse.json(
        { error: 'Bio page not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.affiliateBioPage.update({
      where: { id: affiliateProfile.bioPage.id },
      data: {
        viewCount: { increment: 1 }
      }
    }).catch(err => console.error('Error incrementing view count:', err))

    return NextResponse.json({
      user: affiliateProfile.user,
      bioPage: affiliateProfile.bioPage,
      affiliateCode: affiliateProfile.affiliateCode,
      username: affiliateProfile.shortLinkUsername
    })
  } catch (error) {
    console.error('Error fetching public bio page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bio page' },
      { status: 500 }
    )
  }
}
