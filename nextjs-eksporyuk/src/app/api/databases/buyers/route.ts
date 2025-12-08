import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/databases/buyers - List buyers with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const businessType = searchParams.get('businessType');
    const search = searchParams.get('search');
    const verified = searchParams.get('verified');
    const productName = searchParams.get('productName');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (country) where.country = country;
    if (businessType) where.businessType = businessType;
    if (verified === 'true') where.isVerified = true;
    if (verified === 'false') where.isVerified = false;
    if (productName) where.productName = { contains: productName };
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
        { productsInterest: { contains: search } },
        { productName: { contains: search } },
        { tags: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Get buyers
    const [buyers, total] = await Promise.all([
      prisma.buyer.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isVerified: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          addedByUser: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.buyer.count({ where })
    ]);

    // Admin gets unlimited access
    let quota = 5; // FREE default
    let viewsThisMonth = 0;

    if (session.user.role === 'ADMIN') {
      // Admin has unlimited quota
      quota = 999999;
      viewsThisMonth = 0;
    } else {
      // Check user's quota for non-admin
      const userMembership = await prisma.userMembership.findFirst({
        where: {
          userId: session.user.id,
          status: 'ACTIVE',
          isActive: true
        },
        include: {
          membership: true
        }
      });

      // Count views this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      viewsThisMonth = await prisma.buyerView.count({
        where: {
          userId: session.user.id,
          viewedAt: { gte: startOfMonth }
        }
      });

      // Determine quota based on membership
      if (userMembership?.membership) {
        const duration = userMembership.membership.duration;
        if (duration === 'LIFETIME' || duration === 'TWELVE_MONTHS') quota = 999999; // Unlimited
        else if (duration === 'SIX_MONTHS') quota = 100;
        else if (duration === 'THREE_MONTHS') quota = 50;
        else if (duration === 'ONE_MONTH') quota = 20;
      }
    }

    return NextResponse.json({
      buyers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      quota: {
        used: viewsThisMonth,
        total: quota,
        remaining: Math.max(0, quota - viewsThisMonth)
      }
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/databases/buyers - Create buyer (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      // Product Request
      productName,
      productSpecs,
      quantity,
      shippingTerms,
      destinationPort,
      paymentTerms,
      // Company
      companyName,
      country,
      city,
      address,
      // Contact
      contactPerson,
      email,
      phone,
      website,
      // Business
      businessType,
      productsInterest,
      annualImport,
      // Meta
      tags,
      notes,
      isVerified
    } = body;

    // Validation
    if (!companyName || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, country' },
        { status: 400 }
      );
    }

    const buyer = await prisma.buyer.create({
      data: {
        // Product Request
        productName: productName || null,
        productSpecs: productSpecs || null,
        quantity: quantity || null,
        shippingTerms: shippingTerms || null,
        destinationPort: destinationPort || null,
        paymentTerms: paymentTerms || null,
        // Company
        companyName,
        country,
        city: city || null,
        address: address || null,
        // Contact
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        // Business
        businessType: businessType || null,
        productsInterest: productsInterest || null,
        annualImport: annualImport || null,
        // Meta
        tags: tags || null,
        notes: notes || null,
        isVerified: isVerified || false,
        rating: 0,
        totalDeals: 0,
        addedBy: session.user.id
      }
    });

    return NextResponse.json(buyer, { status: 201 });
  } catch (error) {
    console.error('Error creating buyer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
