import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || searchParams.get('dateFrom')
    const endDate = searchParams.get('endDate') || searchParams.get('dateTo')
    const status = searchParams.get('status')

    const where: any = {}
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    if (status && status !== 'ALL') {
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
            memberCode: true,
          }
        },
        membership: {
          include: {
            membership: true
          }
        },
        product: {
          select: {
            name: true,
          }
        },
        course: {
          select: {
            title: true,
          }
        },
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        }
      }
    })

    // Generate CSV
    const headers = [
      'ID Transaksi',
      'Tanggal',
      'Customer',
      'Email',
      'Kode Member',
      'Produk',
      'Tipe',
      'Jumlah',
      'Diskon',
      'Status',
      'Metode Pembayaran',
      'Invoice',
      'Affiliate',
      'Komisi Affiliate',
    ]

    const rows = transactions.map(tx => [
      tx.id,
      new Date(tx.createdAt).toLocaleString('id-ID'),
      tx.user?.name || tx.customerName || '-',
      tx.user?.email || tx.customerEmail || '-',
      tx.user?.memberCode || '-',
      tx.membership?.membership?.name || tx.product?.name || tx.course?.title || '-',
      tx.type || '-',
      `Rp ${tx.amount?.toLocaleString('id-ID') || 0}`,
      `Rp ${tx.discountAmount?.toLocaleString('id-ID') || 0}`,
      tx.status,
      tx.paymentMethod || '-',
      tx.invoiceNumber || '-',
      tx.affiliateConversion?.affiliate?.user?.name || '-',
      `Rp ${tx.affiliateConversion?.commissionAmount?.toLocaleString('id-ID') || 0}`,
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json({ 
      error: 'Failed to export transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
