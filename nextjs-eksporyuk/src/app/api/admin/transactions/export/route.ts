import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    const where: any = {}

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { ...where.createdAt, lte: end }
    }
    if (status) {
      where.status = status
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        membership: {
          include: {
            membership: {
              select: {
                name: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    })

    // Generate CSV content
    const headers = [
      'Invoice',
      'Date',
      'Time',
      'Customer Name',
      'Customer Email',
      'Phone',
      'Product/Membership/Course',
      'Type',
      'Amount',
      'Status',
      'Payment Method',
    ]

    const rows = transactions.map((tx) => [
      tx.invoiceNumber || tx.id.slice(0, 8),
      new Date(tx.createdAt).toLocaleDateString('id-ID'),
      new Date(tx.createdAt).toLocaleTimeString('id-ID'),
      tx.customerName || tx.user.name || '-',
      tx.customerEmail || tx.user.email || '-',
      tx.customerPhone || '-',
      tx.membership?.membership?.name || tx.product?.name || tx.course?.title || '-',
      tx.type || '-',
      tx.amount.toString(),
      tx.status,
      tx.paymentMethod || '-',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
