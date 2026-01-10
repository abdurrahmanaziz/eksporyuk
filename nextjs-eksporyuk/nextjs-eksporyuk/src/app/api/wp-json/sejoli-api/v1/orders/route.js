/**
 * 🔄 SEJOLI API PROXY - WordPress-Compatible Orders Endpoint
 * 
 * Endpoint ini mengatasi masalah 404 di /wp-json/sejoli-api/v1/orders
 * dengan menyediakan proxy ke data Eksporyuk dalam format yang compatible
 * dengan expected Sejoli WordPress API format
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/wp-json/sejoli-api/v1/orders
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Authentication check - mimic WordPress API behavior
    const authHeader = request.headers.get('authorization')
    const isAuthenticated = authHeader && (
      authHeader.includes('eksporyuk') || 
      authHeader.includes('Basic')
    )

    if (!isAuthenticated) {
      return NextResponse.json({
        code: 'rest_forbidden',
        message: 'You are not allowed to access this endpoint.',
        data: { status: 403 }
      }, { status: 403 })
    }

    // Parse query parameters (WordPress style)
    const page = parseInt(searchParams.get('page')) || 1
    const per_page = parseInt(searchParams.get('per_page')) || 10
    const status = searchParams.get('status')
    const order = searchParams.get('order') || 'desc'
    const orderby = searchParams.get('orderby') || 'date'
    const search = searchParams.get('search')
    const affiliate = searchParams.get('affiliate')

    console.log(`📊 WordPress-style orders API: page=${page}, per_page=${per_page}`)

    // Build where clause
    const whereClause = {
      type: 'MEMBERSHIP',
      ...(status && status !== 'any' && { 
        status: status.toUpperCase() 
      }),
      ...(affiliate && { affiliateId: affiliate }),
      ...(search && {
        OR: [
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } }
        ]
      })
    }

    // Remove undefined values
    Object.keys(whereClause).forEach(key => {
      if (whereClause[key] === undefined) {
        delete whereClause[key]
      }
    })

    // Get total for headers
    const total = await prisma.transaction.count({ where: whereClause })

    // Get transactions
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
        [orderby === 'date' ? 'createdAt' : orderby]: order
      },
      skip: (page - 1) * per_page,
      take: per_page
    })

    // Format in WordPress/Sejoli style
    const orders = transactions.map(tx => {
      const membership = tx.userMemberships?.[0]?.membership
      const commission = tx.affiliateConversions?.[0]

      return {
        id: parseInt(tx.id.replace(/\D/g, '').slice(0, 8)), // Convert to int for WordPress compatibility
        order_key: tx.invoiceNumber,
        order_number: tx.invoiceNumber,
        
        // WordPress-style status
        status: tx.status.toLowerCase() === 'success' ? 'completed' : tx.status.toLowerCase(),
        
        // Customer data (WordPress format)
        customer_id: parseInt(tx.user?.id?.replace(/\D/g, '').slice(0, 8)) || 0,
        billing: {
          first_name: tx.customerName?.split(' ')[0] || '',
          last_name: tx.customerName?.split(' ').slice(1).join(' ') || '',
          email: tx.customerEmail || tx.user?.email || '',
          phone: '',
          address_1: '',
          city: '',
          country: 'ID'
        },
        
        // Order totals
        total: tx.amount.toString(),
        total_tax: '0',
        shipping_total: '0',
        
        // Product info
        line_items: [{
          id: membership?.id || 1,
          name: membership?.name || tx.description,
          product_id: membership?.id || 1,
          quantity: 1,
          price: membership?.price || tx.amount,
          total: tx.amount.toString()
        }],
        
        // Dates (WordPress format)
        date_created: tx.createdAt.toISOString(),
        date_modified: tx.updatedAt.toISOString(),
        date_completed: tx.status === 'SUCCESS' ? tx.createdAt.toISOString() : null,
        date_paid: tx.status === 'SUCCESS' ? tx.createdAt.toISOString() : null,
        
        // Payment info
        payment_method: tx.paymentMethod?.toLowerCase() || 'manual',
        payment_method_title: tx.paymentMethod || 'Manual Payment',
        transaction_id: tx.invoiceNumber,
        
        // Affiliate information (custom fields)
        affiliate: tx.affiliateId ? {
          id: tx.affiliateId,
          name: tx.affiliateUser?.name,
          email: tx.affiliateUser?.email,
          username: tx.affiliateUser?.username,
          commission: {
            amount: commission?.commissionAmount || 0,
            rate: commission?.commissionRate || membership?.affiliateCommissionRate || 0,
            paid: commission?.paidOut || false,
            date: commission?.createdAt
          }
        } : null,
        
        // Sejoli-specific fields
        sejoli: {
          product_id: membership?.id,
          product_name: membership?.name || tx.description,
          affiliate_commission: commission?.commissionAmount || 0,
          commission_rate: commission?.commissionRate || membership?.affiliateCommissionRate || 0,
          is_affiliate_order: !!tx.affiliateId,
          membership_duration: membership ? tx.userMemberships[0]?.membership?.duration : null
        },
        
        // Meta data
        meta_data: [
          {
            key: '_eksporyuk_transaction_id',
            value: tx.id
          },
          {
            key: '_affiliate_id',
            value: tx.affiliateId || ''
          },
          {
            key: '_commission_amount',
            value: commission?.commissionAmount || 0
          },
          {
            key: '_sync_source',
            value: tx.metadata?.syncedAt ? 'sejoli_csv' : 'eksporyuk'
          }
        ]
      }
    })

    // WordPress-style response with headers
    const response = NextResponse.json(orders)
    
    // WordPress pagination headers
    response.headers.set('X-WP-Total', total.toString())
    response.headers.set('X-WP-TotalPages', Math.ceil(total / per_page).toString())
    response.headers.set('X-WP-Page', page.toString())
    response.headers.set('X-WP-PerPage', per_page.toString())
    
    // CORS headers for cross-domain access
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    
    console.log(`✅ WordPress-style API: returning ${orders.length}/${total} orders`)
    
    return response

  } catch (error) {
    console.error('❌ Sejoli proxy API error:', error)
    
    // WordPress-style error response
    return NextResponse.json({
      code: 'rest_no_route',
      message: 'No route was found matching the URL and request method',
      data: { 
        status: 404,
        error_details: error.message 
      }
    }, { status: 404 })
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type'
    }
  })
}