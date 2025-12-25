import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/mentor/supplier-reviews/[supplierId]/recommend - Recommend supplier (MENTOR only)
export async function POST(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is MENTOR
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    })

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Forbidden. Only MENTOR can recommend suppliers.' },
        { status: 403 }
      )
    }

    const supplierId = params.supplierId

    // Get supplier profile
    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: supplierId },
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check if supplier is in WAITING_REVIEW status
    if (supplier.status !== 'WAITING_REVIEW') {
      return NextResponse.json(
        { 
          error: 'Supplier is not waiting for review',
          currentStatus: supplier.status 
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { notes, assessmentScore } = body

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update supplier profile
      const updatedSupplier = await tx.supplierProfile.update({
        where: { id: supplierId },
        data: {
          status: 'RECOMMENDED_BY_MENTOR',
          mentorReviewedBy: session.user.id,
          mentorReviewedAt: new Date(),
          mentorNotes: notes || null,
        },
      })

      // Update assessment if score provided
      if (assessmentScore !== undefined && supplier.assessments[0]) {
        await tx.supplierAssessment.update({
          where: { id: supplier.assessments[0].id },
          data: {
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            reviewNotes: notes || null,
            ...(assessmentScore !== null && { 
              totalScore: assessmentScore,
              percentage: (assessmentScore / supplier.assessments[0].maxScore) * 100
            }),
          },
        })
      }

      // Create audit log
      await tx.supplierAuditLog.create({
        data: {
          supplierId,
          userId: session.user.id,
          action: 'MENTOR_REVIEW_RECOMMENDED',
          notes: notes || `Recommended by ${user.name}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return updatedSupplier
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Supplier has been recommended for admin approval',
    })
  } catch (error) {
    console.error('[MENTOR_RECOMMEND_SUPPLIER]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/mentor/supplier-reviews/[supplierId]/reject - Reject/Request revision (MENTOR only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is MENTOR
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    })

    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json(
        { error: 'Forbidden. Only MENTOR can review suppliers.' },
        { status: 403 }
      )
    }

    const supplierId = params.supplierId

    // Get supplier profile
    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: supplierId },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    if (supplier.status !== 'WAITING_REVIEW') {
      return NextResponse.json(
        { 
          error: 'Supplier is not waiting for review',
          currentStatus: supplier.status 
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { notes } = body

    if (!notes) {
      return NextResponse.json(
        { error: 'Please provide notes for revision request' },
        { status: 400 }
      )
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Return to ONBOARDING status for revision
      const updatedSupplier = await tx.supplierProfile.update({
        where: { id: supplierId },
        data: {
          status: 'ONBOARDING',
          mentorReviewedBy: session.user.id,
          mentorReviewedAt: new Date(),
          mentorNotes: notes,
        },
      })

      // Create audit log
      await tx.supplierAuditLog.create({
        data: {
          supplierId,
          userId: session.user.id,
          action: 'MENTOR_REVIEW_REVISION_REQUESTED',
          notes: notes,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return updatedSupplier
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Supplier has been sent back for revision',
    })
  } catch (error) {
    console.error('[MENTOR_REQUEST_REVISION]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
