const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Sample test data untuk setiap kategori
const TEST_DATA = {
  SYSTEM: {
    name: 'John Doe',
    email: 'john@example.com',
    username: 'johndoe',
    site_name: 'Eksporyuk',
    support_email: 'support@eksporyuk.com',
    dashboard_link: 'https://eksporyuk.com/dashboard',
    activation_code: 'ACT123456',
    activation_link: 'https://eksporyuk.com/activate/ACT123456',
    verification_code: 'VER789123',
    verification_link: 'https://eksporyuk.com/verify/VER789123',
    reset_link: 'https://eksporyuk.com/reset/RST456789',
    reset_code: 'RST456789',
    login_time: '2025-01-15 10:30:00',
    login_location: 'Jakarta, Indonesia',
    login_device: 'Chrome on Windows',
    login_ip: '192.168.1.1'
  },
  PAYMENT: {
    invoice_number: 'INV-2025-00123',
    amount_formatted: 'Rp 500.000',
    payment_method: 'Credit Card Visa',
    order_time: '2025-01-15 09:45:00',
    payment_deadline: '2025-01-16 23:59:00',
    payment_link: 'https://eksporyuk.com/pay/INV-2025-00123',
    transaction_date: '2025-01-15 10:00:00',
    transaction_time: '10:00:00',
    product_name: 'Premium Membership',
    product_description: 'Akses unlimited ke semua kourse',
    quantity: '1',
    order_link: 'https://eksporyuk.com/orders/ORD123',
    invoice_link: 'https://eksporyuk.com/invoices/INV-2025-00123',
    failure_reason: 'Saldo tidak cukup',
    refund_amount: 'Rp 500.000',
    refund_reason: 'Pembatalan atas permintaan pengguna',
    refund_date: '2025-01-15',
    refund_method: 'Kartu Kredit',
    refund_reference: 'REF-2025-00456',
    refund_tracking_link: 'https://eksporyuk.com/refund/REF-2025-00456',
    receipt_number: 'RCP-2025-00789',
    receipt_download_link: 'https://eksporyuk.com/receipt/RCP-2025-00789',
    original_invoice: 'INV-2025-00122',
    transaction_reference: 'TRX-1234567890',
    payment_status: 'PAID'
  },
  MEMBERSHIP: {
    membership_plan: 'Premium Plus',
    purchase_date: '2025-01-15',
    expiry_date: '2026-01-15',
    old_plan: 'Premium',
    new_plan: 'Premium Plus',
    upgrade_date: '2025-01-15',
    new_expiry_date: '2026-01-15',
    upgrade_cost: 'Rp 200.000',
    new_benefit_1: 'Akses ke semua kourse eksklusif',
    new_benefit_2: 'Konsultasi 1-on-1 dengan mentor',
    new_benefit_3: 'Sertifikat premium',
    benefit_1: 'Akses unlimited kourse',
    benefit_2: 'Materi downloadable',
    benefit_3: 'Forum komunitas',
    start_date: '2025-01-15',
    days_left: 7,
    renewal_price: 'Rp 400.000',
    renewal_link: 'https://eksporyuk.com/renew/membership',
    plans_page: 'https://eksporyuk.com/membership-plans',
    support_page: 'https://eksporyuk.com/support'
  },
  COURSE: {
    course_name: 'Export Business Mastery',
    instructor_name: 'Budi Santoso',
    course_level: 'Intermediate',
    course_duration: '8 weeks',
    course_start_date: '2025-02-01',
    course_end_date: '2025-03-31',
    course_price: 'Rp 2.500.000',
    topic_1: 'Strategi Export Global',
    topic_2: 'Dokumentasi dan Regulasi',
    topic_3: 'Pricing dan Negosiasi',
    topic_4: 'Logistics dan Shipping',
    course_link: 'https://eksporyuk.com/courses/export-mastery',
    learning_schedule: 'Setiap Selasa & Jumat, 19:00-21:00 WIB',
    forum_link: 'https://eksporyuk.com/forum/export-mastery',
    group_link: 'https://eksporyuk.com/groups/export-mastery',
    materials_link: 'https://eksporyuk.com/materials/export-mastery',
    journal_link: 'https://eksporyuk.com/journal/export-mastery',
    module_1_title: 'Fundamentals Export',
    module_1_date: '2025-02-01',
    module_2_title: 'Market Research',
    module_2_date: '2025-02-15',
    module_3_title: 'Operations Export',
    module_3_date: '2025-03-01',
    completion_percentage: 60,
    modules_remaining: 4,
    next_module_title: 'Advanced Negotiation',
    next_module_date: '2025-02-08',
    next_module_duration: '2 weeks',
    next_module_topics: 'Price negotiation techniques',
    final_score: 92,
    total_hours: 24,
    module_1: 'Fundamentals',
    module_1_score: 95,
    module_2: 'Research',
    module_2_score: 88,
    module_3: 'Operations',
    module_3_score: 92,
    certificate_link: 'https://eksporyuk.com/cert/CERT-2025-001',
    results_link: 'https://eksporyuk.com/results/export-mastery',
    next_courses_link: 'https://eksporyuk.com/courses/advanced',
    share_link: 'https://eksporyuk.com/share/cert/CERT-2025-001',
    pending_quizzes: 2,
    pending_assignments: 1,
    forum_threads_new: 5,
    assignment_title: 'Market Entry Strategy',
    due_date: '2025-01-20',
    due_time: '23:59',
    submission_status: 'Not Submitted',
    time_remaining: '2 days',
    assignment_description: 'Buat strategi entry market untuk negara pilihan Anda',
    criteria_1: 'Market Analysis',
    weight_1: 40,
    criteria_2: 'Implementation Plan',
    weight_2: 40,
    criteria_3: 'Presentation',
    weight_3: 20
  },
  EVENT: {
    event_name: 'Export Summit 2025',
    event_date: '2025-02-20',
    event_time: '09:00 AM',
    event_location: 'Grand Indonesia Convention Center, Jakarta',
    event_format: 'Hybrid (Online + Offline)',
    event_capacity: '500 participants',
    registration_number: 'REG-2025-00987',
    event_agenda_link: 'https://eksporyuk.com/events/export-summit-2025/agenda',
    event_location_map: 'https://maps.google.com/?q=Grand+Indonesia',
    event_updates_link: 'https://eksporyuk.com/events/export-summit-2025/updates',
    event_link: 'https://eksporyuk.com/events/export-summit-2025',
    ticket_type: 'VIP Pass',
    ticket_price: 'Rp 1.500.000',
    preparation_1: 'Siapkan business card Anda',
    preparation_2: 'Charging device untuk networking',
    preparation_3: 'Bawa notebook untuk mencatat',
    days_left: 3,
    registration_number: 'REG-2025-00987',
    event_schedule_link: 'https://eksporyuk.com/events/export-summit-2025/schedule',
    speakers_link: 'https://eksporyuk.com/events/export-summit-2025/speakers',
    faq_link: 'https://eksporyuk.com/events/export-summit-2025/faq',
    location_gps_link: 'https://gps.example.com/grand-indonesia',
    cancellation_reason: 'Situasi kondisi yang tidak mendukung',
    original_event_date: '2025-02-20',
    cancellation_announcement: 'Kami berkomitmen menyelenggarakan event berkualitas. Jadwal baru segera kami umumkan.',
    refund_process_time: '5 hari kerja',
    refund_status: 'Processing',
    alternative_event_link: 'https://eksporyuk.com/events/export-summit-online',
    upcoming_events_link: 'https://eksporyuk.com/events',
    survey_link: 'https://survey.eksporyuk.com/event-export-summit-2025',
    speakers_list: 'Budi Santoso, Dewi Kusuma, Rendra Wijaya'
  },
  MARKETING: {
    discount_percentage: 30,
    discount_amount: 'Rp 150.000',
    promotion_item: 'Premium Membership',
    original_price: 'Rp 500.000',
    promo_price: 'Rp 350.000',
    promo_start_date: '2025-01-15',
    promo_end_date: '2025-01-31',
    benefit_1: 'Akses unlimited ke 100+ kourse',
    benefit_2: 'Sertifikat profesional',
    benefit_3: 'Mentor 1-on-1 support',
    benefit_4: 'Lifetime access guarantee',
    promo_code: 'PROMO30',
    purchase_link: 'https://eksporyuk.com/buy/premium?code=PROMO30',
    newsletter_title: 'Eksporyuk Weekly Digest',
    newsletter_date: 'January 15, 2025',
    newsletter_edition: '42',
    featured_article_title: '10 Strategi Export Terbukti Efektif di 2025',
    featured_article_summary: 'Pelajari strategi yang digunakan eksportir sukses untuk meningkatkan penjualan mereka...',
    featured_article_link: 'https://eksporyuk.com/blog/10-strategi-export-2025',
    article_1_title: 'Panduan Lengkap HS Code',
    article_1_summary: 'Memahami klasifikasi produk untuk ekspor',
    article_1_link: 'https://eksporyuk.com/blog/hs-code-guide',
    article_2_title: 'Letter of Credit untuk Pemula',
    article_2_summary: 'Mengenal instrumen pembayaran internasional',
    article_2_link: 'https://eksporyuk.com/blog/letter-of-credit',
    article_3_title: 'Tips Negosiasi Harga Export',
    article_3_summary: 'Dapatkan margin profit terbaik',
    article_3_link: 'https://eksporyuk.com/blog/tips-negosiasi',
    tip_of_the_week_title: 'Gunakan Instagram untuk Promosi Export',
    tip_of_the_week_description: 'Social media adalah alat promosi gratis yang powerful untuk produk export Anda...',
    special_offer_title: 'Paket Bundle - 3 Kourse + Konsultasi',
    special_offer_description: 'Hemat Rp 2 juta dengan paket bundling kami yang eksklusif',
    special_offer_cta: 'Lihat Paket Bundle',
    special_offer_link: 'https://eksporyuk.com/bundles/export-master',
    upcoming_event_1: 'Webinar: Export Regulasi Baru',
    event_1_date: 'Jan 20, 2025',
    upcoming_event_2: 'Workshop: Digital Marketing untuk Export',
    event_2_date: 'Jan 27, 2025',
    community_highlight: 'Member kami, PT Mitra Jaya, berhasil ekspor ke 15 negara dalam 6 bulan!',
    newsletter_link: 'https://eksporyuk.com/newsletter/42',
    preferences_link: 'https://eksporyuk.com/account/newsletter-preferences',
    unsubscribe_link: 'https://eksporyuk.com/unsubscribe',
    duration: '24',
    sale_start_time: '2025-01-15 10:00:00',
    sale_end_time: '2025-01-15 22:00:00',
    flash_sale_item_1: 'Premium Membership Bundle',
    item_1_discount: 50,
    flash_sale_item_2: 'Course Pack (5 courses)',
    item_2_discount: 40,
    flash_sale_item_3: 'Consulting Session (1 jam)',
    item_3_discount: 35,
    remaining_stock: 25,
    time_remaining: '3 hours',
    flash_sale_price: 'Rp 250.000',
    season_name: 'New Year',
    season_name_upper: 'NEW YEAR',
    max_discount: 50,
    offer_1_title: 'Membership Tahunan',
    offer_1_discount: 40,
    offer_2_title: 'Paket Kourse Premium',
    offer_2_discount: 35,
    offer_3_title: 'Konsultasi Gratis',
    offer_3_discount: 100,
    bundle_1_title: 'Bundle Lengkap Export',
    bundle_1_savings: 'Rp 2.000.000',
    bundle_2_title: 'Bundle Mini Export Basics',
    bundle_2_savings: 'Rp 1.200.000',
    minimum_purchase: 'Rp 1.000.000',
    campaign_end_date: '2025-01-31',
    campaign_link: 'https://eksporyuk.com/campaigns/new-year-2025',
    campaign_link: 'https://eksporyuk.com/campaigns/new-year-2025'
  },
  AFFILIATE: {
    affiliate_id: 'AFF-00123',
    affiliate_name: 'PT Mitra Jaya',
    commission_rate: 30,
    affiliate_dashboard_link: 'https://eksporyuk.com/affiliate/dashboard',
    marketing_materials_link: 'https://eksporyuk.com/affiliate/materials',
    affiliate_guide_link: 'https://eksporyuk.com/affiliate/guide',
    banner_templates_link: 'https://eksporyuk.com/affiliate/banners',
    promotion_tips_link: 'https://eksporyuk.com/affiliate/tips',
    faq_link: 'https://eksporyuk.com/affiliate/faq',
    approval_date: '2025-01-15',
    commission_id: 'COM-2025-00456',
    earning_date: '2025-01-14',
    product_name: 'Premium Membership',
    product_price: 'Rp 500.000',
    buyer_name: 'Budi Santoso',
    transaction_date: '2025-01-14 15:30:00',
    transaction_status: 'Completed',
    monthly_total_commission: 'Rp 3.000.000',
    monthly_sales_count: 10,
    average_commission: 'Rp 300.000',
    available_balance: 'Rp 2.500.000',
    pending_balance: 'Rp 1.500.000',
    withdrawn_balance: 'Rp 5.000.000',
    minimum_withdrawal: 'Rp 100.000',
    withdrawal_request_link: 'https://eksporyuk.com/affiliate/withdraw',
    create_link_page: 'https://eksporyuk.com/affiliate/links/new',
    analytics_link: 'https://eksporyuk.com/affiliate/analytics',
    materials_link: 'https://eksporyuk.com/affiliate/materials',
    commission_amount: 'Rp 500.000',
    report_month: 'January 2025',
    total_commission: 'Rp 3.000.000',
    total_sales: 10,
    total_clicks: 156,
    conversion_rate: 6.4,
    affiliate_rank: 5,
    total_affiliates: 287,
    link_1: 'Eksporyuk.com/course/export-mastery',
    clicks_1: 45,
    sales_1: 3,
    commission_1: 'Rp 1.500.000',
    link_2: 'Eksporyuk.com/membership/premium',
    clicks_2: 67,
    sales_2: 5,
    commission_2: 'Rp 2.500.000',
    link_3: 'Eksporyuk.com/bundle/starter',
    clicks_3: 44,
    sales_3: 2,
    commission_3: 'Rp 600.000',
    best_promo_method: 'Email marketing',
    best_selling_time: 'Tuesday - Thursday, 10am-2pm',
    top_product: 'Premium Membership',
    best_audience: 'SME exporters',
    new_strategy_suggestion: 'Fokus pada video testimonial dari customers',
    webinar_link: 'https://eksporyuk.com/affiliate/webinar',
    payout_amount: 'Rp 2.500.000',
    payout_period: 'January 1-31, 2025',
    payout_date: '2025-02-05',
    payout_method: 'Bank Transfer',
    tax_amount: 'Rp 250.000',
    admin_fee: 'Rp 50.000',
    net_payout_amount: 'Rp 2.200.000',
    bank_name: 'BCA',
    account_number: '1234567890',
    account_holder: 'PT Mitra Jaya',
    transfer_tracking_link: 'https://eksporyuk.com/affiliate/payout/TRX123',
    transaction_reference: 'TRX-2025-00789',
    lifetime_earnings: 'Rp 15.000.000',
    total_payouts: 5,
    remaining_balance: 'Rp 2.000.000',
    new_tier: 'Gold',
    old_commission_rate: 25,
    tier_bonus: 'Rp 1.000.000',
    tier_exclusive_features: 'Dashboard analytics advanced, priority support',
    priority_support_level: '24/7 dedicated support',
    sales_requirement: 20,
    your_sales: 25,
    conversion_requirement: 5,
    your_conversion: 6.4,
    activity_requirement: 50,
    your_activity: 65,
    tier_specific_bonus: 'Extra 5% komisi',
    next_tier: 'Platinum',
    next_tier_sales_requirement: 50,
    next_tier_conversion: 8,
    next_tier_bonus: 'Extra 10% komisi'
  }
}

async function testTemplates() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('🧪 TEST EMAIL TEMPLATE RENDERING')
    console.log('='.repeat(80) + '\n')

    const categories = Object.keys(TEST_DATA)
    let totalTests = 0
    let successTests = 0
    let errors = []

    for (const category of categories) {
      console.log(`\n📧 ${category}:`)
      console.log('-'.repeat(70))

      const templates = await prisma.brandedTemplate.findMany({
        where: { category },
        select: { id: true, name: true, slug: true, subject: true, content: true }
      })

      const testData = TEST_DATA[category]

      for (const template of templates) {
        totalTests++
        try {
          // Test render subject
          let renderedSubject = template.subject
          let renderedContent = template.content

          // Simple regex replacement for shortcodes
          Object.keys(testData).forEach(key => {
            const shortcode = `{${key}}`
            const regex = new RegExp(shortcode, 'g')
            renderedSubject = renderedSubject.replace(regex, testData[key])
            renderedContent = renderedContent.replace(regex, testData[key])
          })

          // Validate rendering (check no unreplaced shortcodes)
          const unreplacedSubject = (renderedSubject.match(/\{[^}]+\}/g) || [])
          const unreplacedContent = (renderedContent.match(/\{[^}]+\}/g) || [])
          const unreplaced = [...new Set([...unreplacedSubject, ...unreplacedContent])]

          if (unreplaced.length > 0) {
            console.log(`⚠️  ${template.name}`)
            console.log(`    └─ Missing data for: ${unreplaced.join(', ')}`)
            errors.push({
              template: template.name,
              issue: `Missing shortcodes: ${unreplaced.join(', ')}`
            })
          } else {
            console.log(`✅ ${template.name}`)
            successTests++
          }
        } catch (err) {
          console.log(`❌ ${template.name} - ${err.message}`)
          errors.push({
            template: template.name,
            issue: err.message
          })
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(80) + '\n')

    console.log(`✅ Passed: ${successTests}/${totalTests}`)
    console.log(`❌ Failed: ${totalTests - successTests}/${totalTests}`)

    if (errors.length > 0) {
      console.log('\n⚠️  Issues Found:')
      errors.forEach(e => {
        console.log(`   - ${e.template}: ${e.issue}`)
      })
    } else {
      console.log('\n✅ ALL TESTS PASSED!')
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ TEST COMPLETE')
    console.log('='.repeat(80) + '\n')

  } catch (error) {
    console.error('FATAL ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testTemplates()
