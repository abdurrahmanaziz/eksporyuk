import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Fetching manual banks...');

    // Since ManualBankAccount model doesn't exist yet,
    // return comprehensive bank and e-wallet options
    const manualBanks = [
      // Traditional Banks
      { id: 'bca', bankName: 'Bank Central Asia (BCA)', bankCode: 'BCA' },
      { id: 'bri', bankName: 'Bank Rakyat Indonesia (BRI)', bankCode: 'BRI' },
      { id: 'bni', bankName: 'Bank Negara Indonesia (BNI)', bankCode: 'BNI' },
      { id: 'btn', bankName: 'Bank Tabungan Negara (BTN)', bankCode: 'BTN' },
      { id: 'mandiri', bankName: 'Bank Mandiri', bankCode: 'MANDIRI' },
      { id: 'cimb', bankName: 'CIMB Niaga', bankCode: 'CIMB' },
      { id: 'danamon', bankName: 'Bank Danamon', bankCode: 'DANAMON' },
      { id: 'permata', bankName: 'Bank Permata', bankCode: 'PERMATA' },
      { id: 'bsi', bankName: 'Bank Syariah Indonesia (BSI)', bankCode: 'BSI' },
      { id: 'muamalat', bankName: 'Bank Muamalat', bankCode: 'MUAMALAT' },
      // E-Wallets
      { id: 'gopay', bankName: 'GoPay', bankCode: 'GOPAY' },
      { id: 'ovo', bankName: 'OVO', bankCode: 'OVO' },
      { id: 'dana', bankName: 'DANA', bankCode: 'DANA' },
      { id: 'linkaja', bankName: 'LinkAja', bankCode: 'LINKAJA' },
      { id: 'shopeepay', bankName: 'ShopeePay', bankCode: 'SHOPEEPAY' },
      { id: 'jenius', bankName: 'Jenius', bankCode: 'JENIUS' },
      { id: 'sakuku', bankName: 'Sakuku', bankCode: 'SAKUKU' },
      { id: 'tcash', bankName: 'T-Cash', bankCode: 'TCASH' },
    ];

    console.log('Manual banks returned:', manualBanks.length);

    return NextResponse.json({
      success: true,
      data: manualBanks
    });

  } catch (error: any) {
    console.error('Manual banks API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch manual banks',
        details: error.message 
      },
      { status: 500 }
    );
  }
}