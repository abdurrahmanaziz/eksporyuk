import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { uploadFile } from '@/lib/upload-helper'

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
    
    // ===== BASIC INFO (Existing) =====
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

    // ===== NEW FIELDS FROM PRD =====
    // Supplier Type (REQUIRED for new flow)
    const supplierType = formData.get('supplierType') as string | null
    
    // Tab 1: Identitas Usaha
    const legalEntityType = formData.get('legalEntityType') as string | null
    const businessField = formData.get('businessField') as string | null
    const mainProducts = formData.get('mainProducts') as string | null
    const establishedYear = formData.get('establishedYear') as string | null
    
    // Tab 2: Alamat & Lokasi
    const district = formData.get('district') as string | null
    const postalCode = formData.get('postalCode') as string | null
    const productionLocation = formData.get('productionLocation') as string | null
    
    // Tab 3: Kontak Perusahaan
    const picPosition = formData.get('picPosition') as string | null
    const businessEmail = formData.get('businessEmail') as string | null
    
    // Tab 4: Legalitas
    const nibNumber = formData.get('nibNumber') as string | null
    const npwpNumber = formData.get('npwpNumber') as string | null
    const siupNumber = formData.get('siupNumber') as string | null
    
    // Tab 5: Bio Supplier
    const companyAdvantages = formData.get('companyAdvantages') as string | null
    const uniqueValue = formData.get('uniqueValue') as string | null

    // Files
    const logoFile = formData.get('logo') as File | null
    const bannerFile = formData.get('banner') as File | null
    const legalityFile = formData.get('legalityDoc') as File | null
    const nibFile = formData.get('nibDoc') as File | null

    // Validation (keep backward compatibility)
    if (!companyName || !slug || !province || !city) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, slug, province, city' },
        { status: 400 }
      )
    }
    
    // New validation: supplierType recommended but not required for backward compatibility
    if (supplierType && !['PRODUSEN', 'PABRIK', 'TRADER', 'AGGREGATOR'].includes(supplierType)) {
      return NextResponse.json(
        { error: 'Invalid supplier type. Must be: PRODUSEN, PABRIK, TRADER, or AGGREGATOR' },
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

    // Handle file uploads to Vercel Blob (production) or local (development)
    let logoPath: string | null = null
    let bannerPath: string | null = null
    let legalityPath: string | null = null
    let nibPath: string | null = null

    if (logoFile && logoFile.size > 0) {
      const result = await uploadFile(logoFile, {
        folder: 'suppliers',
        prefix: 'logo',
        maxSize: 5 * 1024 * 1024, // 5MB
      })
      logoPath = result.url
    }

    if (bannerFile && bannerFile.size > 0) {
      const result = await uploadFile(bannerFile, {
        folder: 'suppliers',
        prefix: 'banner',
        maxSize: 10 * 1024 * 1024, // 10MB
      })
      bannerPath = result.url
    }

    if (legalityFile && legalityFile.size > 0) {
      const result = await uploadFile(legalityFile, {
        folder: 'suppliers/documents',
        prefix: 'legality',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      })
      legalityPath = result.url
    }

    if (nibFile && nibFile.size > 0) {
      const result = await uploadFile(nibFile, {
        folder: 'suppliers/documents',
        prefix: 'nib',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      })
      nibPath = result.url
    }

    // Create supplier profile and membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user role to SUPPLIER
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: 'SUPPLIER' },
      })

      // Create supplier profile with new fields
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
          
          // ===== NEW FIELDS =====
          // Supplier Type & Status
          supplierType: supplierType as any,
          status: supplierType ? 'ONBOARDING' : 'DRAFT', // If supplierType provided, mark as ONBOARDING
          
          // Tab 1: Identitas Usaha
          legalEntityType,
          businessField,
          mainProducts,
          establishedYear: establishedYear ? parseInt(establishedYear) : null,
          
          // Tab 2: Alamat & Lokasi
          district,
          postalCode,
          productionLocation,
          
          // Tab 3: Kontak Perusahaan
          picPosition,
          businessEmail,
          
          // Tab 4: Legalitas
          nibNumber,
          npwpNumber,
          siupNumber,
          
          // Tab 5: Bio Supplier
          companyAdvantages,
          uniqueValue,
        },
      })
      
      // Create audit log for registration
      await tx.supplierAuditLog.create({
        data: {
          supplierId: profile.id,
          userId: session.user.id,
          action: 'SUPPLIER_REGISTRATION',
          notes: `Supplier registered with type: ${supplierType || 'Not specified'}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
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
