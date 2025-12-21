/**
 * SEED SCRIPT: Supplier Assessment Questions
 * 
 * Membuat bank pertanyaan assessment untuk setiap supplier type.
 * Setiap supplier type memiliki pertanyaan yang berbeda untuk evaluasi kualitas.
 * 
 * Scoring System:
 * - RANGE: Normalize to 0-10 scale
 * - ABC: A=10, B=7, C=4
 * - NUMBER: Direct score (max 10)
 * - TEXT/MULTIPLE_CHOICE: Manual review by mentor
 * 
 * Usage:
 * node seed-supplier-assessment.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// PRODUSEN: Produsen barang/produk untuk ekspor
const PRODUSEN_QUESTIONS = [
  {
    supplierType: 'PRODUSEN',
    category: 'Kapasitas Produksi',
    question: 'Berapa kapasitas produksi bulanan Anda? (dalam unit/kg)',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 100000,
      unit: 'unit/kg'
    }),
    weight: 2,
    order: 1,
    isActive: true
  },
  {
    supplierType: 'PRODUSEN',
    category: 'Kapasitas Produksi',
    question: 'Apakah Anda mampu meningkatkan kapasitas produksi jika ada permintaan besar?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, dapat meningkat 50-100%',
      B: 'Ya, dapat meningkat 20-50%',
      C: 'Tidak, kapasitas tetap'
    }),
    weight: 2,
    order: 2,
    isActive: true,
  },
  {
    supplierType: 'PRODUSEN',
    category: 'Kualitas & Sertifikasi',
    question: 'Apakah produk Anda memiliki sertifikasi standar internasional?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, memiliki sertifikasi internasional (ISO, HACCP, dll)',
      B: 'Ya, memiliki sertifikasi nasional (SNI, Halal, dll)',
      C: 'Belum memiliki sertifikasi'
    }),
    weight: 3,
    order: 3,
    isActive: true,
  },
  {
    supplierType: 'PRODUSEN',
    category: 'Kualitas & Sertifikasi',
    question: 'Bagaimana sistem quality control Anda?',
    questionType: 'TEXT',
    options: null,
    weight: 2,
    order: 4,
    isActive: true,
  },
  {
    supplierType: 'PRODUSEN',
    category: 'Pengalaman Ekspor',
    question: 'Berapa lama pengalaman Anda dalam produksi?',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 50,
      unit: 'tahun'
    }),
    weight: 2,
    order: 5,
    isActive: true,
  },
  {
    supplierType: 'PRODUSEN',
    category: 'Pengalaman Ekspor',
    question: 'Apakah Anda pernah melakukan ekspor sebelumnya?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, rutin ekspor (>5 kali/tahun)',
      B: 'Ya, pernah ekspor (<5 kali/tahun)',
      C: 'Belum pernah ekspor'
    }),
    weight: 2,
    order: 6,
    isActive: true,
  },
  {
    supplierType: 'PRODUSEN',
    category: 'Pengalaman Ekspor',
    question: 'Jika pernah ekspor, ke negara mana saja? (Sebutkan)',
    questionType: 'TEXT',
    options: null,
    weight: 1,
    order: 7,
    isActive: true,
  }
]

// PABRIK: Pabrik dengan mesin produksi besar
const PABRIK_QUESTIONS = [
  {
    supplierType: 'PABRIK',
    category: 'Fasilitas Produksi',
    question: 'Berapa kapasitas produksi pabrik Anda per bulan? (dalam ton/unit)',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 1000000,
      unit: 'ton/unit'
    }),
    weight: 3,
    order: 1,
    isActive: true,
  },
  {
    supplierType: 'PABRIK',
    category: 'Fasilitas Produksi',
    question: 'Apakah pabrik Anda memiliki mesin modern dan otomatis?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, 80-100% otomatis dengan teknologi modern',
      B: 'Ya, 50-80% otomatis, sebagian manual',
      C: 'Sebagian besar manual'
    }),
    weight: 2,
    order: 2,
    isActive: true,
  },
  {
    supplierType: 'PABRIK',
    category: 'Fasilitas Produksi',
    question: 'Berapa jumlah tenaga kerja di pabrik Anda?',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 10000,
      unit: 'orang'
    }),
    weight: 1,
    order: 3,
    isActive: true,
  },
  {
    supplierType: 'PABRIK',
    category: 'Kualitas & Standar',
    question: 'Apakah pabrik Anda memiliki sertifikasi ISO atau standar internasional lainnya?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, memiliki ISO 9001 + sertifikasi internasional lainnya',
      B: 'Ya, memiliki sertifikasi nasional (SNI, HACCP, dll)',
      C: 'Belum memiliki sertifikasi'
    }),
    weight: 3,
    order: 4,
    isActive: true,
  },
  {
    supplierType: 'PABRIK',
    category: 'Kualitas & Standar',
    question: 'Jelaskan sistem Quality Control dan Quality Assurance di pabrik Anda',
    questionType: 'TEXT',
    options: null,
    weight: 2,
    order: 5,
    isActive: true,
  },
  {
    supplierType: 'PABRIK',
    category: 'Pengalaman & Kapabilitas',
    question: 'Berapa lama pabrik Anda sudah beroperasi?',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 100,
      unit: 'tahun'
    }),
    weight: 2,
    order: 6,
    isActive: true,
  },
  {
    supplierType: 'PABRIK',
    category: 'Pengalaman & Kapabilitas',
    question: 'Apakah pabrik Anda memiliki pengalaman memproduksi untuk brand internasional?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, rutin produksi untuk 5+ brand internasional',
      B: 'Ya, pernah produksi untuk 1-4 brand internasional',
      C: 'Belum pernah'
    }),
    weight: 2,
    order: 7,
    isActive: true,
  }
]

// TRADER: Pedagang/eksportir
const TRADER_QUESTIONS = [
  {
    supplierType: 'TRADER',
    category: 'Network & Sumber Produk',
    question: 'Berapa banyak supplier/produsen yang menjadi partner Anda?',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 1000,
      unit: 'supplier'
    }),
    weight: 2,
    order: 1,
    isActive: true,
  },
  {
    supplierType: 'TRADER',
    category: 'Network & Sumber Produk',
    question: 'Bagaimana Anda memastikan kualitas produk dari supplier Anda?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Punya tim QC khusus yang visit supplier & test produk',
      B: 'Verifikasi sampel produk sebelum order besar',
      C: 'Berdasarkan kepercayaan supplier'
    }),
    weight: 3,
    order: 2,
    isActive: true,
  },
  {
    supplierType: 'TRADER',
    category: 'Network & Sumber Produk',
    question: 'Jelaskan sistem sourcing dan vendor management Anda',
    questionType: 'TEXT',
    options: null,
    weight: 2,
    order: 3,
    isActive: true,
  },
  {
    supplierType: 'TRADER',
    category: 'Pengalaman Ekspor',
    question: 'Berapa lama pengalaman Anda sebagai trader/eksportir?',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 50,
      unit: 'tahun'
    }),
    weight: 2,
    order: 4,
    isActive: true,
  },
  {
    supplierType: 'TRADER',
    category: 'Pengalaman Ekspor',
    question: 'Ke berapa negara Anda sudah pernah ekspor?',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 100,
      unit: 'negara'
    }),
    weight: 3,
    order: 5,
    isActive: true,
  },
  {
    supplierType: 'TRADER',
    category: 'Pengalaman Ekspor',
    question: 'Berapa volume ekspor Anda per tahun? (dalam USD)',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 100000000,
      unit: 'USD'
    }),
    weight: 2,
    order: 6,
    isActive: true,
  },
  {
    supplierType: 'TRADER',
    category: 'Market Knowledge',
    question: 'Apakah Anda memiliki pengetahuan tentang regulasi ekspor di negara tujuan?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, sangat memahami regulasi di 10+ negara',
      B: 'Ya, memahami regulasi di 3-9 negara',
      C: 'Masih belajar tentang regulasi ekspor'
    }),
    weight: 2,
    order: 7,
    isActive: true,
  },
  {
    supplierType: 'TRADER',
    category: 'Market Knowledge',
    question: 'Sebutkan negara tujuan ekspor utama Anda dan produk yang paling laris',
    questionType: 'TEXT',
    options: null,
    weight: 2,
    order: 8,
    isActive: true,
  }
]

// AGGREGATOR: Pengumpul/konsolidator dari berbagai supplier
const AGGREGATOR_QUESTIONS = [
  {
    supplierType: 'AGGREGATOR',
    category: 'Network Supplier',
    question: 'Berapa banyak supplier yang tergabung dalam network Anda?',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 10000,
      unit: 'supplier'
    }),
    weight: 3,
    order: 1,
    isActive: true,
  },
  {
    supplierType: 'AGGREGATOR',
    category: 'Network Supplier',
    question: 'Bagaimana sistem verifikasi supplier yang Anda terapkan?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Verifikasi ketat dengan audit on-site & sertifikasi wajib',
      B: 'Verifikasi dokumen & sampel produk',
      C: 'Verifikasi dasar (KTP & legalitas usaha)'
    }),
    weight: 3,
    order: 2,
    isActive: true,
  },
  {
    supplierType: 'AGGREGATOR',
    category: 'Network Supplier',
    question: 'Jelaskan sistem onboarding dan kualifikasi supplier di platform Anda',
    questionType: 'TEXT',
    options: null,
    weight: 2,
    order: 3,
    isActive: true,
  },
  {
    supplierType: 'AGGREGATOR',
    category: 'Logistik & Konsolidasi',
    question: 'Apakah Anda memiliki warehouse atau pusat konsolidasi sendiri?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, memiliki warehouse di 3+ lokasi strategis',
      B: 'Ya, memiliki 1-2 warehouse',
      C: 'Tidak, bekerjasama dengan pihak ketiga'
    }),
    weight: 2,
    order: 4,
    isActive: true,
  },
  {
    supplierType: 'AGGREGATOR',
    category: 'Logistik & Konsolidasi',
    question: 'Berapa kapasitas konsolidasi Anda per bulan? (dalam ton/CBM)',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 100000,
      unit: 'ton/CBM'
    }),
    weight: 2,
    order: 5,
    isActive: true,
  },
  {
    supplierType: 'AGGREGATOR',
    category: 'Quality Control',
    question: 'Bagaimana sistem quality control untuk produk dari berbagai supplier?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Tim QC dedicated dengan lab testing untuk setiap batch',
      B: 'Sampling inspection sebelum konsolidasi',
      C: 'Mengandalkan quality check dari supplier'
    }),
    weight: 3,
    order: 6,
    isActive: true,
  },
  {
    supplierType: 'AGGREGATOR',
    category: 'Quality Control',
    question: 'Jelaskan standard operating procedure (SOP) untuk handling complain produk',
    questionType: 'TEXT',
    options: null,
    weight: 2,
    order: 7,
    isActive: true,
  },
  {
    supplierType: 'AGGREGATOR',
    category: 'Pengalaman & Track Record',
    question: 'Berapa lama Anda beroperasi sebagai aggregator?',
    questionType: 'RANGE',
    options: JSON.stringify({
      min: 0,
      max: 50,
      unit: 'tahun'
    }),
    weight: 2,
    order: 8,
    isActive: true,
  },
  {
    supplierType: 'AGGREGATOR',
    category: 'Pengalaman & Track Record',
    question: 'Apakah Anda memiliki platform digital untuk manage supplier & order?',
    questionType: 'ABC',
    options: JSON.stringify({
      A: 'Ya, platform digital terintegrasi penuh (ERP/custom system)',
      B: 'Ya, menggunakan tools standar (Excel, WhatsApp, email)',
      C: 'Belum, masih manual'
    }),
    weight: 2,
    order: 9,
    isActive: true,
  }
]

async function main() {
  console.log('🚀 Starting Supplier Assessment Questions Seeding...\n')

  try {
    // Combine all questions
    const allQuestions = [
      ...PRODUSEN_QUESTIONS,
      ...PABRIK_QUESTIONS,
      ...TRADER_QUESTIONS,
      ...AGGREGATOR_QUESTIONS
    ]

    console.log(`📊 Total questions to seed: ${allQuestions.length}`)
    console.log(`   - PRODUSEN: ${PRODUSEN_QUESTIONS.length} questions`)
    console.log(`   - PABRIK: ${PABRIK_QUESTIONS.length} questions`)
    console.log(`   - TRADER: ${TRADER_QUESTIONS.length} questions`)
    console.log(`   - AGGREGATOR: ${AGGREGATOR_QUESTIONS.length} questions\n`)

    // Check for existing questions
    const existingCount = await prisma.supplierAssessmentQuestion.count()
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing questions`)
      console.log('   Options:')
      console.log('   1. Delete existing and reseed (DANGEROUS!)')
      console.log('   2. Skip seeding (safe)')
      console.log('')
      console.log('   Defaulting to SKIP to prevent data loss.')
      console.log('   If you want to reseed, manually delete questions first:')
      console.log('   await prisma.supplierAssessmentQuestion.deleteMany({})')
      console.log('')
      return
    }

    // Seed questions
    let created = 0
    for (const q of allQuestions) {
      // Convert null to undefined for Prisma
      const data = { ...q }
      if (data.options === null) {
        delete data.options
      }
      
      await prisma.supplierAssessmentQuestion.create({
        data
      })
      created++
      process.stdout.write(`\r   Creating questions... ${created}/${allQuestions.length}`)
    }

    console.log('\n\n✅ Seeding complete!\n')

    // Show summary
    const summary = await prisma.supplierAssessmentQuestion.groupBy({
      by: ['supplierType'],
      _count: true
    })

    console.log('📈 Summary by Supplier Type:')
    for (const item of summary) {
      console.log(`   - ${item.supplierType}: ${item._count} questions`)
    }

    console.log('\n🎯 Next Steps:')
    console.log('   1. Test assessment flow: /api/supplier/assessment/questions?supplierType=PRODUSEN')
    console.log('   2. Create frontend assessment form')
    console.log('   3. Test mentor review flow')
    console.log('')

  } catch (error) {
    console.error('❌ Error seeding questions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
