#!/usr/bin/env node

/**
 * 🗄️ DATABASE VERIFICATION SCRIPT
 * Checks if commission email templates exist in database
 * Verifies transaction and wallet data
 */

import { prisma } from './src/lib/prisma';

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                            ║');
  console.log('║               🗄️  DATABASE VERIFICATION & EMAIL TEMPLATE AUDIT            ║');
  console.log('║                                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Check Commission Email Templates
    console.log('1️⃣  COMMISSION EMAIL TEMPLATES\n');
    
    const emailSlugs = [
      'affiliate-commission-received',
      'founder-commission-received',
      'cofounder-commission-received',
      'admin-fee-pending',
      'mentor-commission-received',
      'commission-settings-changed'
    ];

    for (const slug of emailSlugs) {
      const template = await prisma.brandedTemplate.findUnique({
        where: { slug }
      });

      if (template) {
        console.log(`✅ ${slug}`);
        console.log(`   Name: ${template.name}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Active: ${template.isActive}`);
        console.log(`   Used: ${template.usageCount} times\n`);
      } else {
        console.log(`❌ ${slug} - NOT FOUND IN DATABASE\n`);
      }
    }

    // 2. Check Recent Transactions
    console.log('\n2️⃣  RECENT TRANSACTIONS\n');
    
    const transactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true, role: true } }
      }
    });

    if (transactions.length > 0) {
      transactions.forEach((tx, idx) => {
        console.log(`${idx + 1}. Transaction ${tx.id}`);
        console.log(`   Type: ${tx.type} | Status: ${tx.status}`);
        console.log(`   Amount: Rp ${tx.amount.toLocaleString('id-ID')}`);
        console.log(`   User: ${tx.user?.name} (${tx.user?.email})`);
        console.log(`   Paid At: ${tx.paidAt || 'Pending'}\n`);
      });
    } else {
      console.log('❌ No transactions found\n');
    }

    // 3. Check Wallet Distribution
    console.log('\n3️⃣  WALLET DISTRIBUTION\n');
    
    const wallets = await prisma.wallet.findMany({
      take: 10,
      where: {
        OR: [
          { balance: { gt: 0 } },
          { balancePending: { gt: 0 } }
        ]
      },
      include: {
        user: { select: { name: true, role: true, email: true } }
      },
      orderBy: { balance: 'desc' }
    });

    if (wallets.length > 0) {
      console.log('Top Wallets with Balance:\n');
      wallets.forEach((wallet, idx) => {
        console.log(`${idx + 1}. ${wallet.user?.name} (${wallet.user?.role})`);
        console.log(`   Balance: Rp ${wallet.balance.toLocaleString('id-ID')}`);
        console.log(`   Pending: Rp ${wallet.balancePending.toLocaleString('id-ID')}`);
        console.log(`   Total Earnings: Rp ${wallet.totalEarnings.toLocaleString('id-ID')}\n`);
      });
    } else {
      console.log('⚠️  No wallets with balance found\n');
    }

    // 4. Check Pending Revenue Records
    console.log('\n4️⃣  PENDING REVENUE APPROVAL FLOW\n');
    
    const pendingRevenue = await prisma.pendingRevenue.findMany({
      where: { status: 'PENDING' },
      include: {
        wallet: {
          include: {
            user: { select: { name: true, role: true, email: true } }
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    if (pendingRevenue.length > 0) {
      console.log(`Found ${pendingRevenue.length} pending revenue records:\n`);
      pendingRevenue.forEach((revenue, idx) => {
        console.log(`${idx + 1}. ${revenue.wallet.user?.name}`);
        console.log(`   Type: ${revenue.type}`);
        console.log(`   Amount: Rp ${revenue.amount.toLocaleString('id-ID')}`);
        console.log(`   Status: ${revenue.status}`);
        console.log(`   Created: ${new Date(revenue.createdAt).toLocaleString('id-ID')}\n`);
      });
    } else {
      console.log('✅ No pending revenue records (all approved or no transactions yet)\n');
    }

    // 5. Check Email Notification Logs
    console.log('\n5️⃣  EMAIL NOTIFICATION LOG\n');
    
    const emailLogs = await prisma.emailNotificationLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        templateSlug: true,
        recipientEmail: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
        failureReason: true,
        createdAt: true
      }
    });

    if (emailLogs.length > 0) {
      console.log(`Found ${emailLogs.length} email logs:\n`);
      emailLogs.forEach((log, idx) => {
        console.log(`${idx + 1}. ${log.templateSlug}`);
        console.log(`   To: ${log.recipientEmail}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Sent: ${log.sentAt ? new Date(log.sentAt).toLocaleString('id-ID') : 'Pending'}`);
        console.log(`   Delivered: ${log.deliveredAt ? '✅ Yes' : '❌ No'}`);
        console.log(`   Opened: ${log.openedAt ? '✅ Yes' : '❌ No'}`);
        if (log.failureReason) {
          console.log(`   Error: ${log.failureReason}`);
        }
        console.log();
      });
    } else {
      console.log('⚠️  No email logs found (no emails sent yet)\n');
    }

    // 6. Check Affiliate Commissions
    console.log('\n6️⃣  AFFILIATE COMMISSION TRACKING\n');
    
    const affiliateConversions = await prisma.affiliateConversion.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        affiliate: {
          select: { name: true, user: { select: { email: true } } }
        }
      }
    });

    if (affiliateConversions.length > 0) {
      console.log(`Found ${affiliateConversions.length} affiliate conversions:\n`);
      affiliateConversions.forEach((conversion, idx) => {
        console.log(`${idx + 1}. ${conversion.affiliate?.name}`);
        console.log(`   Commission: Rp ${conversion.commissionAmount.toLocaleString('id-ID')}`);
        console.log(`   Rate: ${conversion.commissionRate}% (${conversion.commissionType})`);
        console.log(`   Paid Out: ${conversion.paidOut ? '✅ Yes' : '❌ Pending'}\n`);
      });
    } else {
      console.log('⚠️  No affiliate conversions found\n');
    }

    // 7. Verify Integration Configuration
    console.log('\n7️⃣  INTEGRATION CONFIGURATION\n');
    
    const integrationConfig = await prisma.integrationConfig.findFirst();
    if (integrationConfig) {
      console.log('✅ Integration Config Found');
      console.log(`   Mailketing API Key: ${integrationConfig.MAILKETING_API_KEY ? '✅ Set' : '❌ Not Set'}`);
      console.log(`   Xendit API Key: ${integrationConfig.XENDIT_API_KEY ? '✅ Set' : '❌ Not Set'}`);
      console.log(`   Xendit Webhook Token: ${integrationConfig.XENDIT_WEBHOOK_TOKEN ? '✅ Set' : '❌ Not Set'}`);
    } else {
      console.log('❌ No integration configuration found\n');
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          DATABASE VERIFICATION SUMMARY                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

    const stats = {
      templates: await prisma.brandedTemplate.count(),
      transactions: await prisma.transaction.count(),
      wallets: await prisma.wallet.count(),
      emailLogs: await prisma.emailNotificationLog.count(),
      pendingRevenue: await prisma.pendingRevenue.count({ where: { status: 'PENDING' } }),
      approvedRevenue: await prisma.pendingRevenue.count({ where: { status: 'APPROVED' } })
    };

    console.log(`📊 Database Statistics:\n`);
    console.log(`  • Total Email Templates: ${stats.templates}`);
    console.log(`  • Total Transactions: ${stats.transactions}`);
    console.log(`  • Total Wallets: ${stats.wallets}`);
    console.log(`  • Email Logs Sent: ${stats.emailLogs}`);
    console.log(`  • Pending Revenue: ${stats.pendingRevenue} records`);
    console.log(`  • Approved Revenue: ${stats.approvedRevenue} records\n`);

    // Action Items
    console.log(`📋 Next Steps:\n`);
    
    if (stats.templates < 6) {
      console.log(`  ❌ CRITICAL: Missing commission email templates (found ${stats.templates}/6)`);
      console.log(`     → Create missing templates in database\n`);
    }

    if (stats.transactions === 0) {
      console.log(`  ⚠️  No transactions in database`);
      console.log(`     → Test by creating a membership purchase\n`);
    }

    if (stats.emailLogs === 0) {
      console.log(`  ⚠️  No email logs found`);
      console.log(`     → Test email endpoint: POST /api/admin/branded-templates/test-email\n`);
    }

    console.log(`✅ Verification Complete\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
