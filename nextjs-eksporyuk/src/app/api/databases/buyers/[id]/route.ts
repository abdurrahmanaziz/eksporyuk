import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/databases/buyers/[id] - Get buyer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const buyer = await prisma.buyer.findUnique({
      where: { id }
    });

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Admin gets unlimited access without quota check
    let quota = 5; // FREE default
    let viewsThisMonth = 0;

    if (session.user.role === 'ADMIN') {
      // Admin has unlimited quota, no tracking needed
      quota = 999999;
      viewsThisMonth = 0;
    } else {
      // Check quota for non-admin users
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

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      viewsThisMonth = await prisma.buyerView.count({
        where: {
          userId: session.user.id,
          viewedAt: { gte: startOfMonth }
        }
      });

      if (userMembership?.membership) {
        const duration = userMembership.membership.duration;
        if (duration === 'LIFETIME' || duration === 'TWELVE_MONTHS') quota = 999999;
        else if (duration === 'SIX_MONTHS') quota = 100;
        else if (duration === 'THREE_MONTHS') quota = 50;
        else if (duration === 'ONE_MONTH') quota = 20;
      }

      // Check if quota exceeded
      if (viewsThisMonth >= quota) {
        return NextResponse.json({
          error: 'Quota exceeded',
          message: 'You have reached your monthly view limit. Upgrade your membership for more access.',
          quota: {
            used: viewsThisMonth,
            total: quota,
            remaining: 0
          }
        }, { status: 403 });
      }

      // Track view for non-admin only
      await prisma.buyerView.create({
        data: {
          userId: session.user.id,
          buyerId: id
        }
      });
    }

    return NextResponse.json({
      buyer,
      quota: {
        used: viewsThisMonth + 1,
        total: quota,
        remaining: quota - viewsThisMonth - 1
      }
    });
  } catch (error) {
    console.error('Error fetching buyer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/databases/buyers/[id] - Update buyer (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
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
      isVerified,
      rating
    } = body;

    const buyer = await prisma.buyer.update({
      where: { id },
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
        isVerified,
        rating
      }
    });

    return NextResponse.json(buyer);
  } catch (error) {
    console.error('Error updating buyer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/databases/buyers/[id] - Delete buyer (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.buyer.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
