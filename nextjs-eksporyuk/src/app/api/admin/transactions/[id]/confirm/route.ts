import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { addUserToMailketingList, mailketing } from '@/lib/integrations/mailketing';
import { emailTemplates } from '@/lib/email-templates';
import { updateChallengeProgress } from '@/lib/challenge-helper';

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

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if already processed
    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({ error: 'Transaction already confirmed' }, { status: 400 });
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'SUCCESS',
        paidAt: new Date(),
        paymentMethod: transaction.paymentMethod || 'MANUAL_CONFIRMATION',
        notes: transaction.notes
          ? `${transaction.notes}\n[ADMIN APPROVED: ${new Date().toLocaleString('id-ID')} by ${session.user.name}]`
          : `[ADMIN APPROVED: ${new Date().toLocaleString('id-ID')} by ${session.user.name}]`,
      },
    });

    // Handle membership activation
    if (transaction.type === 'MEMBERSHIP' && transaction.metadata) {
      const metadata = transaction.metadata as any;
      const membershipId = metadata.membershipId;

      if (membershipId) {
        // Check if UserMembership already exists
        const existingUserMembership = await prisma.userMembership.findFirst({
          where: {
            userId: transaction.userId,
            transactionId: transaction.id,
          },
        });

        if (!existingUserMembership) {
          // Get membership details
          const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
            include: {
              membershipGroups: {
                include: { group: { select: { id: true, name: true } } },
              },
              membershipCourses: {
                include: { course: { select: { id: true, title: true } } },
              },
              membershipProducts: {
                include: { product: { select: { id: true, name: true } } },
              },
            },
          });

          if (membership) {
            // Calculate end date
            const now = new Date();
            let endDate = new Date(now);

            switch (membership.duration) {
              case 'ONE_MONTH':
                endDate.setMonth(endDate.getMonth() + 1);
                break;
              case 'THREE_MONTHS':
                endDate.setMonth(endDate.getMonth() + 3);
                break;
              case 'SIX_MONTHS':
                endDate.setMonth(endDate.getMonth() + 6);
                break;
              case 'TWELVE_MONTHS':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
              case 'LIFETIME':
                endDate.setFullYear(endDate.getFullYear() + 100);
                break;
            }

            // Create UserMembership
            await prisma.userMembership.create({
              data: {
                userId: transaction.userId,
                membershipId: membershipId,
                status: 'ACTIVE',
                isActive: true,
                activatedAt: now,
                startDate: now,
                endDate,
                price: transaction.amount,
                transactionId: transaction.id,
              },
            });

            // Add user to Mailketing list if configured
            if (membership.mailketingListId && membership.autoAddToList) {
              try {
                await addUserToMailketingList(
                  transaction.user.email,
                  membership.mailketingListId,
                  {
                    name: transaction.user.name,
                    phone: transaction.user.phone || transaction.customerPhone || undefined,
                    purchaseType: 'membership',
                    purchaseItem: membership.name,
                    purchaseDate: now,
                    purchaseAmount: Number(transaction.amount),
                  }
                );

                // Update user's mailketingLists array
                const currentLists = (transaction.user.mailketingLists as string[]) || [];
                if (!currentLists.includes(membership.mailketingListId)) {
                  await prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                      mailketingLists: [...currentLists, membership.mailketingListId],
                    },
                  });
                }

                console.log(`✅ User added to Mailketing list: ${membership.mailketingListName || membership.mailketingListId}`);
              } catch (listError) {
                console.error('Error adding to Mailketing list:', listError);
              }
            }

            // Auto-enroll in groups
            for (const { group } of membership.membershipGroups) {
              await prisma.groupMember.upsert({
                where: {
                  groupId_userId: {
                    groupId: group.id,
                    userId: transaction.userId,
                  },
                },
                update: {},
                create: {
                  groupId: group.id,
                  userId: transaction.userId,
                  role: 'MEMBER',
                },
              });
              console.log(`✅ User enrolled in group: ${group.name}`);
            }

            // Auto-enroll in courses
            for (const { course } of membership.membershipCourses) {
              await prisma.courseEnrollment.upsert({
                where: {
                  courseId_userId: {
                    userId: transaction.userId,
                    courseId: course.id,
                  },
                },
                update: {},
                create: {
                  userId: transaction.userId,
                  courseId: course.id,
                },
              });
              console.log(`✅ User enrolled in course: ${course.title}`);
            }

            // Grant access to products
            for (const { product } of membership.membershipProducts) {
              await prisma.userProduct.upsert({
                where: {
                  userId_productId: {
                    userId: transaction.userId,
                    productId: product.id,
                  },
                },
                update: {},
                create: {
                  userId: transaction.userId,
                  productId: product.id,
                  transactionId: transaction.id,
                  purchaseDate: now,
                  price: transaction.amount,
                },
              });
              console.log(`✅ User granted access to product: ${product.name}`);
            }

            // Send success email
            try {
              const emailData = emailTemplates.paymentSuccess({
                userName: transaction.customerName || transaction.user.name,
                invoiceNumber: transaction.invoiceNumber || `INV${transaction.id.slice(0, 8).toUpperCase()}`,
                amount: Number(transaction.amount),
                paymentMethod: transaction.paymentMethod || 'MANUAL',
                transactionDate: now.toLocaleDateString('id-ID'),
                itemName: membership.name,
              });

              await mailketing.sendEmail({
                to: transaction.customerEmail || transaction.user.email,
                subject: emailData.subject,
                html: emailData.html,
              });

              console.log('✅ Payment success email sent');
            } catch (emailError) {
              console.error('Error sending email:', emailError);
            }
          }
        }
      }
    }

    // Handle product purchase
    if (transaction.type === 'PRODUCT' && transaction.productId) {
      await prisma.userProduct.upsert({
        where: {
          userId_productId: {
            userId: transaction.userId,
            productId: transaction.productId,
          },
        },
        update: {},
        create: {
          userId: transaction.userId,
          productId: transaction.productId,
          transactionId: transaction.id,
          purchaseDate: new Date(),
          price: transaction.amount,
        },
      });

      // Send email
      try {
        const product = await prisma.product.findUnique({ where: { id: transaction.productId } });
        if (product) {
          const emailData = emailTemplates.paymentSuccess({
            userName: transaction.customerName || transaction.user.name,
            invoiceNumber: transaction.invoiceNumber || `INV${transaction.id.slice(0, 8).toUpperCase()}`,
            amount: Number(transaction.amount),
            paymentMethod: transaction.paymentMethod || 'MANUAL',
            transactionDate: new Date().toLocaleDateString('id-ID'),
            itemName: product.name,
          });

          await mailketing.sendEmail({
            to: transaction.customerEmail || transaction.user.email,
            ...emailData,
          });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    // Handle course enrollment
    if (transaction.type === 'COURSE' && transaction.courseId) {
      await prisma.courseEnrollment.upsert({
        where: {
          courseId_userId: {
            userId: transaction.userId,
            courseId: transaction.courseId,
          },
        },
        update: {},
        create: {
          userId: transaction.userId,
          courseId: transaction.courseId,
        },
      });

      // Send email
      try {
        const course = await prisma.course.findUnique({ where: { id: transaction.courseId } });
        if (course) {
          const emailData = emailTemplates.paymentSuccess({
            userName: transaction.customerName || transaction.user.name,
            invoiceNumber: transaction.invoiceNumber || `INV${transaction.id.slice(0, 8).toUpperCase()}`,
            amount: Number(transaction.amount),
            paymentMethod: transaction.paymentMethod || 'MANUAL',
            transactionDate: new Date().toLocaleDateString('id-ID'),
            itemName: course.title,
          });

          await mailketing.sendEmail({
            to: transaction.customerEmail || transaction.user.email,
            ...emailData,
          });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    // Handle affiliate commission
    if (transaction.affiliateId) {
      const affiliateConversion = await prisma.affiliateConversion.findUnique({
        where: { transactionId: transaction.id },
      });

      if (affiliateConversion && !affiliateConversion.paidOut) {
        await prisma.affiliateConversion.update({
          where: { id: affiliateConversion.id },
          data: { 
            paidOut: true,
            paidOutAt: new Date(),
          },
        });

        // Update affiliate wallet
        await prisma.wallet.upsert({
          where: { userId: transaction.affiliateId },
          update: {
            balance: { increment: affiliateConversion.commissionAmount },
          },
          create: {
            userId: transaction.affiliateId,
            balance: affiliateConversion.commissionAmount,
          },
        });

        // Update challenge progress untuk affiliate
        await updateChallengeProgress({
          affiliateId: transaction.affiliateId,
          membershipId: transaction.membershipId,
          productId: transaction.productId,
          courseId: transaction.courseId,
          transactionAmount: Number(transaction.amount)
        });

        console.log('✅ Affiliate commission approved');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
