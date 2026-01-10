import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding membership plans...');

  // 1. Paket Basic (1 Bulan)
  const basic = await prisma.membership.upsert({
    where: { slug: 'basic-1-bulan' },
    update: {},
    create: {
      name: 'Basic Membership - 1 Bulan',
      slug: 'basic-1-bulan',
      checkoutSlug: 'beli-basic-1-bulan',
      description: 'Paket membership basic dengan akses penuh selama 1 bulan. Cocok untuk pemula yang ingin mencoba platform kami.',
      duration: 'ONE_MONTH',
      price: 99000,
      originalPrice: 149000,
      discount: 33,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 30,
      features: JSON.stringify([
        'Akses semua course basic',
        'Support via email 24/7',
        'Sertifikat digital',
        'Akses grup komunitas',
      ]),
      isActive: true,
      isPopular: true,
      salesPageUrl: 'https://eksporyuk.com/membership/basic',
      reminders: JSON.stringify([
        {
          title: 'Welcome Member Baru',
          message: 'Halo {user_name}! Selamat bergabung di Basic Membership. Mari mulai belajar! 🎉',
        },
        {
          title: 'Reminder 7 Hari Sebelum Expired',
          message: 'Hai {user_name}, membership kamu akan berakhir dalam {days_left} hari. Perpanjang sekarang: {renewal_link}',
        },
      ]),
      formLogo: 'https://eksporyuk.com/assets/logo-membership.png',
      formBanner: 'https://eksporyuk.com/assets/banner-basic.jpg',
      autoAddToList: true,
      autoRemoveOnExpire: false,
    },
  });

  // 2. Paket Pro (3 Bulan)
  const pro = await prisma.membership.upsert({
    where: { slug: 'pro-3-bulan' },
    update: {},
    create: {
      name: 'Pro Membership - 3 Bulan',
      slug: 'pro-3-bulan',
      checkoutSlug: 'beli-pro-3-bulan',
      description: 'Paket membership pro dengan akses premium dan bonus eksklusif selama 3 bulan. Hemat 20% dibanding beli bulanan!',
      duration: 'THREE_MONTHS',
      price: 249000,
      originalPrice: 297000,
      discount: 20,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 35,
      features: JSON.stringify([
        'Akses SEMUA course (basic + advanced)',
        'Priority support via WhatsApp',
        'Konsultasi 1-on-1 dengan mentor',
        'Sertifikat verified',
        'Akses grup VIP',
        'Template & resource pack',
        'Webinar eksklusif bulanan',
      ]),
      isActive: true,
      isBestSeller: true,
      isMostPopular: true,
      salesPageUrl: 'https://eksporyuk.com/membership/pro',
      reminders: JSON.stringify([
        {
          title: 'Welcome Pro Member',
          message: 'Selamat datang {user_name}! Kamu sekarang Pro Member dengan akses unlimited. Jangan lupa join grup VIP! 🚀',
        },
        {
          title: 'Tips Maksimalkan Pro Membership',
          message: 'Hai {user_name}, sudah coba fitur konsultasi 1-on-1? Booking jadwal sekarang!',
        },
        {
          title: 'Reminder 14 Hari Sebelum Expired',
          message: '{user_name}, membership Pro kamu akan berakhir dalam {days_left} hari. Perpanjang dengan diskon 10%: {renewal_link}',
        },
      ]),
      formLogo: 'https://eksporyuk.com/assets/logo-membership.png',
      formBanner: 'https://eksporyuk.com/assets/banner-pro.jpg',
      autoAddToList: true,
      autoRemoveOnExpire: true,
    },
  });

  // 3. Paket Premium (12 Bulan)
  const premium = await prisma.membership.upsert({
    where: { slug: 'premium-12-bulan' },
    update: {},
    create: {
      name: 'Premium Membership - 12 Bulan',
      slug: 'premium-12-bulan',
      checkoutSlug: 'beli-premium-12-bulan',
      description: 'Paket membership premium tahunan dengan semua benefit maksimal. Hemat 40% + bonus lifetime access ke resource library!',
      duration: 'TWELVE_MONTHS',
      price: 699000,
      originalPrice: 1188000,
      discount: 41,
      commissionType: 'FLAT',
      affiliateCommissionRate: 100000, // Rp 100.000 per sale
      features: JSON.stringify([
        'UNLIMITED access ke semua course selamanya',
        'Priority support 24/7 (Email + WA)',
        'Konsultasi UNLIMITED dengan mentor',
        'Sertifikat profesional',
        'Akses grup VIP + networking events',
        'Bonus: Lifetime access resource library',
        'Bonus: 10 template bisnis siap pakai',
        'Webinar eksklusif + rekaman selamanya',
        'Diskon 50% untuk upgrade ke course berbayar',
        'Early access fitur baru',
      ]),
      isActive: true,
      isBestSeller: true,
      salesPageUrl: 'https://eksporyuk.com/membership/premium',
      reminders: JSON.stringify([
        {
          title: 'Welcome Premium Member',
          message: 'WOW! {user_name} sekarang Premium Member! Kamu dapat lifetime access ke resource library. Download sekarang! 💎',
        },
        {
          title: 'Monthly Check-in Premium',
          message: 'Halo {user_name}, sudah 30 hari sejadi Premium Member. Ada yang bisa kami bantu? Konsultasi gratis menunggu!',
        },
        {
          title: 'Reminder 30 Hari Sebelum Expired',
          message: '{user_name}, membership Premium akan berakhir dalam {days_left} hari. Perpanjang sekarang dapat bonus ekstra!',
        },
      ]),
      formLogo: 'https://eksporyuk.com/assets/logo-membership.png',
      formBanner: 'https://eksporyuk.com/assets/banner-premium.jpg',
      autoAddToList: true,
      autoRemoveOnExpire: false,
    },
  });

  // 4. Paket Lifetime
  const lifetime = await prisma.membership.upsert({
    where: { slug: 'lifetime' },
    update: {},
    create: {
      name: 'Lifetime Membership',
      slug: 'lifetime',
      checkoutSlug: 'beli-lifetime',
      description: 'Investasi terbaik! Bayar sekali, akses selamanya. Semua course, update, dan benefit baru otomatis included.',
      duration: 'LIFETIME',
      price: 1999000,
      originalPrice: 5000000,
      discount: 60,
      commissionType: 'FLAT',
      affiliateCommissionRate: 300000, // Rp 300.000 per sale
      features: JSON.stringify([
        '✨ LIFETIME ACCESS ke SEMUA course (sekarang & future)',
        '✨ LIFETIME support & konsultasi',
        '✨ Sertifikat profesional unlimited',
        '✨ Akses grup VIP elite selamanya',
        '✨ Semua update & course baru GRATIS',
        '✨ Template & resource unlimited',
        '✨ Webinar eksklusif + rekaman selamanya',
        '✨ Diskon 70% untuk produk berbayar lainnya',
        '✨ Priority early access semua fitur baru',
        '✨ Bonus: Private mentoring 3x setahun',
        '✨ Badge eksklusif "Lifetime Member"',
      ]),
      isActive: true,
      isBestSeller: true,
      isMostPopular: false,
      salesPageUrl: 'https://eksporyuk.com/membership/lifetime',
      reminders: JSON.stringify([
        {
          title: 'Welcome Lifetime Member',
          message: '🏆 CONGRATULATIONS {user_name}! Kamu sekarang LIFETIME MEMBER! Ini investasi terbaik untuk masa depanmu. Welcome to the club!',
        },
        {
          title: 'Quarterly Check-in Lifetime',
          message: 'Hi {user_name}, sudah 3 bulan sejadi Lifetime Member. Waktunya private mentoring! Booking jadwal sekarang.',
        },
      ]),
      formLogo: 'https://eksporyuk.com/assets/logo-membership.png',
      formBanner: 'https://eksporyuk.com/assets/banner-lifetime.jpg',
      autoAddToList: true,
      autoRemoveOnExpire: false,
    },
  });

  console.log('✅ Membership plans created:', {
    basic: basic.name,
    pro: pro.name,
    premium: premium.name,
    lifetime: lifetime.name,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
