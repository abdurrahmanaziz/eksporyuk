import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

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
        whatsappNumber: true,
        paymentExpiryHours: true,
        paymentBankAccounts: true,
        paymentEnableManual: true,
        paymentMinAmount: true,
        paymentMaxAmount: true
      }
    });

    console.log('[Payment Settings API] Settings found:', !!settings);

    return NextResponse.json({
      success: true,
      data: {
        customerServiceWhatsApp: settings?.whatsappNumber || '',
        paymentExpiryHours: settings?.paymentExpiryHours || 24,
        bankAccounts: settings?.paymentBankAccounts || [],
        enableManualPayment: settings?.paymentEnableManual || true,
        minAmount: settings?.paymentMinAmount || 10000,
        maxAmount: settings?.paymentMaxAmount || 100000000
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