import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  // Block in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'This endpoint is disabled in production' 
    }, { status: 403 })
  }

  console.log('[TEST-LOGIN] POST request received')
  
  try {
    const body = await request.json()
    console.log('[TEST-LOGIN] Body:', body)
    
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    console.log('[TEST-LOGIN] User found:', !!user)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (!user.password) {
      return NextResponse.json({ error: 'No password set' }, { status: 400 })
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    console.log('[TEST-LOGIN] Password valid:', isValid)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
    
    // Success
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
    
  } catch (error: any) {
    console.error('[TEST-LOGIN] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
