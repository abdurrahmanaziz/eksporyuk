import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { promises as dns } from 'dns'

export const dynamic = 'force-dynamic'

interface DNSLookupResult {
  type: string
  value: string
}

/**
 * POST /api/admin/short-link-domains/[id]/verify
 * Verify DNS record for a domain
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get domain from database
    const domain = await prisma.shortLinkDomain.findUnique({
      where: { id: params.id }
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Determine which DNS record type to check
    const recordType = (domain.dnsType || 'CNAME').toUpperCase()
    const expectedValue = domain.dnsTarget || 'eksporyuk.com'

    let isValid = false
    let actualRecords: DNSLookupResult[] = []
    let errorMessage = ''

    try {
      // Check DNS record based on type
      if (recordType === 'CNAME') {
        // For CNAME, we need the subdomain part only
        const parts = domain.domain.split('.')
        const subdomain = parts[0] // e.g., 'link' from 'link.eksporyuk.com'

        try {
          const cnames = await dns.resolveCname(domain.domain)
          actualRecords = cnames.map(c => ({
            type: 'CNAME',
            value: c
          }))

          // Check if any CNAME matches
          isValid = cnames.some(c => 
            c.toLowerCase() === expectedValue.toLowerCase() ||
            c.toLowerCase() === `${expectedValue}.`.toLowerCase()
          )
        } catch (error: any) {
          // CNAME might not exist, that's fine for verification
          if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
            errorMessage = 'CNAME record not found in DNS'
          } else {
            errorMessage = error.message
          }
        }
      } else if (recordType === 'A') {
        try {
          const addresses = await dns.resolve4(domain.domain)
          actualRecords = addresses.map(a => ({
            type: 'A',
            value: a
          }))

          // For A records, we just check if it resolves
          isValid = addresses.length > 0
        } catch (error: any) {
          if (error.code === 'ENOTFOUND') {
            errorMessage = 'A record not found in DNS'
          } else {
            errorMessage = error.message
          }
        }
      } else if (recordType === 'TXT') {
        try {
          const txtRecords = await dns.resolveTxt(domain.domain)
          actualRecords = txtRecords.map(r => ({
            type: 'TXT',
            value: r.join('')
          }))

          // For TXT records, check if expected value exists
          isValid = txtRecords.some(r => 
            r.join('').includes(expectedValue)
          )
        } catch (error: any) {
          if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
            errorMessage = 'TXT record not found in DNS'
          } else {
            errorMessage = error.message
          }
        }
      }
    } catch (error) {
      console.error('DNS lookup error:', error)
      errorMessage = 'Failed to verify DNS record'
    }

    // If verification failed but we want to allow manual verification
    // You can check with a body parameter
    const body = await req.json().catch(() => ({}))
    const forceVerify = body.force === true

    if (forceVerify || isValid) {
      // Update domain as verified
      const updated = await prisma.shortLinkDomain.update({
        where: { id: params.id },
        data: { isVerified: true }
      })

      return NextResponse.json({
        success: true,
        verified: true,
        message: forceVerify 
          ? 'Domain marked as verified (manual verification)' 
          : 'DNS record verified successfully',
        domain: updated,
        dnsCheck: {
          expected: {
            type: recordType,
            value: expectedValue
          },
          actual: actualRecords,
          isValid
        }
      })
    }

    // Verification failed
    return NextResponse.json({
      success: false,
      verified: false,
      message: errorMessage || `${recordType} record does not match expected value`,
      dnsCheck: {
        expected: {
          type: recordType,
          value: expectedValue
        },
        actual: actualRecords,
        isValid: false
      }
    }, { status: 400 })

  } catch (error) {
    console.error('Error verifying domain:', error)
    return NextResponse.json(
      { error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/short-link-domains/[id]/verify
 * Get DNS verification status without attempting to verify
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const domain = await prisma.shortLinkDomain.findUnique({
      where: { id: params.id }
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    const recordType = (domain.dnsType || 'CNAME').toUpperCase()
    const expectedValue = domain.dnsTarget || 'eksporyuk.com'

    return NextResponse.json({
      domain: domain.domain,
      isVerified: domain.isVerified,
      dnsRequired: {
        type: recordType,
        value: expectedValue,
        instructions: domain.dnsInstructions || getDefaultInstructions(domain.domain, recordType, expectedValue)
      }
    })

  } catch (error) {
    console.error('Error getting verification status:', error)
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    )
  }
}

function getDefaultInstructions(domain: string, type: string, target: string): string {
  if (type === 'CNAME') {
    return `Add a ${type} record:
Name: ${domain}
Target: ${target}`
  } else if (type === 'A') {
    return `Add an ${type} record:
Name: ${domain}
Value: (IP address of your server)`
  } else if (type === 'TXT') {
    return `Add a ${type} record:
Name: ${domain}
Value: ${target}`
  }
  return `Add a ${type} record for ${domain}`
}
