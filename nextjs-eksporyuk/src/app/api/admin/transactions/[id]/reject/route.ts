import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { mailketing } from '@/lib/integrations/mailketing';
import { emailTemplates } from '@/lib/email-templates';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactionId = params.id;
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Reject reason is required' }, { status: 400 });
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
        product: { select: { name: true } },
        course: { select: { title: true } },
        membership: {
          select: {
            membership: { select: { name: true } },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if already processed
    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({ error: 'Cannot reject confirmed transaction' }, { status: 400 });
    }

    if (transaction.status === 'FAILED') {
      return NextResponse.json({ error: 'Transaction already rejected' }, { status: 400 });
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        notes: transaction.notes
          ? `${transaction.notes}\n[ADMIN REJECTED: ${new Date().toLocaleString('id-ID')} by ${session.user.name}]\nReason: ${reason}`
          : `[ADMIN REJECTED: ${new Date().toLocaleString('id-ID')} by ${session.user.name}]\nReason: ${reason}`,
      },
    });

    // Get product name
    let productName = 'Product/Service';
    if (transaction.membership?.membership?.name) {
      productName = transaction.membership.membership.name;
    } else if (transaction.product?.name) {
      productName = transaction.product.name;
    } else if (transaction.course?.title) {
      productName = transaction.course.title;
    }

    // Send rejection email
    try {
      const emailData = emailTemplates.paymentRejected({
        customerName: transaction.customerName || transaction.user.name,
        customerEmail: transaction.customerEmail || transaction.user.email,
        invoiceNumber: transaction.invoiceNumber || `INV${transaction.id.slice(0, 8).toUpperCase()}`,
        productName,
        amount: Number(transaction.amount),
        rejectionReason: reason,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@eksporyuk.com',
      });

      await mailketing.sendEmail({
        to: transaction.customerEmail || transaction.user.email,
        ...emailData,
      });

      console.log('✅ Payment rejection email sent');
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
    }

    // Handle affiliate conversion if exists
    if (transaction.affiliateId) {
      const affiliateConversion = await prisma.affiliateConversion.findUnique({
        where: { transactionId: transaction.id },
      });

      if (affiliateConversion && !affiliateConversion.paidOut) {
        // Just mark it as not paid out (already false by default)
        console.log('✅ Affiliate commission not activated (payment rejected)');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
