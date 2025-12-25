import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { mailketing } from '@/lib/integrations/mailketing'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/mailketing/lists
// Fetch all lists from Mailketing
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch lists from Mailketing
    console.log('🚀 [API] Fetching lists from Mailketing...')
    const response = await mailketing.getLists()
    console.log('📥 [API] Mailketing response:', JSON.stringify(response, null, 2))

    if (response.success) {
      // Handle both array response and object with data property
      let lists = []
      if (Array.isArray(response.data)) {
        lists = response.data
      } else if (response.data && Array.isArray(response.data.data)) {
        lists = response.data.data
      } else if (response.data && response.data.lists) {
        lists = response.data.lists
      }
      
      console.log('📋 Fetched', lists.length, 'lists from Mailketing')
      
      // Get usage count for each list from database
      const listsWithUsage = await Promise.all(
        lists.map(async (list: any) => {
          try {
            const listId = list.id
            
            const [membershipCount, productCount, courseCount] = await Promise.all([
              prisma.membership.count({
                where: { mailketingListId: listId }
              }),
              prisma.product.count({
                where: { mailketingListId: listId }
              }),
              prisma.course.count({
                where: { mailketingListId: listId }
              })
            ])

            return {
              ...list,
              usage: {
                memberships: membershipCount,
                products: productCount,
                courses: courseCount,
                total: membershipCount + productCount + courseCount
              }
            }
          } catch (dbError) {
            console.error('❌ Error fetching usage for list:', list.id, dbError)
            return {
              ...list,
              usage: {
                memberships: 0,
                products: 0,
                courses: 0,
                total: 0
              }
            }
          }
        })
      )

      return NextResponse.json({
        success: true,
        lists: listsWithUsage,
        count: listsWithUsage.length,
        message: response.message || 'Lists fetched successfully'
      })
    } else {
      // API endpoint not available is an expected condition, not an error
      // Return 200 with empty lists and informative message
      if (response.error === 'API_ENDPOINT_NOT_AVAILABLE') {
        console.log('ℹ️  [API] Mailketing endpoint not available - returning empty state')
        return NextResponse.json({
          success: false,
          lists: [],
          count: 0,
          message: response.message,
          error: response.error
        }) // 200 OK - not a server error
      }
      
      // Actual error (API key missing, network issue, etc)
      return NextResponse.json({
        success: false,
        message: response.message || 'Failed to fetch lists',
        error: response.error,
        lists: []
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Error fetching Mailketing lists:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/mailketing/lists
// Create new list in Mailketing
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { name, description } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'List name is required'
      }, { status: 400 })
    }

    // Create list in Mailketing
    const response = await mailketing.createList(
      name.trim(),
      description?.trim()
    )

    if (response.success) {
      return NextResponse.json({
        success: true,
        list: response.data,
        message: 'List created successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: response.message || 'Failed to create list',
        error: response.error
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Error creating Mailketing list:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      },
      { status: 500 }
    )
  }
}
