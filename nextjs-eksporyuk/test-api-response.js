const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAPIResponse() {
  try {
    console.log('🔍 Simulating API response for bio page...\n')

    // Simulate what the API returns
    const user = await prisma.user.findFirst({
      where: {
        username: 'demoaffiliate'
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
                        formName: true
                      }
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
      console.log('❌ No bio page found')
      return
    }

    const bioPage = user.affiliateProfile.bioPage

    console.log('✅ Bio Page Found!\n')
    console.log('CTA Buttons with Font Sizes:\n')

    bioPage.ctaButtons.forEach((cta, index) => {
      console.log(`${index + 1}. ${cta.buttonText}`)
      console.log(`   Style: ${cta.buttonStyle}`)
      console.log(`   Title Size: ${cta.titleSize}`)
      console.log(`   Subtitle Size: ${cta.subtitleSize}`)
      console.log(`   Button Text Size: ${cta.buttonTextSize}`)
      console.log('')
    })

    // Test if fields are included in response
    const firstCta = bioPage.ctaButtons[0]
    if (firstCta.titleSize !== undefined) {
      console.log('✅ Font size fields are included in API response!')
    } else {
      console.log('❌ Font size fields are NOT included in API response!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIResponse()
