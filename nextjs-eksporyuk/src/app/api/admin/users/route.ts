import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'
import { getNextMemberCode } from '@/lib/member-code'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    // Search by name or email or memberCode
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { memberCode: { contains: search.toUpperCase(), mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (role !== 'ALL') {
      where.role = role;
    }

    // Get users with explicit select - no relations (schema doesn't have them)
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        memberCode: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      },
    });

    // Get user IDs for manual lookups
    const userIds = users.map(u => u.id);

    // Get active memberships manually
    const userMemberships = await prisma.userMembership.findMany({
      where: {
        userId: { in: userIds },
        status: 'ACTIVE',
      },
      select: {
        userId: true,
        membershipId: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'desc' },
    });
    
    // Get membership details
    const membershipIds = [...new Set(userMemberships.map(um => um.membershipId))];
    const memberships = await prisma.membership.findMany({
      where: { id: { in: membershipIds } },
      select: { id: true, name: true, duration: true },
    });
    const membershipMap = new Map(memberships.map(m => [m.id, m]));

    // Get wallets manually
    const wallets = await prisma.wallet.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, balance: true },
    });
    const walletMap = new Map(wallets.map(w => [w.userId, w]));

    // Get transaction counts manually
    const txCounts = await prisma.transaction.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: true,
    });
    const txCountMap = new Map(txCounts.map(t => [t.userId, t._count]));

    // Group memberships by user
    const userMembershipMap = new Map<string, typeof userMemberships[0]>();
    for (const um of userMemberships) {
      // Only keep the first (most recent) membership per user
      if (!userMembershipMap.has(um.userId)) {
        userMembershipMap.set(um.userId, um);
      }
    }

    // Combine data
    const usersWithDetails = users.map(user => {
      const userMembership = userMembershipMap.get(user.id);
      const wallet = walletMap.get(user.id);
      const txCount = txCountMap.get(user.id) || 0;
      
      return {
        ...user,
        userMemberships: userMembership ? [{
          ...userMembership,
          membership: membershipMap.get(userMembership.membershipId) || null
        }] : [],
        wallet: wallet || null,
        _count: { transactions: txCount }
      };
    });

    // Filter by membership status
    let filteredUsers: any = usersWithDetails;
    if (membershipStatus === 'ACTIVE') {
      filteredUsers = usersWithDetails.filter((user: any) => user.userMemberships.length > 0);
    } else if (membershipStatus === 'NONE') {
      filteredUsers = usersWithDetails.filter((user: any) => user.userMemberships.length === 0);
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get stats - use raw queries to avoid enum type mismatch issues
    const statsResult = await prisma.$queryRaw<Array<{role: string, count: bigint}>>`
      SELECT role::text, COUNT(*) as count 
      FROM "User" 
      GROUP BY role
    `;
    
    const roleStats: Record<string, number> = {};
    for (const row of statsResult) {
      roleStats[row.role] = Number(row.count);
    }

    const totalUsers = Object.values(roleStats).reduce((a, b) => a + b, 0);
    const adminCount = roleStats['ADMIN'] || 0;
    const mentorCount = roleStats['MENTOR'] || 0;
    const affiliateCount = roleStats['AFFILIATE'] || 0;
    const premiumCount = roleStats['MEMBER_PREMIUM'] || 0;
    const freeCount = roleStats['MEMBER_FREE'] || 0;
    const supplierCount = roleStats['SUPPLIER'] || 0;
    
    const activeMemberships = await prisma.userMembership.count({ where: { status: 'ACTIVE' } });

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
        memberCode: user.memberCode,
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
          supplier: supplierCount,
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

    // Generate member code
    const memberCode = await getNextMemberCode()

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        isActive: isActive !== undefined ? isActive : true,
        memberCode,
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
