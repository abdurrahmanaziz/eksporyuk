import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single optin form (public) - can use slug or ID
export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    // Try to find by slug first, then by ID
    let optinForm = await prisma.affiliateOptinForm.findFirst({
      where: {
        OR: [
          { slug: formId },
          { id: formId }
        ]
      },
      include: {
        _count: {
          select: { leads: true }
        }
      }
    })

    if (!optinForm) {
      return NextResponse.json(
        { message: 'Optin form tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ optinForm })
  } catch (error) {
    console.error('Error fetching optin form:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil data optin form' },
      { status: 500 }
    )
  }
}

// PUT - Update optin form
export async function PUT(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params
    const body = await request.json()

    const {
      slug,
      formName,
      headline,
      description,
      submitButtonText,
      successMessage,
      redirectType,
      redirectUrl,
      redirectWhatsapp,
      collectName,
      collectEmail,
      collectPhone,
      isActive
    } = body

    const updateData: any = {
      formName,
      headline,
      description,
      submitButtonText,
      successMessage,
      redirectType,
      redirectUrl: redirectUrl || null,
      redirectWhatsapp: redirectWhatsapp || null,
      collectName,
      collectEmail,
      collectPhone,
      isActive
    }

    if (slug) updateData.slug = slug

    const optinForm = await prisma.affiliateOptinForm.update({
      where: { id: formId },
      data: updateData
    })

    return NextResponse.json({ optinForm })
  } catch (error) {
    console.error('Error updating optin form:', error)
    return NextResponse.json(
      { message: 'Gagal update optin form' },
      { status: 500 }
    )
  }
}

// DELETE optin form
export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params

    await prisma.affiliateOptinForm.delete({
      where: { id: formId }
    })

    return NextResponse.json({ message: 'Optin form berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting optin form:', error)
    return NextResponse.json(
      { message: 'Gagal menghapus optin form' },
      { status: 500 }
    )
  }
}
