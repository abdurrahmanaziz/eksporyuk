/**
 * ============================================
 * TUTOR LMS → EKSPORYUK MIGRATION SCRIPT
 * ============================================
 * 
 * Script ini digunakan untuk migrasi data dari Tutor LMS (WordPress)
 * ke sistem LMS Eksporyuk.
 * 
 * CARA PENGGUNAAN:
 * 1. Export data dari Tutor LMS ke file JSON (lihat TUTOR_LMS_MIGRATION_GUIDE.md)
 * 2. Simpan data di file: tutor-lms-data.json
 * 3. Jalankan: node migrate-tutor-lms.js
 * 
 * STRUKTUR DATA INPUT (tutor-lms-data.json):
 * {
 *   "courses": [
 *     {
 *       "title": "Nama Kursus",
 *       "slug": "nama-kursus",
 *       "description": "<p>Deskripsi...</p>",
 *       "thumbnail": "https://...",
 *       "price": 0,
 *       "level": "BEGINNER",
 *       "modules": [
 *         {
 *           "title": "Modul 1",
 *           "description": "Deskripsi modul",
 *           "order": 1,
 *           "lessons": [
 *             {
 *               "title": "Lesson 1",
 *               "content": "<p>Konten...</p>",
 *               "videoUrl": "https://youtube.com/...",
 *               "duration": 15,
 *               "order": 1,
 *               "isFree": true,
 *               "files": [
 *                 { "title": "PDF Guide", "fileName": "guide.pdf", "fileUrl": "https://..." }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Configuration
const CONFIG = {
  // File JSON yang berisi data dari Tutor LMS
  dataFile: 'tutor-lms-data.json',
  
  // Default mentor ID (akan diassign jika tidak ada mentor)
  defaultMentorId: null,
  
  // Mapping level dari Tutor LMS ke Eksporyuk
  levelMapping: {
    'beginner': 'BEGINNER',
    'intermediate': 'INTERMEDIATE', 
    'advanced': 'ADVANCED',
    'expert': 'EXPERT',
    'pemula': 'BEGINNER',
    'menengah': 'INTERMEDIATE',
    'lanjutan': 'ADVANCED',
    'ahli': 'EXPERT'
  },
  
  // Log progress
  verbose: true
}

function log(message) {
  if (CONFIG.verbose) {
    console.log(message)
  }
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function getOrCreateDefaultMentor() {
  // Check if there's an existing mentor
  const existingMentor = await prisma.mentorProfile.findFirst({
    orderBy: { createdAt: 'asc' }
  })
  
  if (existingMentor) {
    log(`✅ Using existing mentor: ${existingMentor.id}`)
    return existingMentor.id
  }
  
  // Check if admin exists
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!adminUser) {
    throw new Error('No admin user found. Please create an admin first.')
  }
  
  // Create mentor profile for admin
  const mentorProfile = await prisma.mentorProfile.create({
    data: {
      userId: adminUser.id,
      expertise: ['Ekspor', 'Import', 'Bisnis'],
      bio: 'Admin & Mentor Eksporyuk'
    }
  })
  
  log(`✅ Created new mentor profile: ${mentorProfile.id}`)
  return mentorProfile.id
}

async function migrateCourses(courses, mentorId) {
  const results = {
    coursesCreated: 0,
    modulesCreated: 0,
    lessonsCreated: 0,
    filesCreated: 0,
    errors: []
  }
  
  for (const courseData of courses) {
    try {
      log(`\n📚 Processing course: ${courseData.title}`)
      
      // Generate slug if not provided
      let slug = courseData.slug || generateSlug(courseData.title)
      
      // Check if slug already exists
      const existingCourse = await prisma.course.findUnique({
        where: { slug }
      })
      
      if (existingCourse) {
        slug = `${slug}-${Date.now()}`
        log(`  ⚠️ Slug already exists, using: ${slug}`)
      }
      
      // Map level
      const level = courseData.level 
        ? (CONFIG.levelMapping[courseData.level.toLowerCase()] || 'BEGINNER')
        : 'BEGINNER'
      
      // Create course
      const course = await prisma.course.create({
        data: {
          mentorId: mentorId,
          title: courseData.title,
          slug: slug,
          description: courseData.description || `Kursus ${courseData.title}`,
          thumbnail: courseData.thumbnail || null,
          price: courseData.price || 0,
          originalPrice: courseData.originalPrice || null,
          level: level,
          duration: courseData.duration || null,
          status: 'DRAFT', // Default to draft so admin can review
          monetizationType: courseData.price > 0 ? 'PAID' : 'FREE',
          isPublished: false, // Admin will publish after review
        }
      })
      
      log(`  ✅ Course created: ${course.id}`)
      results.coursesCreated++
      
      // Create modules
      if (courseData.modules && courseData.modules.length > 0) {
        for (const moduleData of courseData.modules) {
          try {
            const module = await prisma.courseModule.create({
              data: {
                courseId: course.id,
                title: moduleData.title,
                description: moduleData.description || null,
                order: moduleData.order || 1
              }
            })
            
            log(`    📁 Module created: ${moduleData.title}`)
            results.modulesCreated++
            
            // Create lessons
            if (moduleData.lessons && moduleData.lessons.length > 0) {
              for (const lessonData of moduleData.lessons) {
                try {
                  const lesson = await prisma.courseLesson.create({
                    data: {
                      moduleId: module.id,
                      title: lessonData.title,
                      content: lessonData.content || '',
                      videoUrl: lessonData.videoUrl || null,
                      duration: lessonData.duration || null,
                      order: lessonData.order || 1,
                      isFree: lessonData.isFree || false
                    }
                  })
                  
                  log(`      📄 Lesson created: ${lessonData.title}`)
                  results.lessonsCreated++
                  
                  // Create files
                  if (lessonData.files && lessonData.files.length > 0) {
                    for (const fileData of lessonData.files) {
                      try {
                        await prisma.lessonFile.create({
                          data: {
                            lessonId: lesson.id,
                            title: fileData.title,
                            fileName: fileData.fileName,
                            fileUrl: fileData.fileUrl,
                            fileSize: fileData.fileSize || null,
                            fileType: fileData.fileType || null,
                            order: fileData.order || 0
                          }
                        })
                        
                        log(`        📎 File attached: ${fileData.title}`)
                        results.filesCreated++
                      } catch (fileError) {
                        results.errors.push(`File error: ${fileError.message}`)
                      }
                    }
                  }
                  
                } catch (lessonError) {
                  results.errors.push(`Lesson error (${lessonData.title}): ${lessonError.message}`)
                }
              }
            }
            
          } catch (moduleError) {
            results.errors.push(`Module error (${moduleData.title}): ${moduleError.message}`)
          }
        }
      }
      
    } catch (courseError) {
      results.errors.push(`Course error (${courseData.title}): ${courseError.message}`)
    }
  }
  
  return results
}

async function main() {
  console.log('='.repeat(60))
  console.log('   TUTOR LMS → EKSPORYUK MIGRATION')
  console.log('='.repeat(60))
  console.log('')
  
  // Check if data file exists
  const dataFilePath = path.join(__dirname, CONFIG.dataFile)
  
  if (!fs.existsSync(dataFilePath)) {
    console.log(`❌ Data file not found: ${CONFIG.dataFile}`)
    console.log('')
    console.log('📝 Please create the file with your Tutor LMS data.')
    console.log('   See TUTOR_LMS_MIGRATION_GUIDE.md for the required format.')
    console.log('')
    console.log('🔧 Creating sample template file...')
    
    // Create sample template
    const sampleData = {
      courses: [
        {
          title: "Ekspor Pemula - Contoh",
          slug: "ekspor-pemula-contoh",
          description: "<p>Contoh kursus dari Tutor LMS. Edit data ini dengan data asli Anda.</p>",
          thumbnail: null,
          price: 0,
          level: "BEGINNER",
          modules: [
            {
              title: "Modul 1: Pengenalan",
              description: "Modul pengenalan ekspor",
              order: 1,
              lessons: [
                {
                  title: "Apa itu Ekspor?",
                  content: "<p>Ekspor adalah kegiatan mengeluarkan barang dari wilayah pabean Indonesia ke luar negeri.</p>",
                  videoUrl: "https://www.youtube.com/watch?v=EXAMPLE",
                  duration: 10,
                  order: 1,
                  isFree: true,
                  files: []
                },
                {
                  title: "Mengapa Ekspor Penting?",
                  content: "<p>Ekspor penting untuk ekonomi nasional karena...</p>",
                  videoUrl: null,
                  duration: 15,
                  order: 2,
                  isFree: false,
                  files: []
                }
              ]
            },
            {
              title: "Modul 2: Persiapan Ekspor",
              description: "Persiapan sebelum memulai ekspor",
              order: 2,
              lessons: [
                {
                  title: "Dokumen yang Diperlukan",
                  content: "<p>Dokumen-dokumen yang wajib disiapkan:</p><ul><li>Invoice</li><li>Packing List</li><li>Bill of Lading</li></ul>",
                  videoUrl: null,
                  duration: 20,
                  order: 1,
                  isFree: false,
                  files: [
                    {
                      title: "Template Invoice Ekspor",
                      fileName: "template-invoice.pdf",
                      fileUrl: "https://example.com/template-invoice.pdf"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(sampleData, null, 2))
    console.log(`✅ Sample file created: ${CONFIG.dataFile}`)
    console.log('')
    console.log('📌 Next steps:')
    console.log('   1. Edit tutor-lms-data.json with your actual data')
    console.log('   2. Run: node migrate-tutor-lms.js')
    
    await prisma.$disconnect()
    return
  }
  
  // Read data file
  let data
  try {
    const fileContent = fs.readFileSync(dataFilePath, 'utf8')
    data = JSON.parse(fileContent)
  } catch (parseError) {
    console.log(`❌ Error parsing JSON file: ${parseError.message}`)
    await prisma.$disconnect()
    return
  }
  
  if (!data.courses || data.courses.length === 0) {
    console.log('❌ No courses found in data file')
    await prisma.$disconnect()
    return
  }
  
  console.log(`📊 Found ${data.courses.length} course(s) to migrate`)
  console.log('')
  
  // Get or create mentor
  const mentorId = await getOrCreateDefaultMentor()
  
  // Run migration
  const results = await migrateCourses(data.courses, mentorId)
  
  // Print results
  console.log('')
  console.log('='.repeat(60))
  console.log('   MIGRATION RESULTS')
  console.log('='.repeat(60))
  console.log('')
  console.log(`   📚 Courses created:  ${results.coursesCreated}`)
  console.log(`   📁 Modules created:  ${results.modulesCreated}`)
  console.log(`   📄 Lessons created:  ${results.lessonsCreated}`)
  console.log(`   📎 Files attached:   ${results.filesCreated}`)
  console.log('')
  
  if (results.errors.length > 0) {
    console.log(`   ⚠️  Errors: ${results.errors.length}`)
    results.errors.forEach((err, idx) => {
      console.log(`      ${idx + 1}. ${err}`)
    })
    console.log('')
  }
  
  console.log('='.repeat(60))
  console.log('')
  console.log('📌 Next steps:')
  console.log('   1. Go to /admin/courses to review imported courses')
  console.log('   2. Edit course details if needed')
  console.log('   3. Click "Publish" to make courses available')
  console.log('')
  
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Migration error:', e)
  await prisma.$disconnect()
  process.exit(1)
})
