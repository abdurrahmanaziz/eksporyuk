const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditSalesFeatures() {
  console.log('🔍 AUDIT: Admin Sales Transaction Management Features\n');
  console.log('='.repeat(80));
  
  // 1. Check transactions needing action
  console.log('\n📊 1. TRANSACTION STATUS OVERVIEW\n');
  
  const statusCount = await prisma.transaction.groupBy({
    by: ['status'],
    _count: true,
    _sum: { amount: true },
  });
  
  console.log('Status Distribution:');
  statusCount.forEach(s => {
    console.log(`   - ${s.status}: ${s._count} transactions (Rp ${Number(s._sum.amount || 0).toLocaleString()})`);
  });
  
  // 2. Check pending transactions
  const pendingTx = await prisma.transaction.findMany({
    where: { status: 'PENDING' },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, name: true } },
    },
  });
  
  console.log(`\n⏳ Recent Pending Transactions (${pendingTx.length} shown):\n`);
  pendingTx.forEach((tx, idx) => {
    const daysAgo = Math.floor((Date.now() - new Date(tx.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    console.log(`${idx + 1}. ${tx.user.email} - Rp ${Number(tx.amount).toLocaleString()} (${daysAgo} days ago)`);
  });
  
  // 3. Check notification services
  console.log('\n\n📧 2. NOTIFICATION SERVICES CHECK\n');
  
  const checkEnv = (key) => process.env[key] ? '✅' : '❌';
  
  console.log('Environment Variables:');
  console.log(`   Email (Resend): ${checkEnv('RESEND_API_KEY')}`);
  console.log(`   OneSignal: ${checkEnv('ONESIGNAL_APP_ID')} & ${checkEnv('ONESIGNAL_API_KEY')}`);
  console.log(`   Pusher: ${checkEnv('PUSHER_APP_ID')}`);
  console.log(`   Starsender (WA): ${checkEnv('STARSENDER_API_KEY')}`);
  console.log(`   Xendit: ${checkEnv('XENDIT_API_KEY')}`);
  
  // 4. Check email templates
  console.log('\n\n📄 3. EMAIL TEMPLATE SYSTEM\n');
  
  const templateFiles = [
    'transaction-success',
    'transaction-pending',
    'transaction-failed',
  ];
  
  const fs = require('fs');
  const path = require('path');
  
  console.log('Checking template files:');
  templateFiles.forEach(template => {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'email-templates', `${template}.ts`);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✅' : '❌'} ${template}.ts`);
  });
  
  // 5. Check Xendit integration
  console.log('\n\n💳 4. XENDIT PAYMENT GATEWAY\n');
  
  const xenditKey = process.env.XENDIT_SECRET_KEY;
  if (xenditKey && xenditKey.startsWith('xnd_')) {
    console.log('   ✅ Xendit Secret Key configured');
    console.log('   ℹ️  Xendit supports invoice cancellation via API');
  } else {
    console.log('   ❌ Xendit Secret Key not configured or invalid');
  }
  
  // 6. Check bulk action endpoint
  console.log('\n\n🔧 5. BULK ACTION ENDPOINT\n');
  
  const bulkActionFile = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'sales', 'bulk-action', 'route.ts');
  const bulkExists = fs.existsSync(bulkActionFile);
  
  console.log(`   ${bulkExists ? '✅' : '❌'} bulk-action/route.ts exists`);
  
  if (bulkExists) {
    const content = fs.readFileSync(bulkActionFile, 'utf-8');
    const hasSuccess = content.includes('SUCCESS');
    const hasPending = content.includes('PENDING');
    const hasFailed = content.includes('FAILED');
    const hasNotification = content.includes('RESEND_NOTIFICATION');
    
    console.log(`   Actions supported:`);
    console.log(`      ${hasSuccess ? '✅' : '❌'} SUCCESS (Konfirmasi)`);
    console.log(`      ${hasPending ? '✅' : '❌'} PENDING`);
    console.log(`      ${hasFailed ? '✅' : '❌'} FAILED (Batalkan)`);
    console.log(`      ${hasNotification ? '✅' : '❌'} RESEND_NOTIFICATION`);
  }
  
  // 7. Check if notifications are being sent
  console.log('\n\n📮 6. NOTIFICATION HISTORY\n');
  
  const recentNotifs = await prisma.notification.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } },
    },
  });
  
  console.log(`   Recent notifications sent: ${recentNotifs.length}\n`);
  recentNotifs.forEach((n, idx) => {
    console.log(`   ${idx + 1}. ${n.user.email} - ${n.type}: ${n.title}`);
  });
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 AUDIT SUMMARY\n');
  
  const issues = [];
  const recommendations = [];
  
  if (!process.env.RESEND_API_KEY) {
    issues.push('❌ Email service not configured (RESEND_API_KEY)');
  }
  
  if (!process.env.ONESIGNAL_APP_ID) {
    recommendations.push('⚠️  OneSignal not configured (optional push notifications)');
  }
  
  if (!process.env.PUSHER_APP_ID) {
    recommendations.push('⚠️  Pusher not configured (optional realtime updates)');
  }
  
  if (!xenditKey || !xenditKey.startsWith('xnd_')) {
    issues.push('❌ Xendit not properly configured (cannot cancel invoices)');
  }
  
  const totalPending = statusCount.find(s => s.status === 'PENDING')?._count || 0;
  if (totalPending > 50) {
    recommendations.push(`⚠️  ${totalPending} pending transactions - consider bulk processing`);
  }
  
  if (issues.length > 0) {
    console.log('CRITICAL ISSUES:');
    issues.forEach(i => console.log(`   ${i}`));
    console.log('');
  }
  
  if (recommendations.length > 0) {
    console.log('RECOMMENDATIONS:');
    recommendations.forEach(r => console.log(`   ${r}`));
    console.log('');
  }
  
  if (issues.length === 0) {
    console.log('✅ System ready for sales transaction management');
  } else {
    console.log('⚠️  Please fix critical issues before using sales features');
  }
  
  console.log('\n' + '='.repeat(80));
  
  await prisma.$disconnect();
}

auditSalesFeatures().catch(console.error);
