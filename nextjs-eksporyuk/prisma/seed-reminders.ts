import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding membership reminders...');

  const basic = await prisma.membership.findUnique({ where: { slug: 'basic-1-bulan' } });
  const pro = await prisma.membership.findUnique({ where: { slug: 'pro-3-bulan' } });

  if (basic) {
    await prisma.membershipReminder.create({
      data: {
        membershipId: basic.id,
        title: 'Welcome Email Basic',
        description: 'Welcome email 1 jam setelah pembelian',
        triggerType: 'AFTER_PURCHASE',
        delayAmount: 1,
        delayUnit: 'HOURS',
        channels: JSON.stringify(['EMAIL', 'IN_APP']),
        emailEnabled: true,
        whatsappEnabled: false,
        pushEnabled: false,
        inAppEnabled: true,
        emailSubject: 'Selamat Datang di Basic Membership! 🎉',
        emailBody: 'Halo {user_name}, selamat bergabung! Mulai belajar sekarang.',
        emailCTA: 'Mulai Belajar',
        emailCTALink: '{dashboard_link}',
        inAppTitle: 'Welcome!',
        inAppBody: 'Mulai eksplorasi course sekarang!',
        inAppLink: '/dashboard',
        sequenceOrder: 1,
        isActive: true,
      },
    });

    await prisma.membershipReminder.create({
      data: {
        membershipId: basic.id,
        title: 'Reminder 7 Hari Expired',
        description: 'Reminder 7 hari sebelum membership habis',
        triggerType: 'BEFORE_EXPIRY',
        delayAmount: 7,
        delayUnit: 'DAYS',
        channels: JSON.stringify(['EMAIL', 'WHATSAPP', 'PUSH']),
        emailEnabled: true,
        whatsappEnabled: true,
        pushEnabled: true,
        inAppEnabled: false,
        emailSubject: 'Membership Akan Berakhir!',
        emailBody: 'Hi {user_name}, membership kamu akan berakhir dalam {days_left} hari. Perpanjang sekarang!',
        emailCTA: 'Perpanjang',
        emailCTALink: '{renewal_link}',
        whatsappMessage: 'Hai! Membership kamu akan berakhir dalam {days_left} hari: {renewal_link}',
        pushTitle: 'Akan Berakhir!',
        pushBody: '{days_left} hari lagi.',
        sequenceOrder: 2,
        isActive: true,
      },
    });
  }

  if (pro) {
    await prisma.membershipReminder.create({
      data: {
        membershipId: pro.id,
        title: 'Welcome Pro Member',
        description: 'Welcome multi-channel',
        triggerType: 'AFTER_PURCHASE',
        delayAmount: 0,
        delayUnit: 'MINUTES',
        channels: JSON.stringify(['EMAIL', 'WHATSAPP', 'PUSH', 'IN_APP']),
        emailEnabled: true,
        whatsappEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        emailSubject: '🚀 Welcome to Pro!',
        emailBody: 'Selamat {user_name}! Kamu sekarang Pro Member. Join VIP group!',
        emailCTA: 'Join VIP',
        emailCTALink: '{vip_group_link}',
        whatsappMessage: '🎉 Selamat Pro Member! Join VIP: {vip_group_link}',
        pushTitle: 'You\'re Pro!',
        pushBody: 'Unlock all premium features!',
        inAppTitle: 'Welcome Pro!',
        inAppBody: 'Join VIP group now!',
        inAppLink: '/membership/vip',
        sequenceOrder: 1,
        isActive: true,
      },
    });
  }

  console.log('✅ Reminders created!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
