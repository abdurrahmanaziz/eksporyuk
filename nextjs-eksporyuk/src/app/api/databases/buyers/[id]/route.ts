import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
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

    // No quota restrictions - all users have unlimited access
    // Track view for analytics only (not for quota limiting)
    await prisma.buyerView.create({
      data: {
        userId: session.user.id,
        buyerId: id
      }
    }).catch(() => {
      // Silently fail if view tracking fails
      console.log('View tracking failed for buyer', id)
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const viewsThisMonth = await prisma.buyerView.count({
      where: {
        userId: session.user.id,
        viewedAt: { gte: startOfMonth }
      }
    });

    return NextResponse.json({
      buyer,
      quota: {
        used: viewsThisMonth,
        total: 999999, // Unlimited
        remaining: 999999
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
