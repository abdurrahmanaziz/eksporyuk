import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    tests: []
  }

  try {
    // Test 1: Prisma Client exists
    diagnostics.tests.push({
      name: 'Prisma Client Import',
      status: prisma ? 'PASS' : 'FAIL',
      details: typeof prisma
    })

    // Test 2: Simple query
    try {
      const userCount = await prisma.user.count()
      diagnostics.tests.push({
        name: 'User Count Query',
        status: 'PASS',
        result: userCount
      })
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'User Count Query',
        status: 'FAIL',
        error: error.message,
        code: error.code,
        stack: error.stack
      })
    }

    // Test 3: Affiliate Profile query
    try {
      const affiliateCount = await prisma.affiliateProfile.count()
      diagnostics.tests.push({
        name: 'Affiliate Profile Count',
        status: 'PASS',
        result: affiliateCount
      })
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Affiliate Profile Count',
        status: 'FAIL',
        error: error.message,
        code: error.code
      })
    }

    // Test 4: Affiliate Link query
    try {
      const linkCount = await prisma.affiliateLink.count()
      diagnostics.tests.push({
        name: 'Affiliate Link Count',
        status: 'PASS',
        result: linkCount
      })
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Affiliate Link Count',
        status: 'FAIL',
        error: error.message,
        code: error.code
      })
    }

    // Test 5: Specific user query
    try {
      const testUser = await prisma.user.findUnique({
        where: { email: 'azizbiasa@gmail.com' },
        select: { id: true, email: true, role: true }
      })
      diagnostics.tests.push({
        name: 'Find Specific User',
        status: testUser ? 'PASS' : 'NOT FOUND',
        result: testUser
      })
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Find Specific User',
        status: 'FAIL',
        error: error.message,
        code: error.code
      })
    }

    return NextResponse.json(diagnostics)

  } catch (error: any) {
    return NextResponse.json({
      ...diagnostics,
      criticalError: {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      }
    }, { status: 500 })
  }
}
