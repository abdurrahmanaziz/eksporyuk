import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: {
        followUpEnabled: true,
        followUp1HourEnabled: true,
        followUp24HourEnabled: true,
        followUp48HourEnabled: true,
        followUpMessage1Hour: true,
        followUpMessage24Hour: true,
        followUpMessage48Hour: true,
      }
    });

    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          followUpEnabled: true,
          followUp1HourEnabled: true,
          followUp24HourEnabled: true,
          followUp48HourEnabled: true,
          followUpMessage1Hour: 'Halo {name}, pembayaran Anda sebesar Rp {amount} masih menunggu. Segera selesaikan dalam {timeLeft}. Link: {paymentUrl}',
          followUpMessage24Hour: 'Reminder: Pembayaran Anda akan kadaluarsa dalam {timeLeft}. Segera bayar sebelum terlambat!',
          followUpMessage48Hour: 'Last chance! Pembayaran Anda akan dibatalkan otomatis jika tidak diselesaikan dalam {timeLeft}.',
        },
        select: {
          followUpEnabled: true,
          followUp1HourEnabled: true,
          followUp24HourEnabled: true,
          followUp48HourEnabled: true,
          followUpMessage1Hour: true,
          followUpMessage24Hour: true,
          followUpMessage48Hour: true,
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching follow-up settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    const {
      followUpEnabled,
      followUp1HourEnabled,
      followUp24HourEnabled,
      followUp48HourEnabled,
      followUpMessage1Hour,
      followUpMessage24Hour,
      followUpMessage48Hour,
    } = body;

    // Upsert settings
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        followUpEnabled,
        followUp1HourEnabled,
        followUp24HourEnabled,
        followUp48HourEnabled,
        followUpMessage1Hour,
        followUpMessage24Hour,
        followUpMessage48Hour,
      },
      create: {
        id: 1,
        followUpEnabled,
        followUp1HourEnabled,
        followUp24HourEnabled,
        followUp48HourEnabled,
        followUpMessage1Hour,
        followUpMessage24Hour,
        followUpMessage48Hour,
      },
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error updating follow-up settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
