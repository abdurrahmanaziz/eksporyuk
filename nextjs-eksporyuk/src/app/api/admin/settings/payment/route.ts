import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    console.log('[Payment Settings API] Fetching payment settings...');

    // Get settings from database
    const settings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: {
        customerServiceWhatsApp: true,
        paymentExpiryHours: true,
        adminBankAccount: true,
        paymentInstructions: true
      }
    });

    console.log('[Payment Settings API] Settings found:', !!settings);

    return NextResponse.json({
      success: true,
      data: {
        customerServiceWhatsApp: settings?.customerServiceWhatsApp || '',
        paymentExpiryHours: settings?.paymentExpiryHours || 24,
        adminBankAccount: settings?.adminBankAccount || '',
        paymentInstructions: settings?.paymentInstructions || ''
      }
    });

  } catch (error: any) {
    console.error('[Payment Settings API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment settings',
        details: error.message 
      },
      { status: 500 }
    );
  }
}