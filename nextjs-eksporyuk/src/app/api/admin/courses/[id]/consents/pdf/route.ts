import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/courses/[id]/consents/pdf
 * Generate PDF document of consent records (admin only)
 * Returns JSON data that can be used by frontend PDF library
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const courseId = resolvedParams.id

    // Get course info
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        mentorId: true
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get mentor info separately (no direct relation)
    // Course.mentorId points to MentorProfile.id
    let mentorName = '-'
    if (course.mentorId) {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { id: course.mentorId }
      })
      if (mentorProfile) {
        const mentorUser = await prisma.user.findUnique({
          where: { id: mentorProfile.userId },
          select: { name: true }
        })
        mentorName = mentorUser?.name || '-'
      }
    }

    // Get all consents for this course (no relation to user in schema)
    const consents = await prisma.courseConsent.findMany({
      where: { courseId },
      orderBy: { agreedAt: 'asc' }
    })

    // Fetch all users for these consents
    const userIds = consents.map(c => c.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        memberCode: true,
        name: true,
        email: true,
        phone: true,
        whatsapp: true
      }
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    // Format data for PDF generation
    const pdfData = {
      title: 'DAFTAR PERSETUJUAN HAK CIPTA',
      subtitle: `Kelas: ${course.title}`,
      mentor: mentorName,
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.name || session.user.email,
      totalConsents: consents.length,
      consents: consents.map((consent, index) => {
        const user = userMap.get(consent.userId)
        return {
          no: index + 1,
          memberCode: user?.memberCode || '-',
          name: user?.name || '-',
          email: user?.email || '-',
          phone: user?.phone || user?.whatsapp || '-',
          agreedAt: consent.agreedAt.toISOString(),
          ipAddress: consent.ipAddress || '-'
        }
      }),
      legalNotice: `Dokumen ini merupakan bukti elektronik persetujuan peserta terhadap ketentuan Hak Cipta berdasarkan UU No. 28 Tahun 2014 tentang Hak Cipta dan UU No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016 tentang ITE.`,
      consentText: consents[0]?.consentText || ''
    }

    return NextResponse.json({
      success: true,
      pdfData
    })
  } catch (error) {
    console.error('Error generating consent PDF data:', error)
    return NextResponse.json(
      { error: 'Gagal menghasilkan data PDF' },
      { status: 500 }
    )
  }
}
