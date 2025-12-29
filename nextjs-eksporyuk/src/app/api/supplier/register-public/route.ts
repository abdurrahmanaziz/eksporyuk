import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn } from 'next-auth/react'
import { validatePaymentAmount } from '@/lib/payment-methods'


export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // User account
      name,
      email,
      phone,
      password,
      // Company basic
      companyName,
      companyLocation,
      companyPhone,
      companyEmail,
      // Package
      packageId,
    } = body

    // Validation
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Missing required user fields' },
        { status: 400 }
      )
    }

    if (!companyName || !companyLocation) {
      return NextResponse.json(
        { error: 'Missing required company fields' },
        { status: 400 }
      )
    }

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package selection is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Get package details
    const selectedPackage = await prisma.supplierPackage.findUnique({
      where: { id: packageId },
    })

    if (!selectedPackage || !selectedPackage.isActive) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user, supplier profile, and membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: 'MEMBER_FREE', // Default role
          emailVerified: true, // Auto verify for now
        },
      })

      // 2. Create supplier profile
      const supplierProfile = await tx.supplierProfile.create({
        data: {
          userId: newUser.id,
          companyName,
          province: companyLocation.split(',')[0]?.trim() || companyLocation,
          city: companyLocation.split(',')[1]?.trim() || companyLocation,
          phone: companyPhone || phone,
          email: companyEmail || email,
          slug: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
          isVerified: false,
          rating: 0,
          viewCount: 0,
          totalProducts: 0,
          totalChats: 0,
        },
      })

      // 3. Create supplier membership
      const startDate = new Date()
      let endDate: Date | null = null

      if (selectedPackage.duration === 'MONTHLY') {
        endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (selectedPackage.duration === 'YEARLY') {
        endDate = new Date(startDate)
        endDate.setFullYear(endDate.getFullYear() + 1)
      }
      // LIFETIME: endDate remains null

      const supplierMembership = await tx.supplierMembership.create({
        data: {
          user: {
            connect: { id: newUser.id }
          },
          package: {
            connect: { id: selectedPackage.id }
          },
          startDate,
          endDate,
          isActive: selectedPackage.type === 'FREE', // FREE is immediately active, PREMIUM needs payment
          autoRenew: false,
          price: selectedPackage.price,
        },
      })

      return {
        user: newUser,
        supplierProfile,
        supplierMembership,
      }
    })

    // Send welcome email (async, don't block response)
    const { sendSupplierWelcomeEmail } = await import('@/lib/email/supplier-email')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    sendSupplierWelcomeEmail({
      email: result.user.email,
      name: result.user.name,
      companyName: result.supplierProfile.companyName,
      packageName: selectedPackage.name,
      packageTier: selectedPackage.type,
      dashboardUrl: `${appUrl}/supplier/dashboard`
    }).catch(err => console.error('Error sending welcome email:', err))

    // If FREE package, return success (no payment needed)
    if (selectedPackage.type === 'FREE') {
      return NextResponse.json({
        success: true,
        message: 'Registration successful',
        userId: result.user.id,
        email: result.user.email,
        requiresPayment: false,
        shouldLogin: true, // Frontend needs to trigger login
      })
    }

    // If PREMIUM/ENTERPRISE, create transaction and Xendit invoice
    console.log('[SUPPLIER_REGISTER_PUBLIC] Creating transaction for premium package:', selectedPackage.name)
    
    // Validate payment amount with settings
    const packagePrice = Number(selectedPackage.price)
    if (packagePrice > 0) {
      const amountValidation = await validatePaymentAmount(packagePrice)
      if (!amountValidation.valid) {
        return NextResponse.json({ 
          error: amountValidation.error 
        }, { status: 400 })
      }
    }
    
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()

    const transaction = await prisma.transaction.create({
      data: {
        userId: result.user.id,
        amount: selectedPackage.price,
        type: 'SUPPLIER_MEMBERSHIP' as any,
        status: 'PENDING',
        invoiceNumber,
        description: `Supplier Membership: ${selectedPackage.name}`,
        externalId: `SUPP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || '',
        customerWhatsapp: phone || '',
        metadata: {
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          packageType: selectedPackage.type,
          companyName: companyName,
          supplierMembershipId: result.supplierMembership.id,
        }
      }
    })

    console.log('[SUPPLIER_REGISTER_PUBLIC] Transaction created:', transaction.id)

    // Get payment settings from database
    const settings = await prisma.settings.findFirst()
    const expiryHours = settings?.paymentExpiryHours || 72
    console.log('[SUPPLIER_REGISTER_PUBLIC] Payment expiry hours:', expiryHours)

    // Create Xendit invoice
    try {
      const { xenditProxy } = await import('@/lib/xendit-proxy')
      console.log('[SUPPLIER_REGISTER_PUBLIC] Creating Xendit invoice...')
      
      const xenditResult = await xenditProxy.createInvoice({
        external_id: transaction.id,
        payer_email: email,
        description: `Supplier Membership: ${selectedPackage.name}`,
        amount: Number(selectedPackage.price),
        currency: 'IDR',
        invoice_duration: expiryHours * 3600,
        customer: {
          given_names: name,
          email: email,
          mobile_number: phone || '',
        },
      })

      console.log('[SUPPLIER_REGISTER_PUBLIC] Xendit result:', xenditResult?.id)

      if (xenditResult && xenditResult.id) {
        const invoiceUrl = xenditResult.invoice_url
        
        // Update transaction with Xendit reference
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            reference: xenditResult.id,
            paymentUrl: invoiceUrl,
          }
        })

        console.log('[SUPPLIER_REGISTER_PUBLIC] Payment URL:', invoiceUrl)

        return NextResponse.json({
          success: true,
          message: 'Registration successful, please complete payment',
          userId: result.user.id,
          requiresPayment: true,
          checkoutUrl: invoiceUrl, // Direct Xendit URL
          transactionId: transaction.id,
          packageName: selectedPackage.name,
          packagePrice: selectedPackage.price,
        })
      } else {
        console.error('[SUPPLIER_REGISTER_PUBLIC] Xendit result invalid:', xenditResult)
        throw new Error('Xendit invoice creation returned invalid result')
      }
    } catch (xenditError: any) {
      console.error('[SUPPLIER_REGISTER_PUBLIC] Xendit error:', xenditError)
      
      // User & profile already created, just return with error
      return NextResponse.json({
        success: false,
        error: 'Registration successful, but payment setup failed: ' + xenditError.message,
        userId: result.user.id,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in supplier public registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
