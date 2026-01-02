import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

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

    // Get active manual bank accounts
    const manualBanks = await prisma.manualBankAccount.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountHolder: true
      },
      orderBy: {
        bankName: 'asc'
      }
    });

    console.log('Manual banks found:', manualBanks.length);

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