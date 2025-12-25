import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/databases/suppliers/[id] - Get supplier details
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

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // No quota restrictions - all users have unlimited access
    // Track view for analytics only (not for quota limiting)
    await prisma.supplierView.create({
      data: {
        userId: session.user.id,
        supplierId: id
      }
    }).catch(() => {
      // Silently fail if view tracking fails
      console.log('View tracking failed for supplier', id)
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const viewsThisMonth = await prisma.supplierView.count({
      where: {
        userId: session.user.id,
        viewedAt: { gte: startOfMonth }
      }
    });

    return NextResponse.json({
      supplier,
      quota: {
        used: viewsThisMonth,
        total: 999999, // Unlimited
        remaining: 999999
      }
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/databases/suppliers/[id] - Update supplier (Admin only)
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
      companyName,
      province,
      city,
      address,
      contactPerson,
      email,
      phone,
      whatsapp,
      website,
      businessType,
      products,
      capacity,
      certifications,
      tags,
      notes,
      isVerified,
      rating
    } = body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        companyName,
        province,
        city,
        address: address || null,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        website: website || null,
        businessType: businessType || null,
        products,
        capacity: capacity || null,
        certifications: certifications || null,
        tags: tags || null,
        notes: notes || null,
        isVerified,
        rating
      }
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/databases/suppliers/[id] - Delete supplier (Admin only)
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

    await prisma.supplier.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
