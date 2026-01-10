import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { sendBrandedEmail } from '@/lib/email-template-helper'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { to, templateSlug } = body

    if (!to || !templateSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: to, templateSlug' },
        { status: 400 }
      )
    }

    // Test data untuk preview
    const testVariables: Record<string, any> = {
      userName: 'John Doe (Test User)',
      userEmail: to,
      appName: 'EksporYuk',
      dashboardUrl: process.env.NEXTAUTH_URL + '/dashboard',
      
      // Membership
      membershipName: 'Premium Lifetime',
      expiryDate: '31 Desember 2025',
      invoiceNumber: 'INV-TEST-12345',
      amount: 'Rp 1.500.000',
      
      // Course
      courseName: 'Ekspor untuk Pemula',
      instructorName: 'Budi Santoso',
      certificateUrl: process.env.NEXTAUTH_URL + '/certificates/test',
      
      // Newsletter
      monthYear: 'Desember 2024',
      monthlyHighlights: '• Fitur branded templates sudah live\n• Logo email sudah tampil dengan sempurna\n• HTML wrapper otomatis applied',
      newCourses: '• Kursus Ekspor 101 - Dasar ekspor untuk UMKM\n• Kursus Digital Marketing untuk Produk Ekspor',
      exportTips: 'Selalu gunakan email profesional saat berkomunikasi dengan buyer internasional. Template branded membantu membangun trust dan kredibilitas.',
      successStory: 'Salah satu member kami, Ibu Sarah dari Bandung, berhasil ekspor kerajinan tangan ke 10 negara di Eropa dan Amerika!',
      upcomingEvents: '• Webinar "Strategi Ekspor 2025" - 30 Desember 2024\n• Workshop "Marketing untuk Eksportir" - 5 Januari 2025',
      specialAnnouncement: '🎉 PROMO AKHIR TAHUN - Diskon 50% untuk semua paket membership! Berlaku sampai 31 Desember 2024.',
      
      // Affiliate
      affiliateCode: 'TEST123',
      commissionRate: '30%',
      commissionAmount: 'Rp 450.000',
      
      // General
      transactionDate: new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    }

    // Send email
    await sendBrandedEmail(to, templateSlug, testVariables)

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to} using template "${templateSlug}"`,
      note: 'Check your email inbox (including spam folder) in a few moments'
    })

  } catch (error: any) {
    console.error('[TEST_EMAIL] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
