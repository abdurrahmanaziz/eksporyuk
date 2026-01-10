import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PublicBioView from './PublicBioView'

interface PageProps {
  params: {
    username: string
  }
}

async function getBioPage(username: string | undefined) {
  if (!username) return null
  
  // Remove @ if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username

  const user = await prisma.user.findFirst({
    where: {
      affiliateProfile: {
        shortLinkUsername: cleanUsername
      }
    },
    include: {
      affiliateProfile: {
        include: {
          bioPage: {
            where: {
              isActive: true
            },
            include: {
              ctaButtons: {
                where: {
                  isActive: true
                },
                orderBy: {
                  displayOrder: 'asc'
                },
                include: {
                  membership: {
                    select: {
                      id: true,
                      name: true,
                      slug: true
                    }
                  },
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true
                    }
                  },
                  course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true
                    }
                  },
                  optinForm: {
                    select: {
                      id: true,
                      formName: true,
                      headline: true,
                      description: true,
                      submitButtonText: true,
                      successMessage: true,
                      redirectType: true,
                      redirectUrl: true,
                      redirectWhatsapp: true,
                      collectName: true,
                      collectEmail: true,
                      collectPhone: true
                    }
                  }
                }
              },
              optinForms: {
                where: {
                  isActive: true,
                  bioPageId: {
                    not: null
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!user?.affiliateProfile?.bioPage) {
    return null
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.avatar  // Changed from avatar to image to match interface
    },
    bioPage: user.affiliateProfile.bioPage,
    affiliateCode: user.affiliateProfile.affiliateCode
  }
}

export default async function BioPage({ params }: PageProps) {
  const { username } = await params
  const data = await getBioPage(username)

  if (!data) {
    notFound()
  }

  // Increment view count (fire and forget)
  prisma.affiliateBioPage.update({
    where: { id: data.bioPage.id },
    data: { viewCount: { increment: 1 } }
  }).catch(() => {}) // Ignore errors

  // Cookie will be set client-side in PublicBioView component
  return <PublicBioView data={data} />
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  const data = await getBioPage(username)

  if (!data) {
    return {
      title: 'Bio Page Not Found'
    }
  }

  return {
    title: `${data.user.name} - ${data.bioPage.customHeadline || 'Affiliate Ekspor Yuk'}`,
    description: data.bioPage.customDescription || `Bio page dari ${data.user.name}`,
    openGraph: {
      title: data.user.name,
      description: data.bioPage.customDescription || '',
      images: data.bioPage.coverImage ? [data.bioPage.coverImage] : []
    }
  }
}
