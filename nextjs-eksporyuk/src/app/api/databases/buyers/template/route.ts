import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as XLSX from 'xlsx';

// GET /api/databases/buyers/template - Download template Excel
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Sample data for template
    const sampleData = [
      {
        'Product Name': 'Coconut (Fresh)',
        'Product Specs': 'Type: Fresh Tender Coconut\nGrade: A\nSize: Medium to Large\nPackaging: Mesh Bags',
        'Quantity': '2 Twenty-Foot Container (monthly)',
        'Shipping Terms': 'CIF',
        'Destination Port': 'Sydney, Melbourne',
        'Payment Terms': 'T/T',
        'Company Name': 'ABC Import Pty Ltd',
        'Country': 'Australia',
        'City': 'Sydney',
        'Address': '123 Import Street, Sydney NSW 2000',
        'Contact Person': 'John Smith',
        'Email': 'john@abcimport.com.au',
        'Phone': '+61 2 1234 5678',
        'Website': 'https://abcimport.com.au',
        'Business Type': 'Importer',
        'Products Interest': 'Fresh Fruits, Coconut Products',
        'Annual Import': '$5M - $10M',
        'Tags': 'premium, reliable, large-volume',
        'Notes': 'Interested in long-term partnership',
        'Verified': 'Yes'
      },
      {
        'Product Name': 'Coffee Beans (Arabica)',
        'Product Specs': 'Origin: Java\nType: Arabica\nProcess: Washed\nGrade: Specialty',
        'Quantity': '1 Container per month',
        'Shipping Terms': 'FOB',
        'Destination Port': 'Rotterdam',
        'Payment Terms': 'L/C',
        'Company Name': 'Euro Coffee Trading BV',
        'Country': 'Netherlands',
        'City': 'Amsterdam',
        'Address': 'Keizersgracht 100, 1015 CV Amsterdam',
        'Contact Person': 'Hans Mueller',
        'Email': 'hans@eurocoffee.nl',
        'Phone': '+31 20 123 4567',
        'Website': 'https://eurocoffee.nl',
        'Business Type': 'Distributor',
        'Products Interest': 'Coffee, Tea, Cocoa',
        'Annual Import': '$10M - $50M',
        'Tags': 'coffee-specialist, EU-certified',
        'Notes': 'Requires organic certification',
        'Verified': 'No'
      }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Product Name
      { wch: 50 }, // Product Specs
      { wch: 30 }, // Quantity
      { wch: 15 }, // Shipping Terms
      { wch: 25 }, // Destination Port
      { wch: 15 }, // Payment Terms
      { wch: 30 }, // Company Name
      { wch: 15 }, // Country
      { wch: 15 }, // City
      { wch: 40 }, // Address
      { wch: 20 }, // Contact Person
      { wch: 30 }, // Email
      { wch: 20 }, // Phone
      { wch: 30 }, // Website
      { wch: 15 }, // Business Type
      { wch: 35 }, // Products Interest
      { wch: 15 }, // Annual Import
      { wch: 30 }, // Tags
      { wch: 40 }, // Notes
      { wch: 10 }, // Verified
    ];
    worksheet['!cols'] = colWidths;

    // Add instructions sheet
    const instructionsData = [
      { 'Instructions': 'BUYER IMPORT TEMPLATE INSTRUCTIONS' },
      { 'Instructions': '' },
      { 'Instructions': 'REQUIRED FIELDS:' },
      { 'Instructions': '- Company Name: The name of the importing company' },
      { 'Instructions': '- Country: Destination country for the products' },
      { 'Instructions': '' },
      { 'Instructions': 'OPTIONAL FIELDS:' },
      { 'Instructions': '- Product Name: Main product the buyer wants (e.g., Coconut, Coffee, Palm Oil)' },
      { 'Instructions': '- Product Specs: Detailed specifications, grade, type, packaging requirements' },
      { 'Instructions': '- Quantity: Amount needed (e.g., 2 Twenty-Foot Container, 100 MT)' },
      { 'Instructions': '- Shipping Terms: FOB, CIF, CNF, EXW, DDP, DAP, FCA' },
      { 'Instructions': '- Destination Port: Port of delivery (e.g., Sydney, Rotterdam)' },
      { 'Instructions': '- Payment Terms: T/T, L/C, D/P, D/A, CAD, Open Account, Advance Payment' },
      { 'Instructions': '- City: City within the country' },
      { 'Instructions': '- Address: Full business address' },
      { 'Instructions': '- Contact Person: Name of contact person' },
      { 'Instructions': '- Email: Contact email address' },
      { 'Instructions': '- Phone: Contact phone number with country code' },
      { 'Instructions': '- Website: Company website URL' },
      { 'Instructions': '- Business Type: Importer, Distributor, Retailer, Manufacturer, etc.' },
      { 'Instructions': '- Products Interest: Other products the buyer might be interested in' },
      { 'Instructions': '- Annual Import: Estimated annual import value (e.g., $1M - $10M)' },
      { 'Instructions': '- Tags: Comma-separated tags for categorization' },
      { 'Instructions': '- Notes: Additional notes or remarks' },
      { 'Instructions': '- Verified: "Yes" or "No" - Whether buyer is verified' },
      { 'Instructions': '' },
      { 'Instructions': 'TIPS:' },
      { 'Instructions': '1. Delete the sample data rows before importing your data' },
      { 'Instructions': '2. Keep the header row intact' },
      { 'Instructions': '3. Ensure Country names match the system (e.g., USA, UK, UAE)' },
      { 'Instructions': '4. For Product Specs, use line breaks for multi-line content' },
      { 'Instructions': '5. Duplicate Company Names will be skipped during import' },
    ];
    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [{ wch: 80 }];

    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Buyers');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="buyer_import_template.xlsx"',
      },
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
