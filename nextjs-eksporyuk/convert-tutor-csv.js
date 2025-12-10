/**
 * ============================================
 * TUTOR LMS CSV CONVERTER
 * ============================================
 * 
 * Script untuk convert CSV export dari Tutor LMS/WP All Export
 * ke format JSON yang bisa digunakan migrate-tutor-lms.js
 * 
 * CARA PENGGUNAAN:
 * 1. Export data dari Tutor LMS menggunakan WP All Export ke CSV
 * 2. Simpan file CSV:
 *    - courses.csv (data kursus)
 *    - topics.csv (data modul/topik)
 *    - lessons.csv (data pelajaran)
 * 3. Jalankan: node convert-tutor-csv.js
 * 4. Lanjutkan: node migrate-tutor-lms.js
 * 
 * FORMAT CSV YANG DIHARAPKAN:
 * 
 * courses.csv:
 * id,title,slug,description,thumbnail,price,level
 * 
 * topics.csv:
 * id,title,description,course_id,order
 * 
 * lessons.csv:
 * id,title,content,video_url,duration,topic_id,order,is_free
 */

const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  coursesFile: 'courses.csv',
  topicsFile: 'topics.csv',
  lessonsFile: 'lessons.csv',
  outputFile: 'tutor-lms-data.json',
  verbose: true
}

function log(message) {
  if (CONFIG.verbose) {
    console.log(message)
  }
}

function parseCSV(content) {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = parseCSVLine(lines[0])
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row = {}
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = values[j] || ''
    }
    
    data.push(row)
  }
  
  return data
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function readCSVFile(filename) {
  const filePath = path.join(__dirname, filename)
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  const content = fs.readFileSync(filePath, 'utf8')
  return parseCSV(content)
}

async function main() {
  console.log('='.repeat(60))
  console.log('   TUTOR LMS CSV → JSON CONVERTER')
  console.log('='.repeat(60))
  console.log('')
  
  // Read CSV files
  const courses = readCSVFile(CONFIG.coursesFile)
  const topics = readCSVFile(CONFIG.topicsFile)
  const lessons = readCSVFile(CONFIG.lessonsFile)
  
  // Check files
  const missingFiles = []
  if (!courses) missingFiles.push(CONFIG.coursesFile)
  if (!topics) missingFiles.push(CONFIG.topicsFile)
  if (!lessons) missingFiles.push(CONFIG.lessonsFile)
  
  if (missingFiles.length > 0) {
    console.log('❌ Missing CSV files:')
    missingFiles.forEach(f => console.log(`   - ${f}`))
    console.log('')
    console.log('📝 Please export from Tutor LMS and save CSV files:')
    console.log('')
    console.log('   courses.csv columns:')
    console.log('   id, title, slug, description, thumbnail, price, level')
    console.log('')
    console.log('   topics.csv columns:')
    console.log('   id, title, description, course_id, order')
    console.log('')
    console.log('   lessons.csv columns:')
    console.log('   id, title, content, video_url, duration, topic_id, order, is_free')
    console.log('')
    
    // Create sample files
    log('🔧 Creating sample CSV templates...')
    
    const sampleCourses = `id,title,slug,description,thumbnail,price,level
1,"Ekspor Pemula","ekspor-pemula","<p>Belajar dasar ekspor</p>","https://example.com/thumb.jpg",0,beginner
2,"Ekspor Lanjutan","ekspor-lanjutan","<p>Materi lanjutan</p>","",499000,intermediate`
    
    const sampleTopics = `id,title,description,course_id,order
1,"Modul 1: Pengenalan","Dasar-dasar ekspor",1,1
2,"Modul 2: Dokumen","Dokumen ekspor",1,2
3,"Modul 1: Advanced","Materi lanjutan",2,1`
    
    const sampleLessons = `id,title,content,video_url,duration,topic_id,order,is_free
1,"Apa itu Ekspor?","<p>Penjelasan ekspor...</p>","https://youtube.com/watch?v=xxx",10,1,1,true
2,"Manfaat Ekspor","<p>Manfaat untuk ekonomi...</p>","",15,1,2,false
3,"Invoice Ekspor","<p>Cara membuat invoice...</p>","https://youtube.com/watch?v=yyy",20,2,1,false`
    
    fs.writeFileSync(path.join(__dirname, CONFIG.coursesFile), sampleCourses)
    fs.writeFileSync(path.join(__dirname, CONFIG.topicsFile), sampleTopics)
    fs.writeFileSync(path.join(__dirname, CONFIG.lessonsFile), sampleLessons)
    
    console.log('✅ Sample CSV files created')
    console.log('')
    console.log('📌 Edit the CSV files with your data, then run this script again')
    return
  }
  
  log(`📊 Found:`)
  log(`   - ${courses.length} courses`)
  log(`   - ${topics.length} topics`)
  log(`   - ${lessons.length} lessons`)
  log('')
  
  // Build hierarchical structure
  const outputCourses = []
  
  for (const course of courses) {
    const courseData = {
      wp_id: parseInt(course.id) || null,
      title: course.title || 'Untitled Course',
      slug: course.slug || null,
      description: course.description || '',
      thumbnail: course.thumbnail || null,
      price: parseFloat(course.price) || 0,
      level: mapLevel(course.level),
      modules: []
    }
    
    // Find topics for this course
    const courseTopics = topics.filter(t => 
      String(t.course_id) === String(course.id)
    ).sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0))
    
    for (const topic of courseTopics) {
      const moduleData = {
        wp_id: parseInt(topic.id) || null,
        title: topic.title || 'Untitled Module',
        description: topic.description || null,
        order: parseInt(topic.order) || 1,
        lessons: []
      }
      
      // Find lessons for this topic
      const topicLessons = lessons.filter(l =>
        String(l.topic_id) === String(topic.id)
      ).sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0))
      
      for (const lesson of topicLessons) {
        const lessonData = {
          wp_id: parseInt(lesson.id) || null,
          title: lesson.title || 'Untitled Lesson',
          content: lesson.content || '',
          videoUrl: lesson.video_url || null,
          duration: parseInt(lesson.duration) || null,
          order: parseInt(lesson.order) || 1,
          isFree: lesson.is_free === 'true' || lesson.is_free === '1' || lesson.is_free === true,
          files: []
        }
        
        moduleData.lessons.push(lessonData)
      }
      
      courseData.modules.push(moduleData)
    }
    
    outputCourses.push(courseData)
  }
  
  // Save to JSON
  const outputData = { courses: outputCourses }
  const outputPath = path.join(__dirname, CONFIG.outputFile)
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2))
  
  // Summary
  let totalModules = 0
  let totalLessons = 0
  
  for (const course of outputCourses) {
    totalModules += course.modules.length
    for (const module of course.modules) {
      totalLessons += module.lessons.length
    }
  }
  
  console.log('')
  console.log('='.repeat(60))
  console.log('   CONVERSION COMPLETE')
  console.log('='.repeat(60))
  console.log('')
  console.log(`   📚 Courses:    ${outputCourses.length}`)
  console.log(`   📁 Modules:    ${totalModules}`)
  console.log(`   📄 Lessons:    ${totalLessons}`)
  console.log('')
  console.log(`   📝 Output: ${CONFIG.outputFile}`)
  console.log('')
  console.log('📌 Next step:')
  console.log('   Run: node migrate-tutor-lms.js')
  console.log('')
}

function mapLevel(level) {
  const mapping = {
    'beginner': 'BEGINNER',
    'intermediate': 'INTERMEDIATE',
    'advanced': 'ADVANCED',
    'expert': 'EXPERT',
    'pemula': 'BEGINNER',
    'menengah': 'INTERMEDIATE',
    'lanjutan': 'ADVANCED'
  }
  return mapping[level?.toLowerCase()] || 'BEGINNER'
}

main()
