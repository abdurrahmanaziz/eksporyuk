import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/databases/buyers/export - Export buyers to Excel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const verified = searchParams.get('verified');

    // Build filter
    const where: any = {};
    if (country && country !== 'all') where.country = country;
    if (verified === 'true') where.isVerified = true;
    if (verified === 'false') where.isVerified = false;

    // Get all buyers
    const buyers = await prisma.buyer.findMany({
      where,
      orderBy: [
        { isVerified: 'desc' },
        { country: 'asc' },
        { companyName: 'asc' }
      ]
    });

    // Transform data for export
    const exportData = buyers.map(buyer => ({
      'Product Name': buyer.productName || '',
      'Product Specs': buyer.productSpecs || '',
      'Quantity': buyer.quantity || '',
      'Shipping Terms': buyer.shippingTerms || '',
      'Destination Port': buyer.destinationPort || '',
      'Payment Terms': buyer.paymentTerms || '',
      'Company Name': buyer.companyName,
      'Country': buyer.country,
      'City': buyer.city || '',
      'Address': buyer.address || '',
      'Contact Person': buyer.contactPerson || '',
      'Email': buyer.email || '',
      'Phone': buyer.phone || '',
      'Website': buyer.website || '',
      'Business Type': buyer.businessType || '',
      'Products Interest': buyer.productsInterest || '',
      'Annual Import': buyer.annualImport || '',
      'Tags': buyer.tags || '',
      'Notes': buyer.notes || '',
      'Verified': buyer.isVerified ? 'Yes' : 'No',
      'Rating': buyer.rating || 0,
      'Total Deals': buyer.totalDeals || 0,
      'View Count': buyer.viewCount || 0,
      'Like Count': buyer.likeCount || 0,
      'Created At': buyer.createdAt ? new Date(buyer.createdAt).toISOString().split('T')[0] : ''
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Product Name
      { wch: 40 }, // Product Specs
      { wch: 15 }, // Quantity
      { wch: 15 }, // Shipping Terms
      { wch: 20 }, // Destination Port
      { wch: 15 }, // Payment Terms
      { wch: 30 }, // Company Name
      { wch: 15 }, // Country
      { wch: 15 }, // City
      { wch: 40 }, // Address
      { wch: 20 }, // Contact Person
      { wch: 30 }, // Email
      { wch: 18 }, // Phone
      { wch: 30 }, // Website
      { wch: 15 }, // Business Type
      { wch: 40 }, // Products Interest
      { wch: 15 }, // Annual Import
      { wch: 25 }, // Tags
      { wch: 40 }, // Notes
      { wch: 10 }, // Verified
      { wch: 10 }, // Rating
      { wch: 12 }, // Total Deals
      { wch: 12 }, // View Count
      { wch: 12 }, // Like Count
      { wch: 12 }, // Created At
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Buyers');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as file download
    const filename = `buyers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting buyers:', error);
    return NextResponse.json({ error: 'Failed to export buyers' }, { status: 500 });
  }
}
