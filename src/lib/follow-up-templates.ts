/**
 * DEFAULT FOLLOW UP TEMPLATES
 * 3 Template WhatsApp untuk mengingatkan pembayaran
 * Digunakan oleh affiliate dan sales admin
 * Note: Menggunakan emoji standar yang kompatibel dengan WhatsApp
 */

export const DEFAULT_FOLLOW_UP_TEMPLATES = [
  {
    title: 'Hari Pertama',
    description: 'Follow up H+1 setelah checkout - Pengingat pertama dengan pendekatan ramah',
    sequenceOrder: 1,
    emailSubject: 'Pengingat Pembayaran {plan_name}',
    emailBody: 'Silakan selesaikan pembayaran Anda.',
    whatsappMessage: `Halo Kak {first_name}!

Perkenalkan saya {affiliate_name} dari EksporYuk.

Terima kasih sudah mendaftar *{plan_name}*

Saya cek pembayarannya belum selesai nih, Kak. Apakah ada kendala saat mau bayar?

Kalau ada pertanyaan seputar:
- Cara pembayaran
- Benefit yang didapat
- Atau hal lainnya

Silakan chat saya langsung ya! Saya bantu.

*Link Pembayaran:*
{payment_link}

Ditunggu ya Kak!`,
  },
  {
    title: 'Hari Kedua',
    description: 'Follow up H+2 setelah checkout - Pengingat dengan highlight benefit',
    sequenceOrder: 2,
    emailSubject: 'Jangan Lewatkan {plan_name}!',
    emailBody: 'Pembayaran Anda belum selesai.',
    whatsappMessage: `Halo Kak {first_name}!

{affiliate_name} lagi nih dari EksporYuk.

Gimana Kak, sudah sempat bayar *{plan_name}*?

Sayang banget kalau dilewatin, karena Kakak bakal dapat:
- Akses semua materi premium
- Komunitas member eksklusif
- Bimbingan langsung dari mentor
- Sertifikat resmi

Banyak member kami yang sudah sukses ekspor lho!

Yuk segera selesaikan pembayarannya:
{payment_link}

Ada yang bisa saya bantu? Chat aja ya Kak!`,
  },
  {
    title: 'Hari Ketiga',
    description: 'Follow up H+3 setelah checkout - Pengingat terakhir dengan urgency',
    sequenceOrder: 3,
    emailSubject: 'Link Pembayaran Akan Expired',
    emailBody: 'Ini pengingat terakhir untuk pembayaran Anda.',
    whatsappMessage: `Halo Kak {first_name}!

{affiliate_name} disini.

Ini pengingat terakhir ya Kak, link pembayaran *{plan_name}* akan segera expired.

Sudah 3 hari sejak Kakak daftar, sayang banget kalau sampai hangus.

Kalau memang ada kendala atau pertanyaan, langsung chat saya aja ya. Saya bantu carikan solusinya!

*Bayar sekarang sebelum expired:*
{payment_link}

Semoga bisa segera bergabung ya Kak!

_Kalau memang belum waktunya, tidak apa-apa. Tapi link ini kesempatan terakhir ya._`,
  },
]

/**
 * Get default templates for seeding
 */
export function getDefaultFollowUpTemplates() {
  return DEFAULT_FOLLOW_UP_TEMPLATES
}
