/**
 * 🔄 SEJOLI ORDERS API ENDPOINT - FIX untuk 76M Discrepancy
 * 
 * Endpoint ini mengatasi masalah:
 * - /wp-json/sejoli-api/v1/orders returns 404 di WordPress
 * - Data orders tidak bisa diakses dari Sejoli dashboard
 * - Menyebabkan discrepancy 76M rupiah antara sistem
 * 
 * Solution:
 * - Buat orders endpoint di Next.js yang return data dari database Eksporyuk
 * - Format data sesuai dengan expected format Sejoli
 * - Provide data yang bisa diakses oleh dashboard Sejoli
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

const prisma = new PrismaClient()

// GET /api/admin/sejoli/orders
export async function GET(request) {
  try {
    // Check authorization - admin or API access
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    
    // Allow API access with proper credentials
    const authHeader = request.headers.get('authorization')
    const apiKey = searchParams.get('api_key')
    
    const isAuthorized = 
      (session?.user && (session.user.role === 'ADMIN' || session.user.role === 'FOUNDER')) ||
      (authHeader && authHeader.includes('eksporyuk')) ||
      (apiKey === process.env.SEJOLI_API_KEY)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    // Get query parameters
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const status = searchParams.get('status') || 'all'
    const affiliate = searchParams.get('affiliate')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const orderBy = searchParams.get('order_by') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    console.log(`📊 Fetching orders: page=${page}, limit=${limit}, status=${status}`)

    // Build where clause
    const whereClause = {
      status: status === 'all' ? undefined : status.toUpperCase(),
      type: 'MEMBERSHIP', // Focus on membership orders
      ...(affiliate && { affiliateId: affiliate }),
      ...(dateFrom && { 
        createdAt: { 
          gte: new Date(dateFrom),
          ...(dateTo && { lte: new Date(dateTo) })
        }
      })
    }

    // Remove undefined values
    Object.keys(whereClause).forEach(key => {
      if (whereClause[key] === undefined) {
        delete whereClause[key]
      }
    })

    // Get total count
    const totalCount = await prisma.transaction.count({
      where: whereClause
    })

    // Get transactions with relations
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        },
        affiliateUser: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        },
        userMemberships: {
          include: {
            membership: {
              select: {
                id: true,
                name: true,
                price: true,
                duration: true,
                affiliateCommissionRate: true
              }
            }
          }
        },
        affiliateConversions: {
          select: {
            id: true,
            commissionAmount: true,
            commissionRate: true,
            paidOut: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        [orderBy === 'created_at' ? 'createdAt' : orderBy]: order
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Format response in Sejoli-compatible format
    const orders = transactions.map(tx => {
      const membership = tx.userMemberships?.[0]?.membership
      const commission = tx.affiliateConversions?.[0]

      return {
        id: tx.id,
        order_id: tx.invoiceNumber,
        invoice_number: tx.invoiceNumber,
        
        // Customer info
        customer_id: tx.user?.id,
        customer_name: tx.customerName || tx.user?.name,
        customer_email: tx.customerEmail || tx.user?.email,
        
        // Product/Membership info
        product_id: membership?.id,
        product_name: membership?.name || tx.description,
        product_price: membership?.price || tx.amount,
        
        // Order details
        total_amount: tx.amount,
        status: tx.status.toLowerCase(),
        payment_method: tx.paymentMethod,
        
        // Affiliate info
        affiliate_id: tx.affiliateId,
        affiliate_name: tx.affiliateUser?.name,
        affiliate_email: tx.affiliateUser?.email,
        affiliate_username: tx.affiliateUser?.username,
        
        // Commission info
        commission_amount: commission?.commissionAmount || 0,
        commission_rate: commission?.commissionRate || membership?.affiliateCommissionRate || 0,
        commission_paid: commission?.paidOut || false,
        commission_date: commission?.createdAt,
        
        // Dates
        created_at: tx.createdAt,
        updated_at: tx.updatedAt,
        order_date: tx.createdAt,
        
        // Additional metadata
        membership_duration: membership?.duration,
        sync_source: tx.metadata?.syncedAt ? 'sejoli_csv_sync' : 'eksporyuk_native',
        original_data: tx.metadata
      }
    })

    // Calculate summary statistics
    const summary = {
      total_orders: totalCount,
      total_amount: transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
      total_commission: transactions.reduce((sum, tx) => {
        const commission = tx.affiliateConversions?.[0]
        return sum + (commission?.commissionAmount || 0)
      }, 0),
      orders_with_affiliate: transactions.filter(tx => tx.affiliateId).length,
      commission_pending: transactions.filter(tx => {
        const commission = tx.affiliateConversions?.[0]
        return commission && !commission.paidOut
      }).length
    }

    const pagination = {
      current_page: page,
      per_page: limit,
      total: totalCount,
      total_pages: Math.ceil(totalCount / limit),
      has_next: page * limit < totalCount,
      has_prev: page > 1
    }

    console.log(`✅ Orders API: returning ${orders.length} orders, total: ${totalCount}`)
    
    // Log key metrics for debugging the 76M discrepancy
    console.log(`📊 Summary: ${summary.total_amount.toLocaleString()} total, ${summary.total_commission.toLocaleString()} commission`)

    return NextResponse.json({
      success: true,
      data: orders,
      summary,
      pagination,
      filters_applied: {
        status,
        affiliate,
        date_from: dateFrom,
        date_to: dateTo,
        order_by: orderBy,
        order
      },
      api_info: {
        endpoint: '/api/admin/sejoli/orders',
        purpose: 'Fix for missing Sejoli orders API (404 error)',
        data_source: 'Eksporyuk PostgreSQL database',
        compatibility: 'Sejoli dashboard format'
      }
    })

  } catch (error) {
    console.error('❌ Orders API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to fetch orders data from database'
    }, { status: 500 })
  }
}

// POST /api/admin/sejoli/orders - untuk update orders atau sync
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 401 })
    }

    const body = await request.json()
    const { action, order_ids, status_update, commission_update } = body

    console.log(`🔄 Orders API POST: action=${action}`)

    switch (action) {
      case 'bulk_update_status':
        if (!order_ids || !status_update) {
          return NextResponse.json({ error: 'order_ids and status_update required' }, { status: 400 })
        }

        const updateResult = await prisma.transaction.updateMany({
          where: {
            id: { in: order_ids }
          },
          data: {
            status: status_update.toUpperCase()
          }
        })

        return NextResponse.json({
          success: true,
          message: `Updated ${updateResult.count} orders`,
          updated_count: updateResult.count
        })

      case 'sync_commissions':
        // Re-calculate commissions for orders
        const ordersToSync = await prisma.transaction.findMany({
          where: {
            id: { in: order_ids || [] },
            type: 'MEMBERSHIP',
            affiliateId: { not: null }
          },
          include: {
            userMemberships: {
              include: {
                membership: {
                  select: { affiliateCommissionRate: true }
                }
              }
            },
            affiliateConversions: true
          }
        })

        let syncedCount = 0
        for (const order of ordersToSync) {
          const membership = order.userMemberships?.[0]?.membership
          const commissionRate = membership?.affiliateCommissionRate || 0
          const commissionAmount = Math.round(order.amount * commissionRate / 100)

          if (commissionAmount > 0 && order.affiliateConversions.length === 0) {
            // Create missing commission record
            await prisma.affiliateConversion.create({
              data: {
                affiliateId: order.affiliateId,
                transactionId: order.id,
                commissionAmount,
                commissionRate,
                paidOut: false
              }
            })
            syncedCount++
          }
        }

        return NextResponse.json({
          success: true,
          message: `Synced commissions for ${syncedCount} orders`,
          synced_count: syncedCount
        })

      case 'fix_discrepancy':
        // Special action to fix the 76M discrepancy
        console.log('🎯 Fixing 76M discrepancy...')
        
        // Find orders with missing affiliate conversions
        const missingConversions = await prisma.transaction.findMany({
          where: {
            type: 'MEMBERSHIP',
            status: 'SUCCESS',
            affiliateId: { not: null },
            affiliateConversions: {
              none: {}
            }
          },
          include: {
            affiliateUser: { select: { name: true, email: true } },
            userMemberships: {
              include: {
                membership: { select: { affiliateCommissionRate: true, name: true } }
              }
            }
          }
        })

        console.log(`🔍 Found ${missingConversions.length} orders with missing commission records`)

        let fixedCount = 0
        let totalCommissionFixed = 0

        for (const order of missingConversions) {
          try {
            const membership = order.userMemberships?.[0]?.membership
            const commissionRate = membership?.affiliateCommissionRate || 0
            
            if (commissionRate > 0) {
              const commissionAmount = Math.round(order.amount * commissionRate / 100)
              
              // Get affiliate profile
              const affiliateProfile = await prisma.affiliateProfile.findFirst({
                where: { userId: order.affiliateId }
              })

              if (affiliateProfile) {
                await prisma.affiliateConversion.create({
                  data: {
                    affiliateId: affiliateProfile.id,
                    transactionId: order.id,
                    commissionAmount,
                    commissionRate,
                    paidOut: false
                  }
                })

                fixedCount++
                totalCommissionFixed += commissionAmount
                
                console.log(`✅ Fixed commission for ${order.affiliateUser?.email}: Rp${commissionAmount.toLocaleString()}`)
              }
            }
          } catch (error) {
            console.error(`❌ Error fixing commission for order ${order.id}:`, error.message)
          }
        }

        return NextResponse.json({
          success: true,
          message: `Fixed discrepancy: ${fixedCount} commissions created`,
          fixed_count: fixedCount,
          total_commission_fixed: totalCommissionFixed,
          discrepancy_resolution: {
            missing_conversions_found: missingConversions.length,
            commissions_created: fixedCount,
            total_amount: totalCommissionFixed
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Orders API POST Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to process orders update'
    }, { status: 500 })
  }
}