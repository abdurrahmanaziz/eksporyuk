// Seed sample modules and lessons for courses
// Run: node seed-course-content.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding course content...\n');

  // Get all courses
  const courses = await prisma.course.findMany({
    select: { id: true, slug: true, title: true }
  });

  console.log(`Found ${courses.length} courses\n`);

  for (const course of courses) {
    // Check if course already has modules
    const existingModules = await prisma.courseModule.count({
      where: { courseId: course.id }
    });

    if (existingModules > 0) {
      console.log(`⏭️  ${course.title} already has ${existingModules} modules, skipping...`);
      continue;
    }

    console.log(`📚 Adding content to: ${course.title}`);

    // Create 3 modules with lessons for each course
    const modules = [
      {
        title: 'Modul 1: Pengenalan',
        description: 'Dasar-dasar dan pengenalan materi',
        order: 1,
        lessons: [
          { title: 'Pendahuluan', content: '<p>Selamat datang di kursus ini. Di lesson ini kita akan mempelajari dasar-dasar materi.</p>', duration: 10, isFree: true },
          { title: 'Mengapa Ini Penting?', content: '<p>Pelajari mengapa materi ini penting untuk karir Anda.</p>', duration: 15, isFree: true },
          { title: 'Persiapan yang Diperlukan', content: '<p>Apa saja yang perlu Anda siapkan sebelum memulai.</p>', duration: 12, isFree: false },
        ]
      },
      {
        title: 'Modul 2: Materi Inti',
        description: 'Pembahasan mendalam materi utama',
        order: 2,
        lessons: [
          { title: 'Konsep Dasar', content: '<p>Memahami konsep-konsep dasar yang fundamental.</p>', duration: 20, isFree: false },
          { title: 'Teknik dan Strategi', content: '<p>Berbagai teknik dan strategi yang bisa Anda terapkan.</p>', duration: 25, isFree: false },
          { title: 'Studi Kasus', content: '<p>Analisis studi kasus nyata dari industri.</p>', duration: 30, isFree: false },
          { title: 'Best Practices', content: '<p>Praktik terbaik yang telah terbukti berhasil.</p>', duration: 18, isFree: false },
        ]
      },
      {
        title: 'Modul 3: Praktik & Penutup',
        description: 'Latihan praktik dan kesimpulan',
        order: 3,
        lessons: [
          { title: 'Latihan Praktik 1', content: '<p>Latihan praktik pertama untuk mengasah kemampuan.</p>', duration: 35, isFree: false },
          { title: 'Latihan Praktik 2', content: '<p>Latihan lanjutan dengan tingkat kesulitan lebih tinggi.</p>', duration: 40, isFree: false },
          { title: 'Tips & Tricks', content: '<p>Tips dan tricks dari para ahli.</p>', duration: 15, isFree: false },
          { title: 'Kesimpulan & Next Steps', content: '<p>Rangkuman materi dan langkah selanjutnya.</p>', duration: 10, isFree: false },
        ]
      }
    ];

    for (const moduleData of modules) {
      const module = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
        }
      });

      console.log(`  ✅ Module: ${module.title}`);

      // Create lessons for this module
      for (let i = 0; i < moduleData.lessons.length; i++) {
        const lessonData = moduleData.lessons[i];
        const lesson = await prisma.courseLesson.create({
          data: {
            moduleId: module.id,
            title: lessonData.title,
            content: lessonData.content,
            duration: lessonData.duration,
            order: i + 1,
            isFree: lessonData.isFree,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Sample video
          }
        });
        console.log(`     📄 Lesson: ${lesson.title} (${lessonData.isFree ? 'Free' : 'Paid'})`);
      }
    }

    console.log('');
  }

  console.log('✅ Done seeding course content!');
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
