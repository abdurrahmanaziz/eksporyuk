import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Facebook Data Deletion Callback
// Documentation: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    const signedRequest = params.get('signed_request')
    
    if (!signedRequest) {
      return NextResponse.json(
        { error: 'Missing signed_request parameter' },
        { status: 400 }
      )
    }

    // Parse the signed request
    const [encodedSig, payload] = signedRequest.split('.')
    
    if (!encodedSig || !payload) {
      return NextResponse.json(
        { error: 'Invalid signed_request format' },
        { status: 400 }
      )
    }

    // Decode the payload
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    )

    const userId = data.user_id

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user_id in payload' },
        { status: 400 }
      )
    }

    // Generate a unique confirmation code for this deletion request
    const confirmationCode = crypto.randomBytes(16).toString('hex')
    
    // Log the deletion request
    console.log(`[FACEBOOK DATA DELETION] Request received for Facebook user: ${userId}`)
    console.log(`[FACEBOOK DATA DELETION] Confirmation code: ${confirmationCode}`)

    // Try to find and delete user data associated with this Facebook ID
    // Facebook users are stored with their Facebook ID in the accounts table (NextAuth)
    try {
      // Find account linked to this Facebook user
      const account = await prisma.account.findFirst({
        where: {
          provider: 'facebook',
          providerAccountId: userId,
        },
        include: {
          user: true,
        },
      })

      if (account && account.user) {
        const userEmail = account.user.email
        const internalUserId = account.user.id

        console.log(`[FACEBOOK DATA DELETION] Found user: ${userEmail} (ID: ${internalUserId})`)

        // Delete user's Facebook-related data
        // Option 1: Delete the account link only (user can still login with email/password)
        await prisma.account.delete({
          where: {
            id: account.id,
          },
        })

        // Option 2: If you want to delete ALL user data, uncomment below:
        // await prisma.user.delete({
        //   where: { id: internalUserId }
        // })

        console.log(`[FACEBOOK DATA DELETION] Deleted Facebook account link for user: ${userEmail}`)
      } else {
        console.log(`[FACEBOOK DATA DELETION] No user found with Facebook ID: ${userId}`)
      }
    } catch (dbError) {
      console.error(`[FACEBOOK DATA DELETION] Database error:`, dbError)
      // Continue anyway - we still need to respond to Facebook
    }

    // Facebook expects a JSON response with:
    // - url: A URL where the user can check the status of their deletion request
    // - confirmation_code: A unique code for tracking the deletion request
    const statusUrl = `${process.env.NEXTAUTH_URL || 'https://eksporyuk.com'}/data-deletion-status?code=${confirmationCode}`

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    })

  } catch (error) {
    console.error('[FACEBOOK DATA DELETION] Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Facebook Data Deletion Callback Endpoint',
    description: 'This endpoint handles user data deletion requests from Facebook.',
    method: 'POST',
    documentation: 'https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback',
  })
}
