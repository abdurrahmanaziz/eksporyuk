import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

/**
 * GET /api/affiliate/optin-forms/[id]/export
 * Export leads from optin form to CSV
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify form exists
    const optinForm = await prisma.affiliateOptinForm.findUnique({
      where: { id }
    })

    if (!optinForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Get affiliate profile for this form
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { id: optinForm.affiliateId },
      include: {
        user: true
      }
    })

    // Verify current user owns this form
    if (!affiliate || affiliate.user.email !== session.user.email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all leads for this form
    const leads = await prisma.affiliateLead.findMany({
      where: {
        optinFormId: id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true,
        status: true,
        source: true,
        notes: true,
        createdAt: true
      }
    })

    // Generate CSV content
    const headers = ['No', 'Nama', 'Email', 'Phone', 'WhatsApp', 'Status', 'Source', 'Notes', 'Tanggal Daftar']
    const rows = leads.map((lead, index) => [
      index + 1,
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.whatsapp || '',
      lead.status,
      lead.source,
      lead.notes || '',
      new Date(lead.createdAt).toLocaleString('id-ID')
    ])

    // Format CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Add BOM for Excel UTF-8 support
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    // Return CSV file
    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${optinForm.formName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('[EXPORT] Error exporting leads:', error)
    return NextResponse.json(
      { error: 'Failed to export leads' },
      { status: 500 }
    )
  }
}
