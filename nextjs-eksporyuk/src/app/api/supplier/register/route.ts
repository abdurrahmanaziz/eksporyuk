import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/supplier/register - Register as supplier
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      )
    }

    // Check if user already has supplier profile
    const existingProfile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'You already have a supplier profile' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    
    // Extract form fields
    const companyName = formData.get('companyName') as string
    const slug = formData.get('slug') as string
    const bio = formData.get('bio') as string
    const businessCategory = formData.get('businessCategory') as string
    const province = formData.get('province') as string
    const city = formData.get('city') as string
    const address = formData.get('address') as string
    const contactPerson = formData.get('contactPerson') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const whatsapp = formData.get('whatsapp') as string
    const website = formData.get('website') as string
    const packageId = formData.get('packageId') as string

    // Files
    const logoFile = formData.get('logo') as File | null
    const bannerFile = formData.get('banner') as File | null
    const legalityFile = formData.get('legalityDoc') as File | null
    const nibFile = formData.get('nibDoc') as File | null

    // Validation
    if (!companyName || !slug || !province || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, slug, province, city' },
        { status: 400 }
      )
    }

    // Check if slug is unique
    const slugExists = await prisma.supplierProfile.findUnique({
      where: { slug },
    })

    if (slugExists) {
      return NextResponse.json(
        { error: 'Slug already taken. Please choose another.' },
        { status: 400 }
      )
    }

    // Get package (default to FREE if not specified)
    let selectedPackage
    if (packageId) {
      selectedPackage = await prisma.supplierPackage.findUnique({
        where: { id: packageId },
      })
    } else {
      selectedPackage = await prisma.supplierPackage.findFirst({
        where: { type: 'FREE' },
      })
    }

    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      )
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'suppliers')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Handle file uploads
    let logoPath: string | null = null
    let bannerPath: string | null = null
    let legalityPath: string | null = null
    let nibPath: string | null = null

    const timestamp = Date.now()

    if (logoFile) {
      const buffer = Buffer.from(await logoFile.arrayBuffer())
      const filename = `logo-${timestamp}-${logoFile.name}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      logoPath = `/uploads/suppliers/${filename}`
    }

    if (bannerFile) {
      const buffer = Buffer.from(await bannerFile.arrayBuffer())
      const filename = `banner-${timestamp}-${bannerFile.name}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      bannerPath = `/uploads/suppliers/${filename}`
    }

    if (legalityFile) {
      const buffer = Buffer.from(await legalityFile.arrayBuffer())
      const filename = `legality-${timestamp}-${legalityFile.name}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      legalityPath = `/uploads/suppliers/${filename}`
    }

    if (nibFile) {
      const buffer = Buffer.from(await nibFile.arrayBuffer())
      const filename = `nib-${timestamp}-${nibFile.name}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)
      nibPath = `/uploads/suppliers/${filename}`
    }

    // Create supplier profile and membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create supplier profile
      const profile = await tx.supplierProfile.create({
        data: {
          userId: session.user.id,
          companyName,
          slug,
          logo: logoPath,
          banner: bannerPath,
          bio,
          businessCategory,
          province,
          city,
          address,
          contactPerson,
          email,
          phone,
          whatsapp,
          website,
          legalityDoc: legalityPath,
          nibDoc: nibPath,
        },
      })

      // Only create membership if FREE package
      let membership = null
      if (selectedPackage.price === 0 || selectedPackage.type === 'FREE') {
        membership = await tx.supplierMembership.create({
          data: {
            userId: session.user.id,
            packageId: selectedPackage.id,
            startDate: new Date(),
            endDate: selectedPackage.duration === 'LIFETIME' ? null : 
                     selectedPackage.duration === 'MONTHLY' ? 
                     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) :
                     new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true,
            price: selectedPackage.price,
          },
        })
      }

      return { profile, membership }
    })

    // If PREMIUM package, create transaction and return payment URL
    if (selectedPackage.price > 0) {
      console.log('[SUPPLIER_REGISTER] Creating transaction for premium package:', selectedPackage.name)
      
      const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
      const invoiceNumber = await getNextInvoiceNumber()

      const transaction = await prisma.transaction.create({
        data: {
          userId: session.user.id,
          amount: selectedPackage.price,
          type: 'SUPPLIER_MEMBERSHIP' as any,
          status: 'PENDING',
          invoiceNumber,
          description: `Supplier Membership: ${selectedPackage.name}`,
          externalId: `SUPP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          customerName: session.user.name || companyName,
          customerEmail: session.user.email || email,
          customerPhone: phone || '',
          customerWhatsapp: whatsapp || phone || '',
          metadata: {
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            packageType: selectedPackage.type,
            companyName: companyName,
          }
        }
      })

      console.log('[SUPPLIER_REGISTER] Transaction created:', transaction.id)

      // Get payment settings from database
      const settings = await prisma.settings.findFirst()
      const expiryHours = settings?.paymentExpiryHours || 72
      console.log('[SUPPLIER_REGISTER] Payment expiry hours:', expiryHours)

      // Create Xendit invoice
      try {
        const { xenditService } = await import('@/lib/xendit')
        console.log('[SUPPLIER_REGISTER] Creating Xendit invoice...')
        
        const xenditResult = await xenditService.createInvoice({
          external_id: transaction.id,
          payer_email: session.user.email || email,
          description: `Supplier Membership: ${selectedPackage.name}`,
          amount: Number(selectedPackage.price),
          currency: 'IDR',
          invoice_duration: expiryHours * 3600,
          customer: {
            given_names: session.user.name || companyName,
            email: session.user.email || email,
            mobile_number: phone || '',
          },
        })

        console.log('[SUPPLIER_REGISTER] Xendit result:', xenditResult?.id)

        if (xenditResult && xenditResult.id) {
          const invoiceUrl = (xenditResult as any).invoice_url || (xenditResult as any).invoiceUrl
          
          // Update transaction with Xendit reference
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              reference: xenditResult.id,
              paymentUrl: invoiceUrl,
            }
          })

          console.log('[SUPPLIER_REGISTER] Payment URL:', invoiceUrl)

          return NextResponse.json({
            success: true,
            requiresPayment: true,
            paymentUrl: invoiceUrl,
            transactionId: transaction.id,
            message: 'Profile created. Please complete payment to activate membership.',
          })
        } else {
          console.error('[SUPPLIER_REGISTER] Xendit result invalid:', xenditResult)
          throw new Error('Xendit invoice creation returned invalid result')
        }
      } catch (xenditError: any) {
        console.error('[SUPPLIER_REGISTER] Xendit error:', xenditError)
        
        // Delete transaction if Xendit fails
        await prisma.transaction.delete({ where: { id: transaction.id } })
        
        return NextResponse.json({
          success: false,
          error: 'Failed to create payment invoice: ' + xenditError.message,
        }, { status: 500 })
      }
    }

    // FREE package - return success
    // Send welcome email for FREE supplier
    try {
      const { sendSupplierWelcomeEmail } = await import('@/lib/email/supplier-email')
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      await sendSupplierWelcomeEmail({
        email: session.user.email!,
        name: session.user.name || companyName,
        companyName: companyName,
        packageName: selectedPackage.name,
        packageTier: selectedPackage.type as 'FREE' | 'PREMIUM' | 'ENTERPRISE',
        dashboardUrl: `${appUrl}/supplier/dashboard`
      })
      console.log('[SUPPLIER_REGISTER] Welcome email sent for FREE supplier')
    } catch (emailError) {
      console.error('[SUPPLIER_REGISTER] Error sending welcome email:', emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      requiresPayment: false,
      data: result,
      message: 'Supplier registration successful! Welcome to EksporYuk.',
    })
  } catch (error) {
    console.error('[SUPPLIER_REGISTER]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
