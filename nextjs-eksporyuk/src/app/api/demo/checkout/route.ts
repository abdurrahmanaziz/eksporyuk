import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { packageId, paymentMethod, affiliateRef, userData, couponCode } = body
    
    console.log('📦 Checkout request:', { packageId, paymentMethod, affiliateRef, couponCode })
    
    // Get package from database
    const membership = await prisma.membership.findUnique({
      where: { 
        id: packageId,
        isActive: true,
      },
    })
    
    if (!membership) {
      console.error('❌ Package not found:', packageId)
      return NextResponse.json(
        { success: false, error: 'Package tidak valid atau tidak aktif' },
        { status: 400 }
      )
    }

    console.log('✅ Package found:', membership.name, membership.price)

    // Simulasi perhitungan revenue split
    const totalAmount = Number(membership.price)
    const affiliateAmount = Math.round(totalAmount * 0.30) // 30% untuk affiliate
    const companyAmount = Math.round(totalAmount * 0.15) // 15% untuk perusahaan
    const founderCoFounderAmount = totalAmount - affiliateAmount - companyAmount
    const founderAmount = Math.round(founderCoFounderAmount * 0.60) // 60% dari sisa
    const coFounderAmount = founderCoFounderAmount - founderAmount // 40% dari sisa

    // Mock transaction record
    const transaction = {
      id: `TXN_${Date.now()}`,
      packageId: membership.id,
      packageName: membership.name,
      duration: membership.duration,
      amount: totalAmount,
      paymentMethod,
      affiliateRef,
      couponCode,
      userData,
      status: 'PENDING',
      revenueDistribution: {
        affiliate: affiliateRef ? affiliateAmount : 0,
        company: companyAmount + (affiliateRef ? 0 : affiliateAmount), // Jika tidak ada affiliate, masuk ke company
        founder: founderAmount,
        coFounder: coFounderAmount
      },
      createdAt: new Date().toISOString(),
    }

    console.log('🎯 Transaction Created:', transaction)

    return NextResponse.json({
      success: true,
      transaction,
      message: `Transaksi ${membership.name} berhasil dibuat dengan total Rp ${totalAmount.toLocaleString('id-ID')}`
    })

  } catch (error) {
    console.error('❌ Transaction error:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memproses transaksi: ' + (error as Error).message },
      { status: 500 }
    )
  }
}