import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'

// GET - Fetch all users with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('[Admin Users API] Session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    })
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role from session first (faster), then verify from DB
    if (session.user.role !== 'ADMIN') {
      // Double check from database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      
      console.log('[Admin Users API] DB role check:', {
        sessionRole: session.user.role,
        dbRole: user?.role
      })
      
      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'ALL';
    const membershipStatus = searchParams.get('membershipStatus') || 'ALL';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search by name or email
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Filter by role
    if (role !== 'ALL') {
      where.role = role;
    }

    // Get users with membership info
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        userMemberships: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            membership: {
              select: {
                name: true,
                duration: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        wallet: {
          select: { balance: true },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Filter by membership status
    let filteredUsers: any = users;
    if (membershipStatus === 'ACTIVE') {
      filteredUsers = users.filter((user: any) => user.userMemberships.length > 0);
    } else if (membershipStatus === 'NONE') {
      filteredUsers = users.filter((user: any) => user.userMemberships.length === 0);
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get stats
    const [totalUsers, adminCount, mentorCount, affiliateCount, premiumCount, freeCount, activeMemberships] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MENTOR' } }),
      prisma.user.count({ where: { role: 'AFFILIATE' } }),
      prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } }),
      prisma.user.count({ where: { role: 'MEMBER_FREE' } }),
      prisma.userMembership.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Format response
    const formattedUsers = filteredUsers.map((user: any) => {
      const activeMembership = user.userMemberships[0];
      let membershipInfo = null;

      if (activeMembership) {
        const endDate = new Date(activeMembership.endDate);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        membershipInfo = {
          name: activeMembership.membership.name,
          duration: activeMembership.membership.duration,
          startDate: activeMembership.startDate,
          endDate: activeMembership.endDate,
          daysRemaining,
          isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
        };
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
        membership: membershipInfo,
        wallet: user.wallet,
        stats: {
          transactions: user._count.transactions,
        },
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: membershipStatus !== 'ALL' ? filteredUsers.length : total,
        totalPages: Math.ceil((membershipStatus !== 'ALL' ? filteredUsers.length : total) / limit),
      },
      stats: {
        total: totalUsers,
        byRole: {
          admin: adminCount,
          mentor: mentorCount,
          affiliate: affiliateCount,
          memberPremium: premiumCount,
          memberFree: freeCount,
        },
        activeMemberships,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, isActive, password } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password if provided, otherwise generate random one
    const finalPassword = password || Math.random().toString(36).substring(2, 12)
    const hashedPassword = await bcryptjs.hash(finalPassword, 10)

    // Validate role
    const validRoles = ['ADMIN', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE']
    const userRole = role && validRoles.includes(role) ? role : 'MEMBER_FREE'

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    // Create wallet
    await prisma.wallet.create({
      data: {
        userId: newUser.id,
        balance: 0,
      },
    })

    return NextResponse.json({ 
      user: newUser,
      message: 'User berhasil dibuat',
      generatedPassword: password ? undefined : finalPassword 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
