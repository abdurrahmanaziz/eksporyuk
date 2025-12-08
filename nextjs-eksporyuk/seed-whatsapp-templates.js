const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const whatsappTemplates = [
  // ========== AUTHENTICATION ==========
  {
    id: 'wa_welcome',
    name: 'WA Welcome - Selamat Datang',
    message: `Halo *{name}*! 👋

Selamat datang di *EksporYuk*! 🎉

Terima kasih sudah bergabung dengan kami. Akun Anda telah aktif dan siap digunakan.

✅ Akses kelas ekspor premium
✅ Download template gratis
✅ Konsultasi dengan mentor
✅ Bergabung dengan komunitas

🚀 Mulai belajar sekarang:
{dashboardUrl}

Ada pertanyaan? Balas pesan ini kapan saja!

Salam hangat,
*Tim EksporYuk* 💙`,
    variables: JSON.stringify(['name', 'dashboardUrl']),
    isActive: true
  },

  // ========== MEMBERSHIP ==========
  {
    id: 'wa_membership_welcome',
    name: 'WA Membership - Selamat Datang Member',
    message: `Selamat *{name}*! 🎊

Membership *{membershipName}* Anda sudah AKTIF! ✨

Benefit yang bisa Anda nikmati:
🎓 Akses semua kelas premium
📚 Download unlimited template
👥 Grup eksklusif member
💬 Konsultasi 1-on-1 mentor
🎁 Bonus konten eksklusif

Masa aktif sampai: *{expiryDate}*

🔥 Akses Member Area:
{memberAreaUrl}

Maksimalkan membership Anda sekarang!

Salam sukses,
*Tim EksporYuk* 💪`,
    variables: JSON.stringify(['name', 'membershipName', 'expiryDate', 'memberAreaUrl']),
    isActive: true
  },

  {
    id: 'wa_membership_expiring',
    name: 'WA Membership - Akan Berakhir',
    message: `⏰ Halo *{name}*,

Membership *{membershipName}* Anda akan berakhir dalam *{daysLeft} hari* (tanggal {expiryDate}).

Jangan sampai kehilangan akses:
❌ Semua kelas premium
❌ Template & tools
❌ Konsultasi mentor
❌ Grup komunitas

🎁 *PENAWARAN KHUSUS*
Perpanjang sekarang, dapatkan:
✅ Diskon 20%
✅ Bonus akses kelas baru
✅ Free konsultasi 2x

💰 Perpanjang sekarang:
{renewUrl}

Jangan lewatkan kesempatan ini!

*Tim EksporYuk*`,
    variables: JSON.stringify(['name', 'membershipName', 'daysLeft', 'expiryDate', 'renewUrl']),
    isActive: true
  },

  // ========== PAYMENT ==========
  {
    id: 'wa_payment_invoice',
    name: 'WA Payment - Invoice',
    message: `🧾 *INVOICE #{invoiceId}*

Halo *{name}*,

Invoice Anda sudah siap!

📦 *{productName}*
💰 Total: *Rp {totalAmount}*
⏰ Bayar sebelum: *{dueDate}*

⚠️ Invoice akan expired dalam 24 jam!

💳 Bayar sekarang:
{paymentUrl}

Setelah bayar, akses langsung aktif!

Butuh bantuan? Balas pesan ini.

*Tim EksporYuk*`,
    variables: JSON.stringify(['invoiceId', 'name', 'productName', 'totalAmount', 'dueDate', 'paymentUrl']),
    isActive: true
  },

  {
    id: 'wa_payment_success',
    name: 'WA Payment - Pembayaran Berhasil',
    message: `✅ *PEMBAYARAN BERHASIL!*

Halo *{name}*,

Terima kasih! Pembayaran Anda telah diterima 🎉

🧾 ID Transaksi: *{transactionId}*
📦 Produk: *{productName}*
💰 Total: *Rp {amount}*
📅 Tanggal: {date}

🚀 Akses produk Anda sekarang:
{accessUrl}

Selamat belajar dan sukses selalu! 💪

*Tim EksporYuk*`,
    variables: JSON.stringify(['name', 'transactionId', 'productName', 'amount', 'date', 'accessUrl']),
    isActive: true
  },

  // ========== COURSE ==========
  {
    id: 'wa_course_enrollment',
    name: 'WA Course - Pendaftaran Kelas',
    message: `🎓 *PENDAFTARAN BERHASIL!*

Selamat *{name}*!

Anda terdaftar di kelas:
*{courseName}*

👨‍🏫 Instruktur: {instructorName}
⏱️ Durasi: {duration}
📚 Total: {totalLessons} pelajaran

🚀 Langkah pertama:
1️⃣ Akses dashboard kelas
2️⃣ Download materi persiapan
3️⃣ Join grup diskusi
4️⃣ Mulai pelajaran pertama

📖 Mulai belajar:
{courseUrl}

Semangat belajar! 🔥

*Tim EksporYuk*`,
    variables: JSON.stringify(['name', 'courseName', 'instructorName', 'duration', 'totalLessons', 'courseUrl']),
    isActive: true
  },

  {
    id: 'wa_course_reminder',
    name: 'WA Course - Reminder Kelas',
    message: `⏰ *REMINDER KELAS*

Halo *{name}*!

Jangan lupa, kelas Anda hari ini:

📚 *{courseName}*
🕐 Waktu: *{scheduleTime}*
👨‍🏫 Instruktur: {instructorName}

✅ Yang perlu disiapkan:
{preparations}

🔗 Join kelas:
{classUrl}

Sampai jumpa di kelas! 👋

*Tim EksporYuk*`,
    variables: JSON.stringify(['name', 'courseName', 'scheduleTime', 'instructorName', 'preparations', 'classUrl']),
    isActive: true
  },

  // ========== AFFILIATE ==========
  {
    id: 'wa_affiliate_welcome',
    name: 'WA Affiliate - Selamat Datang',
    message: `🤝 *SELAMAT BERGABUNG!*

Halo *{name}*!

Anda sekarang Affiliator EksporYuk! 🎉

💰 *Komisi Anda: {commissionRate}%*
dari setiap penjualan

🔑 Kode Affiliate:
*{affiliateCode}*

📊 Yang bisa Anda lakukan:
✅ Promosikan produk EksporYuk
✅ Dapat komisi dari penjualan
✅ Track performa di dashboard
✅ Withdraw komisi tiap bulan

🚀 Dashboard Affiliate:
{affiliateDashboard}

Mulai promosi dan raih passive income!

*Tim EksporYuk* 💸`,
    variables: JSON.stringify(['name', 'affiliateCode', 'commissionRate', 'affiliateDashboard']),
    isActive: true
  },

  {
    id: 'wa_affiliate_commission',
    name: 'WA Affiliate - Komisi Didapat',
    message: `💰 *KOMISI BARU!*

Selamat *{name}*! 🎉

Anda dapat komisi:
*Rp {commissionAmount}* 💸

📊 Detail:
• Produk: {productName}
• Harga: Rp {saleAmount}
• Rate: {commissionRate}%
• Tanggal: {date}

💰 Total komisi bulan ini:
*Rp {monthlyTotal}*

🔥 Lihat detail:
{affiliateDashboard}

Terus promosi, tingkatkan penghasilan!

*Tim EksporYuk* 🚀`,
    variables: JSON.stringify(['name', 'commissionAmount', 'productName', 'saleAmount', 'commissionRate', 'date', 'monthlyTotal', 'affiliateDashboard']),
    isActive: true
  },

  // ========== ADMIN NOTIFICATIONS ==========
  {
    id: 'wa_admin_new_order',
    name: 'WA Admin - Order Baru',
    message: `🔔 *ORDER BARU!*

Customer: *{customerName}*
Email: {customerEmail}
HP: {customerPhone}

📦 Produk: *{productName}*
💰 Total: *Rp {amount}*

🆔 Order ID: {orderId}
📅 Tanggal: {date}

Status: *{status}*

🔗 Lihat detail:
{orderUrl}

*Admin EksporYuk*`,
    variables: JSON.stringify(['customerName', 'customerEmail', 'customerPhone', 'productName', 'amount', 'orderId', 'date', 'status', 'orderUrl']),
    isActive: true
  },

  {
    id: 'wa_admin_new_member',
    name: 'WA Admin - Member Baru',
    message: `👤 *MEMBER BARU!*

Nama: *{name}*
Email: {email}
HP: {phone}

📦 Membership: *{membershipName}*
💰 Harga: Rp {amount}

📅 Mulai: {startDate}
⏰ Berakhir: {expiryDate}

Status: *AKTIF* ✅

🔗 Lihat profil:
{profileUrl}

*Admin EksporYuk*`,
    variables: JSON.stringify(['name', 'email', 'phone', 'membershipName', 'amount', 'startDate', 'expiryDate', 'profileUrl']),
    isActive: true
  },

  // ========== COMMUNITY ==========
  {
    id: 'wa_event_reminder',
    name: 'WA Event - Reminder Acara',
    message: `🎉 *REMINDER EVENT*

Halo *{name}*!

Event Anda besok:

📌 *{eventName}*
📅 {eventDate}
🕐 {eventTime}
📍 {eventLocation}

✅ Jangan lupa:
{reminders}

🔗 Join event:
{eventUrl}

Sampai jumpa besok! 👋

*Tim EksporYuk*`,
    variables: JSON.stringify(['name', 'eventName', 'eventDate', 'eventTime', 'eventLocation', 'reminders', 'eventUrl']),
    isActive: true
  },

  {
    id: 'wa_feedback_request',
    name: 'WA Feedback - Minta Review',
    message: `⭐ *BANTU KAMI YUK!*

Halo *{name}*!

Gimana pengalaman Anda dengan:
*{productName}*

Kami ingin tahu feedback Anda! 😊

💬 Share pengalaman Anda:
{feedbackUrl}

Cuma butuh 2 menit kok!

Feedback Anda sangat berarti buat kami dan member lain 💙

Terima kasih banyak!

*Tim EksporYuk*`,
    variables: JSON.stringify(['name', 'productName', 'feedbackUrl']),
    isActive: true
  }
];

async function main() {
  console.log('🌱 Seeding WhatsApp templates...');
  
  for (const template of whatsappTemplates) {
    await prisma.whatsAppTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
    console.log(`✅ Created/Updated: ${template.name}`);
  }
  
  console.log('\n✨ WhatsApp templates seeded successfully!');
  console.log(`📱 Total templates: ${whatsappTemplates.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
