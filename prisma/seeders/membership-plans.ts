import { PrismaClient, MembershipDuration, CommissionType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMembershipPlans() {
  console.log('🌱 Seeding membership plans...');

  // Sample membership plans
  const membershipPlans = [
    {
      name: 'Starter Plan',
      slug: 'starter-plan',
      checkoutSlug: 'beli-starter',
      checkoutTemplate: 'modern',
      description: 'Paket membership ideal untuk pemula yang ingin memulai ekspor',
      duration: MembershipDuration.ONE_MONTH,
      price: 299000,
      originalPrice: 499000,
      discount: 40,
      commissionType: CommissionType.PERCENTAGE,
      affiliateCommissionRate: 30,
      features: [
        'Akses ke grup komunitas eksklusif',
        'Materi ekspor lengkap untuk pemula',
        'Template dokumen ekspor',
        'Support via WhatsApp',
        'Update konten bulanan'
      ],
      isBestSeller: false,
      isPopular: true,
      isMostPopular: false,
      isActive: true,
      salesPageUrl: 'https://kelaseksporyuk.com/starter',
      formLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
      formBanner: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
      autoAddToList: true,
      autoRemoveOnExpire: false,
      reminders: [
        {
          title: 'Welcome Message',
          message: 'Selamat datang di Starter Plan! Kami siap membantu perjalanan ekspor Anda.'
        },
        {
          title: 'Reminder Perpanjangan',
          message: 'Halo {user_name}, membership Anda akan berakhir dalam {days_left} hari. Perpanjang sekarang untuk tetap mendapat akses!'
        }
      ]
    },
    {
      name: 'Professional Plan',
      slug: 'professional-plan',
      checkoutSlug: 'beli-professional',
      checkoutTemplate: 'unified',
      description: 'Paket lengkap untuk eksportir yang serius mengembangkan bisnis',
      duration: MembershipDuration.THREE_MONTHS,
      price: 799000,
      originalPrice: 1499000,
      discount: 47,
      commissionType: CommissionType.PERCENTAGE,
      affiliateCommissionRate: 35,
      features: [
        'Semua fitur Starter Plan',
        'Akses 10+ course premium',
        'Konsultasi 1-on-1 dengan mentor',
        'Database buyer internasional',
        'Tools kalkulasi ekspor otomatis',
        'Sertifikat digital',
        'Priority support 24/7'
      ],
      isBestSeller: true,
      isPopular: true,
      isMostPopular: true,
      isActive: true,
      salesPageUrl: 'https://kelaseksporyuk.com/professional',
      formLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
      formBanner: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
      autoAddToList: true,
      autoRemoveOnExpire: true,
      reminders: [
        {
          title: 'Welcome to Professional',
          message: 'Selamat bergabung di Professional Plan! Akses semua fitur premium Anda sekarang.'
        },
        {
          title: 'Tips Ekspor Minggu Ini',
          message: 'Hai {user_name}, jangan lewatkan tips ekspor terbaru dari mentor kami!'
        },
        {
          title: 'Reminder Perpanjangan',
          message: 'Membership Professional Anda akan berakhir {days_left} hari lagi. Perpanjang sekarang dengan diskon spesial!'
        }
      ]
    },
    {
      name: 'Enterprise Plan',
      slug: 'enterprise-plan',
      checkoutSlug: 'beli-enterprise',
      checkoutTemplate: 'selector',
      description: 'Solusi terlengkap untuk perusahaan dan eksportir berpengalaman',
      duration: MembershipDuration.TWELVE_MONTHS,
      price: 2499000,
      originalPrice: 4999000,
      discount: 50,
      commissionType: CommissionType.FLAT,
      affiliateCommissionRate: 500000, // Flat 500k per sale
      features: [
        'Semua fitur Professional Plan',
        'Unlimited access ke semua course',
        'Dedicated account manager',
        'Custom training & workshop',
        'Advanced analytics & reporting',
        'API access untuk integrasi sistem',
        'White-label solution',
        'Networking event eksklusif',
        'Prioritas untuk update fitur baru'
      ],
      isBestSeller: false,
      isPopular: false,
      isMostPopular: false,
      isActive: true,
      salesPageUrl: 'https://kelaseksporyuk.com/enterprise',
      formLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
      formBanner: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      autoAddToList: true,
      autoRemoveOnExpire: true,
      reminders: [
        {
          title: 'Welcome to Enterprise',
          message: 'Terima kasih telah memilih Enterprise Plan! Tim dedicated Anda akan menghubungi dalam 24 jam.'
        },
        {
          title: 'Monthly Business Review',
          message: 'Saatnya review performa ekspor bulan ini! Hubungi account manager Anda untuk jadwal meeting.'
        },
        {
          title: 'Renewal Reminder',
          message: 'Membership Enterprise akan berakhir dalam {days_left} hari. Hubungi kami untuk renewal dengan benefit tambahan!'
        }
      ]
    },
    {
      name: 'Lifetime Access',
      slug: 'lifetime-access',
      checkoutSlug: 'beli-lifetime',
      checkoutTemplate: 'all',
      description: 'Akses selamanya ke semua konten dan fitur tanpa batas waktu',
      duration: MembershipDuration.LIFETIME,
      price: 4999000,
      originalPrice: 9999000,
      discount: 50,
      commissionType: CommissionType.FLAT,
      affiliateCommissionRate: 1000000, // Flat 1 juta per sale
      features: [
        'Akses SELAMANYA ke semua konten',
        'Semua course & update gratis',
        'Semua produk & tools gratis',
        'Unlimited konsultasi',
        'VIP support & priority',
        'Exclusive lifetime member perks',
        'Early access fitur baru',
        'Gratis upgrade apapun',
        'Lifetime warranty'
      ],
      isBestSeller: true,
      isPopular: false,
      isMostPopular: false,
      isActive: true,
      salesPageUrl: 'https://kelaseksporyuk.com/lifetime',
      formLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200',
      formBanner: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800',
      autoAddToList: true,
      autoRemoveOnExpire: false, // Lifetime never expires
      reminders: [
        {
          title: 'Welcome to Lifetime',
          message: 'Selamat! Anda sekarang Lifetime Member. Nikmati akses tanpa batas selamanya!'
        },
        {
          title: 'Exclusive Update',
          message: 'Hai Lifetime Member! Ada konten eksklusif baru khusus untuk Anda.'
        }
      ]
    }
  ];

  for (const plan of membershipPlans) {
    const existing = await prisma.membership.findUnique({
      where: { slug: plan.slug }
    });

    if (existing) {
      console.log(`⏭️  Skipping ${plan.name} - already exists`);
      continue;
    }

    await prisma.membership.create({
      data: {
        ...plan,
        features: plan.features as any,
        reminders: plan.reminders as any
      }
    });

    console.log(`✅ Created membership: ${plan.name}`);
  }

  console.log('✅ Membership plans seeding completed!');
}
