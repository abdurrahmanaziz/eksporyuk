import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Filter parameters (support both old/new param names)
    const startDate = searchParams.get('startDate') || searchParams.get('dateFrom')
    const endDate = searchParams.get('endDate') || searchParams.get('dateTo')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const membershipDuration = searchParams.get('membershipDuration')
    const userId = searchParams.get('userId')
    const affiliateId = searchParams.get('affiliateId')
    const productId = searchParams.get('productId')
    const search = searchParams.get('search') || searchParams.get('invoice') || ''
    const paymentMethod = searchParams.get('paymentMethod')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '200')
    
    // Build where clause
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
    
    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod
    }
    
    if (type && type !== 'ALL') {
      if (type.startsWith('MEMBERSHIP_')) {
        where.type = 'MEMBERSHIP'
      } else {
        where.type = type
      }
    }
    
    const filterDuration = membershipDuration || (type?.startsWith('MEMBERSHIP_') ? type.replace('MEMBERSHIP_', '') : null)
    
    if (userId) {
      where.userId = userId
    }
    
    if (productId) {
      where.productId = productId
    }
    
    // Search by invoice/externalId (simple search without relations)
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { invoiceNumber: { contains: search } },
        { externalId: { contains: search } },
        { customerEmail: { contains: search } },
        { customerName: { contains: search } },
      ]
    }
    
    // Get total count
    const total = await prisma.transaction.count({ where })
    
    // Get transactions WITHOUT relations (manual lookup)
    const rawTransactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
    })
    
    // Collect all IDs for batch lookup
    const userIds = [...new Set(rawTransactions.map(t => t.userId).filter(Boolean))]
    const productIds = [...new Set(rawTransactions.map(t => t.productId).filter(Boolean))]
    const couponIds = [...new Set(rawTransactions.map(t => t.couponId).filter(Boolean))]
    const courseIds = [...new Set(rawTransactions.map(t => t.courseId).filter(Boolean))]
    const transactionIds = rawTransactions.map(t => t.id)
    
    // Batch fetch related data
    const [users, products, coupons, courses, conversions] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, name: true, email: true, phone: true, whatsapp: true }
      }),
      prisma.product.findMany({
        where: { id: { in: productIds as string[] } },
        select: { id: true, name: true, price: true }
      }),
      prisma.coupon.findMany({
        where: { id: { in: couponIds as string[] } },
        select: { id: true, code: true, discountType: true, discountValue: true }
      }),
      prisma.course.findMany({
        where: { id: { in: courseIds as string[] } },
        select: { id: true, title: true, price: true }
      }),
      prisma.affiliateConversion.findMany({
        where: { transactionId: { in: transactionIds } },
        select: { 
          id: true, 
          transactionId: true, 
          affiliateId: true, 
          commissionAmount: true,
          paidOut: true 
        }
      })
    ])
    
    // Create lookup maps
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))
    const couponMap = Object.fromEntries(coupons.map(c => [c.id, c]))
    const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))
    const conversionMap = Object.fromEntries(conversions.map(c => [c.transactionId, c]))
    
    // Fetch affiliate users for conversions
    const affiliateUserIds = [...new Set(conversions.map(c => c.affiliateId).filter(Boolean))]
    const affiliateUsers = await prisma.user.findMany({
      where: { id: { in: affiliateUserIds } },
      select: { id: true, name: true, email: true, phone: true, whatsapp: true }
    })
    const affiliateUserMap = Object.fromEntries(affiliateUsers.map(u => [u.id, u]))
    
    // Enrich transactions
    const transactions = rawTransactions.map(tx => {
      const conversion = conversionMap[tx.id]
      return {
        ...tx,
        user: tx.userId ? userMap[tx.userId] || null : null,
        product: tx.productId ? productMap[tx.productId] || null : null,
        coupon: tx.couponId ? couponMap[tx.couponId] || null : null,
        course: tx.courseId ? courseMap[tx.courseId] || null : null,
        membership: null, // No relation for now
        affiliateConversion: conversion ? {
          ...conversion,
          affiliate: {
            user: affiliateUserMap[conversion.affiliateId] || null
          }
        } : null
      }
    })
    
    // Filter by duration if needed (from metadata)
    let filteredTransactions = transactions
    if (filterDuration) {
      filteredTransactions = transactions.filter(tx => {
        if (tx.type !== 'MEMBERSHIP') return false
        const duration = (tx.metadata as any)?.membershipDuration || (tx.metadata as any)?.duration
        return String(duration) === String(filterDuration)
      })
    }
    
    // Filter by affiliate if specified
    if (affiliateId) {
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.affiliateConversion?.affiliateId === affiliateId
      )
    }
    
    // Get stats
    const stats = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    })
    
    const successStats = await prisma.transaction.aggregate({
      where: { ...where, status: 'SUCCESS' },
      _sum: { amount: true },
      _count: true,
    })
    
    const pendingStats = await prisma.transaction.aggregate({
      where: { ...where, status: 'PENDING' },
      _sum: { amount: true },
      _count: true,
    })

    return NextResponse.json({
      success: true,
      transactions: filteredTransactions,
      pagination: {
        page,
        limit,
        total: filterDuration || affiliateId ? filteredTransactions.length : total,
        totalPages: Math.ceil((filterDuration || affiliateId ? filteredTransactions.length : total) / limit),
      },
      stats: {
        total: {
          count: stats._count || 0,
          amount: Number(stats._sum.amount || 0),
        },
        success: {
          count: successStats._count || 0,
          amount: Number(successStats._sum.amount || 0),
        },
        pending: {
          count: pendingStats._count || 0,
          amount: Number(pendingStats._sum.amount || 0),
        }
      },
      filterOptions: {
        users: [],
        affiliates: [],
      }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales data', details: String(error) },
      { status: 500 }
    )
  }
}

// Export CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filters } = body
    
    // Build where clause
    const where: any = {}
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }
    
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status
    }
    
    if (filters.type && filters.type !== 'ALL') {
      where.type = filters.type
    }
    
    // Get all transactions
    const rawTransactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    
    // Batch fetch users and products
    const userIds = [...new Set(rawTransactions.map(t => t.userId).filter(Boolean))]
    const productIds = [...new Set(rawTransactions.map(t => t.productId).filter(Boolean))]
    
    const [users, products] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, name: true, email: true, phone: true }
      }),
      prisma.product.findMany({
        where: { id: { in: productIds as string[] } },
        select: { id: true, name: true, price: true }
      })
    ])
    
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))
    
    const transactions = rawTransactions.map(tx => ({
      ...tx,
      user: tx.userId ? userMap[tx.userId] || null : null,
      product: tx.productId ? productMap[tx.productId] || null : null,
    }))
    
    return NextResponse.json({
      success: true,
      data: transactions,
    })
  } catch (error) {
    console.error('Error exporting sales:', error)
    return NextResponse.json(
      { error: 'Failed to export sales data' },
      { status: 500 }
    )
  }
}
