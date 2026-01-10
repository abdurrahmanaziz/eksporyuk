import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🔍 [Test Affiliate Links] Starting...')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'EXISTS' : 'NULL')
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }
    
    console.log('User ID:', session.user.id)
    
    // Import prisma here to catch any import errors
    const { prisma } = await import('@/lib/prisma')
    console.log('Prisma imported successfully')
    
    // Test 1: Find affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, affiliateCode: true }
    })
    
    console.log('Affiliate:', affiliate)
    
    if (!affiliate) {
      return NextResponse.json({ 
        error: 'No affiliate profile',
        userId: session.user.id 
      }, { status: 404 })
    }
    
    // Test 2: Count links
    const count = await prisma.affiliateLink.count({
      where: { affiliateId: affiliate.id }
    })
    
    console.log('Link count:', count)
    
    // Test 3: Fetch links with minimal fields first
    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId: affiliate.id },
      select: {
        id: true,
        code: true,
        fullUrl: true,
        linkType: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('Links fetched:', links.length)
    
    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        code: affiliate.affiliateCode
      },
      totalLinks: count,
      sampleLinks: links
    })
    
  } catch (error: any) {
    console.error('ERROR:', error)
    
    return NextResponse.json({
      error: 'Internal error',
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
