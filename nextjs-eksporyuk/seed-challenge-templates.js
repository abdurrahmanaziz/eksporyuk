const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const CHALLENGE_EMAIL_TEMPLATES = [
  {
    name: 'Challenge Announcement',
    slug: 'challenge-announcement',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '🎯 Tantangan Baru: {challenge_name}',
    content: `Halo {affiliate_name},

Selamat! Ada tantangan baru yang menarik untuk Anda:

**{challenge_name}**

{challenge_description}

📊 Detail Tantangan:
- Target: {target_value} {target_type}
- Periode: {start_date} sampai {end_date}
- Hadiah: {reward_value} {reward_type}

🚀 Ikuti tantangan ini dan raih hadiah menarik!

Jangan lewatkan kesempatan emas ini untuk meningkatkan penghasilan Anda.

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Tantangan',
    ctaLink: '{challenge_link}',
    tags: ['challenge', 'announcement', 'affiliate-engagement'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true,
    variables: {
      'challenge_name': 'Nama tantangan',
      'challenge_description': 'Deskripsi lengkap tantangan',
      'target_value': 'Nilai target yang harus dicapai',
      'target_type': 'Tipe target (Sales, Revenue, Clicks, dll)',
      'start_date': 'Tanggal mulai tantangan',
      'end_date': 'Tanggal berakhir tantangan',
      'reward_value': 'Nilai hadiah',
      'reward_type': 'Tipe hadiah (Komisi Bonus, Uang Tunai, dll)',
      'challenge_link': 'Link ke detail tantangan',
      'affiliate_name': 'Nama affiliate',
      'site_name': 'Nama platform'
    }
  },

  {
    name: 'Challenge Joined',
    slug: 'challenge-joined',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '✅ Anda Sudah Bergabung dengan Tantangan: {challenge_name}',
    content: `Halo {affiliate_name},

Selamat! Anda telah berhasil bergabung dengan tantangan:

**{challenge_name}**

Target Anda: {target_value} {target_type}
Periode: {start_date} sampai {end_date}
Hadiah: {reward_value} {reward_type}

💡 Tips untuk Berhasil:
- Fokus pada kualitas, bukan hanya kuantitas
- Pantau progress Anda secara reguler
- Gunakan semua alat pemasaran yang tersedia

📈 Pantau Progress Anda:
Progress saat ini: {current_value} / {target_value} {target_type}

Anda bisa melihat leaderboard dan detail tantangan melalui dashboard Anda.

Semoga Anda mencapai target! 🚀

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Dashboard Tantangan',
    ctaLink: '{dashboard_link}',
    tags: ['challenge', 'joined', 'confirmation'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true,
    variables: {
      'challenge_name': 'Nama tantangan',
      'affiliate_name': 'Nama affiliate',
      'target_value': 'Nilai target',
      'target_type': 'Tipe target',
      'start_date': 'Tanggal mulai',
      'end_date': 'Tanggal berakhir',
      'reward_value': 'Nilai hadiah',
      'reward_type': 'Tipe hadiah',
      'current_value': 'Progress saat ini',
      'dashboard_link': 'Link ke dashboard tantangan',
      'site_name': 'Nama platform'
    }
  },

  {
    name: 'Challenge Progress Update',
    slug: 'challenge-progress-update',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '📊 Update Progress Tantangan: {challenge_name}',
    content: `Halo {affiliate_name},

Ini adalah update progress Anda untuk tantangan:

**{challenge_name}**

📈 Progress Anda:
- Telah dicapai: {current_value} {target_type}
- Target: {target_value} {target_type}
- Persentase: {progress_percentage}%

⏰ Sisa Waktu: {days_remaining} hari

🎯 Strategi untuk Mencapai Target:
Anda sudah {progress_percentage}% menuju target! Terus tingkatkan upaya pemasaran Anda untuk mencapai {target_value} {target_type}.

Leaderboard saat ini:
Peringkat Anda: #{ranking}

Terus semangat! Anda bisa melakukannya! 💪

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Leaderboard Lengkap',
    ctaLink: '{leaderboard_link}',
    tags: ['challenge', 'progress', 'milestone'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true,
    variables: {
      'challenge_name': 'Nama tantangan',
      'affiliate_name': 'Nama affiliate',
      'current_value': 'Progress saat ini',
      'target_value': 'Target yang harus dicapai',
      'target_type': 'Tipe target',
      'progress_percentage': 'Persentase progress (0-100)',
      'days_remaining': 'Jumlah hari yang tersisa',
      'ranking': 'Peringkat di leaderboard',
      'leaderboard_link': 'Link ke leaderboard',
      'site_name': 'Nama platform'
    }
  },

  {
    name: 'Challenge Completed',
    slug: 'challenge-completed',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '🎉 Selamat! Anda Berhasil Menyelesaikan Tantangan: {challenge_name}',
    content: `Halo {affiliate_name},

Selamat! Anda telah berhasil menyelesaikan tantangan!

**{challenge_name}**

✅ Anda mencapai target: {target_value} {target_type}
📅 Tanggal selesai: {completed_date}
🏆 Hadiah yang diterima: {reward_value} {reward_type}

Prestasimu:
- Target diselesaikan dalam: {days_taken} hari
- Peringkat akhir: #{final_ranking}
- Hasil akhir: {final_value} {target_type}

🎁 Hadiah Anda:
Hadiah tantangan ini telah ditambahkan ke akun Anda. Silakan klaim hadiah melalui dashboard Anda.

Kami sangat menghargai dedikasi dan kerja kerasmu! Terus maintain momentum ini untuk tantangan berikutnya.

Ada tantangan menarik lainnya yang menunggu Anda! 🚀

Salam hangat,
Tim {site_name}`,
    ctaText: 'Klaim Hadiah & Lihat Tantangan Lain',
    ctaLink: '{rewards_link}',
    tags: ['challenge', 'completed', 'success', 'reward'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true,
    variables: {
      'challenge_name': 'Nama tantangan',
      'affiliate_name': 'Nama affiliate',
      'target_value': 'Target yang dicapai',
      'target_type': 'Tipe target',
      'completed_date': 'Tanggal penyelesaian',
      'reward_value': 'Nilai hadiah',
      'reward_type': 'Tipe hadiah',
      'days_taken': 'Jumlah hari untuk menyelesaikan',
      'final_ranking': 'Peringkat akhir',
      'final_value': 'Nilai akhir yang dicapai',
      'rewards_link': 'Link untuk klaim hadiah',
      'site_name': 'Nama platform'
    }
  },

  {
    name: 'Challenge Reward Claimed',
    slug: 'challenge-reward-claimed',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '💰 Permohonan Hadiah Diterima - {challenge_name}',
    content: `Halo {affiliate_name},

Kami telah menerima permohonan klaim hadiah Anda untuk tantangan:

**{challenge_name}**

📋 Detail Klaim:
- Hadiah: {reward_value} {reward_type}
- Status: Menunggu Persetujuan
- Tanggal Klaim: {claim_date}

⏱️ Proses Persetujuan:
Hadiah Anda sedang dalam proses verifikasi oleh tim admin kami. Biasanya persetujuan membutuhkan waktu 1-3 hari kerja.

Kami akan mengirimkan email konfirmasi setelah hadiah Anda disetujui.

Pertanyaan? Hubungi support kami di {support_email}

Terima kasih,
Tim {site_name}`,
    ctaText: 'Cek Status Klaim Anda',
    ctaLink: '{claim_status_link}',
    tags: ['challenge', 'reward', 'claim', 'pending'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true,
    variables: {
      'challenge_name': 'Nama tantangan',
      'affiliate_name': 'Nama affiliate',
      'reward_value': 'Nilai hadiah yang diklaim',
      'reward_type': 'Tipe hadiah',
      'claim_date': 'Tanggal pengajuan klaim',
      'claim_status_link': 'Link untuk melihat status klaim',
      'support_email': 'Email support',
      'site_name': 'Nama platform'
    }
  },

  {
    name: 'Challenge Reward Approved',
    slug: 'challenge-reward-approved',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '✅ Hadiah Tantangan Disetujui! - {challenge_name}',
    content: `Halo {affiliate_name},

Selamat! Hadiah tantangan Anda telah disetujui! 🎉

**{challenge_name}**

✅ Detail Hadiah yang Disetujui:
- Hadiah: {reward_value} {reward_type}
- Status: ✅ Disetujui
- Tanggal Persetujuan: {approval_date}

💰 Hadiah Anda Telah Ditambahkan:
Hadiah sebesar {reward_value} telah ditambahkan ke akun Anda.

📊 Update Wallet Anda:
- Hadiah Masuk: {reward_value} {reward_type}
- Total Earnings: {total_earnings}

Anda bisa menarik hadiah ini kapan saja melalui menu Penarikan di dashboard Anda.

Terima kasih atas prestasi luar biasa Anda! 🏆

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Wallet Anda',
    ctaLink: '{wallet_link}',
    tags: ['challenge', 'reward', 'approved', 'success'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true,
    variables: {
      'challenge_name': 'Nama tantangan',
      'affiliate_name': 'Nama affiliate',
      'reward_value': 'Nilai hadiah yang disetujui',
      'reward_type': 'Tipe hadiah',
      'approval_date': 'Tanggal persetujuan',
      'total_earnings': 'Total earnings affiliate',
      'wallet_link': 'Link ke halaman wallet',
      'site_name': 'Nama platform'
    }
  },

  {
    name: 'Challenge Reward Rejected',
    slug: 'challenge-reward-rejected',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '⚠️ Hadiah Tantangan Ditolak - {challenge_name}',
    content: `Halo {affiliate_name},

Kami ingin memberitahu bahwa permohonan hadiah untuk tantangan Anda telah ditolak.

**{challenge_name}**

❌ Detail Penolakan:
- Hadiah: {reward_value} {reward_type}
- Status: Ditolak
- Alasan: {rejection_reason}
- Tanggal: {rejection_date}

📝 Apa yang Harus Dilakukan:
Silakan periksa alasan penolakan di atas. Jika Anda merasa ada kesalahan, silakan hubungi tim support kami untuk mendiskusikan lebih lanjut.

📧 Hubungi Support Kami:
Email: {support_email}
Telepon/WhatsApp: {support_phone}

Tim support kami siap membantu Anda menyelesaikan masalah ini.

Terima kasih atas pengertian Anda,
Tim {site_name}`,
    ctaText: 'Hubungi Support',
    ctaLink: '{support_link}',
    tags: ['challenge', 'reward', 'rejected', 'appeal'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true,
    variables: {
      'challenge_name': 'Nama tantangan',
      'affiliate_name': 'Nama affiliate',
      'reward_value': 'Nilai hadiah yang ditolak',
      'reward_type': 'Tipe hadiah',
      'rejection_reason': 'Alasan penolakan',
      'rejection_date': 'Tanggal penolakan',
      'support_email': 'Email support',
      'support_phone': 'Nomor telepon/WhatsApp support',
      'support_link': 'Link ke form kontak support',
      'site_name': 'Nama platform'
    }
  },

  {
    name: 'Challenge Failed/Expired',
    slug: 'challenge-failed-expired',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '⏰ Tantangan Telah Berakhir - {challenge_name}',
    content: `Halo {affiliate_name},

Periode tantangan telah berakhir:

**{challenge_name}**

❌ Status: Tantangan Berakhir

📊 Hasil Akhir Anda:
- Target: {target_value} {target_type}
- Pencapaian Anda: {final_value} {target_type}
- Persentase: {progress_percentage}%
- Tanggal Berakhir: {end_date}

Meskipun Anda belum mencapai target kali ini, prestasi Anda tetap luar biasa! Anda telah mencapai {progress_percentage}% dari target.

🚀 Tantangan Baru Menunggu:
Jangan berkecil hati! Ada tantangan menarik lainnya yang sedang berlangsung. Ambil kesempatan untuk meningkatkan performa Anda di tantangan berikutnya.

Kami yakin Anda akan berhasil! 💪

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Tantangan Terbaru',
    ctaLink: '{challenges_link}',
    tags: ['challenge', 'expired', 'failed', 'encouragement'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true,
    variables: {
      'challenge_name': 'Nama tantangan',
      'affiliate_name': 'Nama affiliate',
      'target_value': 'Target yang ditetapkan',
      'target_type': 'Tipe target',
      'final_value': 'Nilai akhir yang dicapai',
      'progress_percentage': 'Persentase progress akhir',
      'end_date': 'Tanggal berakhirnya tantangan',
      'challenges_link': 'Link ke daftar tantangan aktif',
      'site_name': 'Nama platform'
    }
  }
]

async function seedChallengeTemplates() {
  try {
    console.log('🌱 Starting challenge email template seeding...\n')

    let created = 0
    let skipped = 0

    for (const template of CHALLENGE_EMAIL_TEMPLATES) {
      try {
        // Check if template already exists
        const existing = await prisma.brandedTemplate.findFirst({
          where: { slug: template.slug }
        })

        if (existing) {
          console.log(`⏭️  SKIPPED: "${template.name}" (already exists)`)
          skipped++
          continue
        }

        // Create new template
        const newTemplate = await prisma.brandedTemplate.create({
          data: {
            id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...template,
            updatedAt: new Date()
          }
        })

        console.log(`✅ CREATED: "${newTemplate.name}" (${newTemplate.slug})`)
        created++
      } catch (err) {
        console.error(`❌ ERROR creating "${template.name}":`, err.message)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 SEEDING SUMMARY')
    console.log('='.repeat(50))
    console.log(`✅ Created: ${created} templates`)
    console.log(`⏭️  Skipped: ${skipped} templates (already exist)`)
    console.log(`📦 Total: ${CHALLENGE_EMAIL_TEMPLATES.length} templates in seed`)

    // Verify results
    const totalChallengeTemplates = await prisma.brandedTemplate.count({
      where: {
        OR: [
          { slug: { contains: 'challenge' } },
          { name: { contains: 'Challenge' } }
        ]
      }
    })

    const totalAffiliateTemplates = await prisma.brandedTemplate.count({
      where: { category: 'AFFILIATE' }
    })

    console.log('\n' + '='.repeat(50))
    console.log('📈 DATABASE VERIFICATION')
    console.log('='.repeat(50))
    console.log(`📌 Total Challenge Templates: ${totalChallengeTemplates}`)
    console.log(`📌 Total AFFILIATE Templates: ${totalAffiliateTemplates}`)

    // Check for duplicates
    const duplicates = await prisma.brandedTemplate.groupBy({
      by: ['slug'],
      where: {
        OR: [
          { slug: { contains: 'challenge' } },
          { name: { contains: 'Challenge' } }
        ]
      },
      _count: {
        id: true
      }
    })

    const duplicateCount = duplicates.filter(d => d._count.id > 1)

    if (duplicateCount.length > 0) {
      console.log('\n⚠️  DUPLICATES FOUND:')
      duplicateCount.forEach(d => {
        console.log(`  - "${d.slug}": ${d._count.id} occurrences`)
      })
    } else {
      console.log('\n✅ No duplicates found!')
    }

    console.log('\n✨ Challenge template seeding completed successfully!')
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedChallengeTemplates()
