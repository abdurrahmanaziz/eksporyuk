import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// POST /api/databases/buyers/import - Import buyers from Excel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json({ error: 'File is empty or invalid format' }, { status: 400 });
    }

    // Validate and transform data
    const errors: string[] = [];
    const buyers: any[] = [];

    jsonData.forEach((row: any, index: number) => {
      const rowNum = index + 2; // Account for header row

      // Required fields check
      if (!row['Company Name'] || !row['Country']) {
        errors.push(`Row ${rowNum}: Missing required fields (Company Name or Country)`);
        return;
      }

      buyers.push({
        // Product Request
        productName: row['Product Name'] || row['Product'] || null,
        productSpecs: row['Product Specs'] || row['Specifications'] || null,
        quantity: row['Quantity'] || row['Qty'] || null,
        shippingTerms: row['Shipping Terms'] || row['Incoterms'] || null,
        destinationPort: row['Destination Port'] || row['Port'] || null,
        paymentTerms: row['Payment Terms'] || row['Payment'] || null,
        // Company
        companyName: row['Company Name'] || row['Company'],
        country: row['Country'],
        city: row['City'] || null,
        address: row['Address'] || null,
        // Contact
        contactPerson: row['Contact Person'] || row['Contact'] || null,
        email: row['Email'] || null,
        phone: row['Phone'] || row['Telephone'] || null,
        website: row['Website'] || row['Web'] || null,
        // Business
        businessType: row['Business Type'] || row['Type'] || null,
        productsInterest: row['Products Interest'] || row['Products of Interest'] || null,
        annualImport: row['Annual Import'] || row['Import Volume'] || null,
        // Meta
        tags: row['Tags'] || null,
        notes: row['Notes'] || row['Remarks'] || null,
        isVerified: row['Verified'] === 'Yes' || row['Verified'] === 'TRUE' || row['Verified'] === true || false,
        rating: parseFloat(row['Rating']) || 0,
        totalDeals: parseInt(row['Total Deals']) || 0,
        addedBy: session.user.id
      });
    });

    if (errors.length > 0 && buyers.length === 0) {
      return NextResponse.json({ 
        error: 'All rows have errors', 
        details: errors.slice(0, 10) // Limit error messages
      }, { status: 400 });
    }

    // Batch create buyers
    const created = await prisma.buyer.createMany({
      data: buyers,
      skipDuplicates: true
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${created.count} buyers`,
      imported: created.count,
      total: jsonData.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined
    });

  } catch (error) {
    console.error('Error importing buyers:', error);
    return NextResponse.json({ error: 'Failed to import buyers' }, { status: 500 });
  }
}
