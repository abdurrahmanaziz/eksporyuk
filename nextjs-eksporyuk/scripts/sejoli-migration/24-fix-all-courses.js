/**
 * Fix ALL courses structure - move lessons to correct courses and modules
 * Based on Sejoli topic mapping
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Topics per course from Sejoli
const COURSE_STRUCTURE = {
  // Course ID 1678 - KELAS BIMBINGAN EKSPOR YUK (9 modules only, not including copies)
  'KELAS BIMBINGAN': {
    topics: [
      { id: 1681, title: 'Modul 1 : Pengenalan Tentang Ekspor', order: 1 },
      { id: 1682, title: 'Modul 2 : Demand & Komoditas', order: 2 },
      { id: 1683, title: 'Modul 3 : Suplier', order: 3 },
      { id: 1684, title: 'Modul 4 : Senjata Perang', order: 4 },
      { id: 1685, title: 'Modul 5 : Payment', order: 5 },
      { id: 1686, title: 'Modul 6 : Buyer', order: 6 },
      { id: 1687, title: 'Modul 7 : Forwarder', order: 7 },
      { id: 1799, title: 'Zoominar Bulanan', order: 8 },
      { id: 21519, title: 'Zoom Mingguan', order: 10 },
    ]
  },
  // Course ID 2984 - EKSPOR YUK AUTOMATION (EYA)
  'EKSPOR YUK AUTOMATION': {
    topics: [
      { id: 3287, title: 'JOIN GRUP TELEGRAM', order: 1 },
      { id: 2987, title: 'ORDER DAN AKTIVASI APLIKASI EYA', order: 2 },
      { id: 3013, title: 'FITURE DAN FUNGSI APLIKASI EYA', order: 4 },
      { id: 3318, title: 'SOLUSI-SOLUSI', order: 5 },
    ]
  },
  // Course ID 8692 - KELAS WEBSITE EKSPOR  
  'KELAS WEBSITE EKSPOR': {
    topics: [
      { id: 8822, title: 'Kelas Website Ekspor', order: 1 },
      { id: 10948, title: 'Zoom Praktek Website Ekspor', order: 2 },
    ]
  }
};

// Lesson keywords to determine which course they belong to
const LESSON_COURSE_MAPPING = {
  'EKSPOR YUK AUTOMATION': [
    'GRUP SUPPORT APLIKASI EYA',
    'Penjelasan Aplikasi EYA',
    'Cara Order Dan Konfirmasi Aplikasi',
    'Cara Download dan Ambil Lisensi EYA',
    'Google Search',
    'Google Maps',
    'Linkedin',
    'Kirim WhatsApp Otomatis',
    'Cara Kirim WhatsApp Manual',
    'Cara Kirim Email Otomatis',
    'Cara Kirim Email Manual',
    'Export data Dari EYA',
    'Solusi ID Perangkat',
    'Cara Daftar Aplikasi EYA',
    'Cara Login dan Aktivasi Lisensi',
  ],
  'KELAS WEBSITE EKSPOR': [
    'Persiapan Konten Website',
    'Istilah Dalam Website Ekspor',
    'Cara Klaim Hosting Free',
    'Cara Integrasi Hosting dan Domain',
    'Cara Mengatur PHP dn Cpanel',
    'Cara Membuat Email Bisnis',
    'Install Wordpress',
    'Setting Wordpress',
    'Install Themes',
    'Install Plugin',
    'Membuat Halaman dan Setting',
    'Pengenalan Fiture Elementor',
    'Desain Halaman Website',
    'Cara Setting Tampilan Website',
    'Cara Membuat Menu Website',
    'Cara Integrasi Email gmail',
    'Cara Akses Hosting di Domosquare',
    'Zoom Pembuatan Website dengan AI',
  ]
};

// Module keywords for KELAS BIMBINGAN
const KELAS_BIMBINGAN_MODULE_KEYWORDS = {
  1681: ['Welcome to Dunia Kontaineran', 'Kenapa Harus Ekspor', 'Mindset Eksportir', 'Ekspor itu Mudah', 'Alur Ekspor', 'Type Type Eksportir'],
  1682: ['Mengetahui Demand', 'Menentukan Komoditas', 'Jenis Komoditas', 'Negara Tujuan Ekspor', 'mencari demand', 'Product Knowledge', 'Spesifikasi komoditas', 'HS Code', 'Kategori Komoditas'],
  1683: ['Suplier', 'Tips Mencari Suplier', 'Sample Produk Suplier', 'Pembayaran dengan Suplier', 'Packaging', 'Kontrak Kerja dengan Suplier'],
  1684: ['Harga Jual Ekspor', 'Menghitung harga', 'Validasi harga', 'Company Profile', 'Katalog Produk', 'Quotation Letter', 'Legalitas Usaha', 'Rekening Perusahaan', 'Website Perusahaan', 'Email Perusahaan', 'Undername', 'Contoh Compro', 'Membuat Perusahaan', 'Membuat Website', 'Membuat Email', 'NPWP Badan', 'Izin Ekspor', 'CEISA', 'PO dan LOI', 'Menghitung harga Exwork', 'Menghitung harga FOB', 'Menghitung harga CNF', 'Menghitung harga CIF'],
  1685: ['Sistem Pembayaran', 'Payment yang aman', 'L/C', 'Kesalahan Eksportir Pemula', 'Proforma Invoice'],
  1686: ['Mendapatkan Buyer', 'Whatsapp Marketing', 'Email Marketing', 'Buyer Minta Sample', 'Down Payment', 'FCO', 'Commercial Invoice', 'FCL & LCL', 'SOP Ekspor', 'Mencari Buyer', 'Template Email ke Buyer', 'Surat Penawaran', 'Validasi Buyer', 'Buyer Scam', 'Shipping Instruction', 'INA EXPORT', 'TRADEATLAS', 'IMPORTYETI', 'MONICA AI', 'LUSHA', 'SKRAPP', 'TRADESNS', 'HUNTER IO', 'Linkedin'],
  1687: ['Forwarder', 'Dokumen yang harus Disiapkan', 'Dokumen yang Diurus', 'Tips Memilih Forwarder', 'Jenis-jenis Kontainer', 'Macam-macam Kontainer', 'Daya Muat Kontainer', 'Kendala Eksportir', 'Certificate of Origin', 'Tips Eksportir Pemula', 'Alur Setelah deal', 'Contoh Dokumen'],
  1799: ['Zoominar', 'Rekaman Zoominar', 'Pendampingan', 'Zoom Bimbingan', 'Sharing Ekspor', 'Zoom Tips', 'Harmonisasi', 'Teknik Komunikasi', 'Registrasi'],
  21519: ['Q&A Zoom', 'Zoom Materi', 'Zoom Mingguan'],
};

// Bonus/Panduan - should go to special module
const BONUS_KEYWORDS = [
  'Panduan Join Komunitas',
  'Daftar Komoditas Potensial',
  'Database Buyer',
  'Download Contoh',
  'File Shipping Instruction',
  'List Pertanyaan Supplier',
  'Template Email Buyer',
  'Rekomendasi Forwarder',
  'Contoh RAB',
  'KBLI',
  'JOIN GRUP SUPPORT',
];

async function fixAllCourses() {
  console.log('🔧 FIXING ALL COURSES STRUCTURE');
  console.log('================================\n');

  try {
    // Get all courses
    const courses = await prisma.course.findMany();
    console.log('Found', courses.length, 'courses\n');

    // Get KELAS BIMBINGAN course
    const kelasBimbingan = courses.find(c => c.title.includes('KELAS BIMBINGAN'));
    const eyaCourse = courses.find(c => c.title.includes('EKSPOR YUK AUTOMATION'));
    const websiteCourse = courses.find(c => c.title.includes('KELAS WEBSITE'));

    if (!kelasBimbingan || !eyaCourse || !websiteCourse) {
      console.log('❌ Missing courses');
      return;
    }

    // Get all lessons from KELAS BIMBINGAN (where everything is currently dumped)
    const allModules = await prisma.courseModule.findMany({
      where: { courseId: kelasBimbingan.id }
    });
    
    const allLessons = await prisma.courseLesson.findMany({
      where: { moduleId: { in: allModules.map(m => m.id) } }
    });

    console.log('📄 Total lessons in KELAS BIMBINGAN:', allLessons.length);

    // Step 1: Setup EYA modules
    console.log('\n📁 Setting up EYA modules...');
    const eyaModules = await setupModulesForCourse(eyaCourse.id, COURSE_STRUCTURE['EKSPOR YUK AUTOMATION'].topics);
    
    // Step 2: Setup Website modules  
    console.log('\n📁 Setting up Website modules...');
    const websiteModules = await setupModulesForCourse(websiteCourse.id, COURSE_STRUCTURE['KELAS WEBSITE EKSPOR'].topics);

    // Step 3: Get KELAS BIMBINGAN modules
    const bimbinganModules = await prisma.courseModule.findMany({
      where: { courseId: kelasBimbingan.id },
      orderBy: { order: 'asc' }
    });
    
    // Create map of topicId -> moduleId for KELAS BIMBINGAN
    const bimbinganModuleMap = {};
    for (const mod of bimbinganModules) {
      // Match based on title
      for (const topic of COURSE_STRUCTURE['KELAS BIMBINGAN'].topics) {
        if (mod.title.includes(topic.title.split(':')[0]) || mod.title === topic.title) {
          bimbinganModuleMap[topic.id] = mod.id;
          break;
        }
      }
    }

    // Step 4: Categorize and move lessons
    console.log('\n🔄 Categorizing lessons...');
    
    let movedToEYA = 0;
    let movedToWebsite = 0;
    let movedToBonus = 0;
    let reassignedInBimbingan = 0;

    for (const lesson of allLessons) {
      const title = lesson.title;
      
      // Check if belongs to EYA
      if (belongsToCourse(title, LESSON_COURSE_MAPPING['EKSPOR YUK AUTOMATION'])) {
        // Find correct module in EYA
        const targetModule = findModuleForLesson(title, eyaModules, {
          3287: ['GRUP SUPPORT', 'GRUP TELEGRAM'],
          2987: ['Order', 'Konfirmasi', 'Daftar', 'Login', 'Aktivasi Lisensi', 'Download', 'Ambil Lisensi'],
          3013: ['Google Search', 'Google Maps', 'Linkedin', 'WhatsApp', 'Email Otomatis', 'Email Manual', 'Export data'],
          3318: ['Solusi', 'ID Perangkat'],
        });
        
        if (targetModule) {
          await prisma.courseLesson.update({
            where: { id: lesson.id },
            data: { moduleId: targetModule.id }
          });
          movedToEYA++;
        }
        continue;
      }

      // Check if belongs to Website
      if (belongsToCourse(title, LESSON_COURSE_MAPPING['KELAS WEBSITE EKSPOR'])) {
        const targetModule = findModuleForLesson(title, websiteModules, {
          8822: ['Hosting', 'Domain', 'SSL', 'PHP', 'Cpanel', 'Email Bisnis', 'Wordpress', 'Themes', 'Plugin', 'Halaman', 'Elementor', 'Desain', 'SEO', 'Menu Website', 'Persiapan Konten', 'Istilah', 'Domosquare'],
          10948: ['Zoom Pembuatan Website', 'Zoom Praktek'],
        });
        
        if (targetModule) {
          await prisma.courseLesson.update({
            where: { id: lesson.id },
            data: { moduleId: targetModule.id }
          });
          movedToWebsite++;
        }
        continue;
      }

      // Otherwise, it belongs to KELAS BIMBINGAN - find correct module
      const targetModule = findCorrectBimbinganModule(title, bimbinganModules, KELAS_BIMBINGAN_MODULE_KEYWORDS);
      
      if (targetModule && lesson.moduleId !== targetModule.id) {
        await prisma.courseLesson.update({
          where: { id: lesson.id },
          data: { moduleId: targetModule.id }
        });
        reassignedInBimbingan++;
      }
    }

    console.log(`\n✅ Moved to EYA: ${movedToEYA}`);
    console.log(`✅ Moved to Website: ${movedToWebsite}`);
    console.log(`✅ Reassigned in KELAS BIMBINGAN: ${reassignedInBimbingan}`);

    // Step 5: Print final stats
    console.log('\n\n📊 FINAL STATS:');
    console.log('================');
    
    for (const course of [kelasBimbingan, eyaCourse, websiteCourse]) {
      const modules = await prisma.courseModule.findMany({
        where: { courseId: course.id },
        orderBy: { order: 'asc' }
      });
      
      console.log(`\n📚 ${course.title}`);
      
      for (const mod of modules) {
        const count = await prisma.courseLesson.count({ where: { moduleId: mod.id } });
        console.log(`   📂 ${mod.title}: ${count} lessons`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function setupModulesForCourse(courseId, topics) {
  // Delete existing modules
  const existing = await prisma.courseModule.findMany({ where: { courseId } });
  
  // Get lessons attached to these modules first
  if (existing.length > 0) {
    // Can't delete if lessons attached, so just update/create
  }

  const modules = [];
  for (const topic of topics) {
    // Check if module exists
    let mod = await prisma.courseModule.findFirst({
      where: { 
        courseId,
        title: topic.title
      }
    });

    if (!mod) {
      // Create new module
      mod = await prisma.courseModule.create({
        data: {
          courseId,
          title: topic.title,
          order: topic.order
        }
      });
    }
    
    modules.push({ ...mod, topicId: topic.id });
    console.log(`  ✅ ${topic.title}`);
  }
  
  return modules;
}

function belongsToCourse(title, keywords) {
  const titleLower = title.toLowerCase();
  return keywords.some(kw => titleLower.includes(kw.toLowerCase()));
}

function findModuleForLesson(title, modules, keywordMap) {
  const titleLower = title.toLowerCase();
  
  for (const mod of modules) {
    const keywords = keywordMap[mod.topicId] || [];
    if (keywords.some(kw => titleLower.includes(kw.toLowerCase()))) {
      return mod;
    }
  }
  
  // Default to first module
  return modules[0];
}

function findCorrectBimbinganModule(title, modules, keywordMap) {
  const titleLower = title.toLowerCase();
  
  for (const [topicId, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => titleLower.includes(kw.toLowerCase()))) {
      // Find module with matching topicId pattern
      const mod = modules.find(m => {
        const topicNum = parseInt(topicId);
        if (topicNum <= 1687) {
          const modulNum = topicNum - 1680; // 1681 -> 1, 1682 -> 2, etc
          return m.title.includes(`Modul ${modulNum}`);
        }
        if (topicNum === 1799) return m.title.includes('Zoominar Bulanan');
        if (topicNum === 21519) return m.title.includes('Zoom Mingguan');
        return false;
      });
      return mod;
    }
  }
  
  // Check for bonus keywords - put in Module 1 for now (or create Bonus module)
  if (BONUS_KEYWORDS.some(kw => titleLower.includes(kw.toLowerCase()))) {
    return modules.find(m => m.title.includes('Modul 1'));
  }
  
  return null;
}

fixAllCourses().catch(console.error);
