import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


export const dynamic = 'force-dynamic';
export async function POST() {
  // Block in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'This endpoint is disabled in production' 
    }, { status: 403 })
  }

  try {
    const password = await bcrypt.hash('password123', 10)

    const users = [
      { id: 'founder-001', email: 'founder@eksporyuk.com', name: 'Muhammad Founder', role: 'FOUNDER', phone: '+62812345601', balance: 100000000 },
      { id: 'cofounder-001', email: 'cofounder@eksporyuk.com', name: 'Ahmad Co-Founder', role: 'CO_FOUNDER', phone: '+62812345602', balance: 50000000 },
      { id: 'admin-001', email: 'admin@eksporyuk.com', name: 'Budi Administrator', role: 'ADMIN', phone: '+62812345603', balance: 5000000 },
      { id: 'mentor-001', email: 'mentor@eksporyuk.com', name: 'Siti Mentor', role: 'MENTOR', phone: '+62812345604', balance: 3000000 },
      { id: 'affiliate-001', email: 'affiliate@eksporyuk.com', name: 'Rina Affiliate', role: 'AFFILIATE', phone: '+62812345605', balance: 2000000 },
      { id: 'premium-001', email: 'premium@eksporyuk.com', name: 'Dodi Premium Member', role: 'MEMBER_PREMIUM', phone: '+62812345606', balance: 1000000 },
      { id: 'free-001', email: 'free@eksporyuk.com', name: 'Andi Free Member', role: 'MEMBER_FREE', phone: '+62812345607', balance: 0 },
    ]

    const created = []

    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          password: password,
          role: userData.role as any,
          phoneNumber: userData.phone,
          Wallet: {
            create: {
              balance: userData.balance,
            }
          }
        }
      })
      created.push(user.email)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test users created successfully',
      users: created
    })

  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST to this endpoint to seed test users',
    users: [
      'founder@eksporyuk.com',
      'cofounder@eksporyuk.com',
      'admin@eksporyuk.com',
      'mentor@eksporyuk.com',
      'affiliate@eksporyuk.com',
      'premium@eksporyuk.com',
      'free@eksporyuk.com'
    ],
    password: 'password123'
  })
}
