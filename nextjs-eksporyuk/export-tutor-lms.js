/**
 * ============================================
 * TUTOR LMS DATA EXPORTER
 * ============================================
 * 
 * Script untuk export data dari Tutor LMS WordPress via REST API
 * 
 * CARA PENGGUNAAN:
 * 1. Edit konfigurasi di bawah (WORDPRESS_URL, credentials)
 * 2. Jalankan: node export-tutor-lms.js
 * 3. Data akan disimpan di: tutor-lms-data.json
 * 4. Lanjutkan dengan: node migrate-tutor-lms.js
 * 
 * REQUIREMENTS:
 * - WordPress REST API harus aktif
 * - Plugin Tutor LMS terinstall
 * - User dengan akses API (Admin/Instructor)
 */

const fs = require('fs')
const path = require('path')

// ============================================
// KONFIGURASI - EKSPORYUK TUTOR LMS
// ============================================

const CONFIG = {
  // URL WordPress
  wordpressUrl: 'https://member.eksporyuk.com',
  
  // Tutor LMS API Key/Secret
  apiKey: 'key_e2078f63c7bd0f8a8bb6a5c7a1f4e71f',
  apiSecret: 'secret_4bcce69ccaa4b6f40044861b8f4b200b04d73193d44a1c99f8a9a607c4d905a0',
  
  // Output file
  outputFile: 'tutor-lms-data.json',
  
  // Options
  includeUnpublished: false, // Include draft courses?
  includeAttachments: true,  // Include file attachments?
  verbose: true              // Show detailed logs?
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function log(message) {
  if (CONFIG.verbose) {
    console.log(message)
  }
}

function getAuthHeader() {
  // Use Tutor LMS API Key authentication
  return { 
    'Authorization': `Basic ${Buffer.from(`${CONFIG.apiKey}:${CONFIG.apiSecret}`).toString('base64')}`,
    'X-API-KEY': CONFIG.apiKey,
    'X-API-SECRET': CONFIG.apiSecret
  }
}

async function fetchAPI(endpoint, useTutorAuth = false) {
  const url = `${CONFIG.wordpressUrl}/wp-json${endpoint}`
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
    
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      // Try without auth for public endpoints
      if (response.status === 401) {
        const publicResponse = await fetch(url, {
          headers: { 'Content-Type': 'application/json' }
        })
        if (publicResponse.ok) {
          return await publicResponse.json()
        }
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    log(`❌ Failed to fetch ${endpoint}: ${error.message}`)
    return null
  }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

async function getCourses() {
  log('\n📚 Fetching courses...')
  
  const status = CONFIG.includeUnpublished ? 'any' : 'publish'
  let allCourses = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const response = await fetchAPI(`/tutor/v1/courses?per_page=100&page=${page}&status=${status}`)
    
    // Handle different response formats
    let courses = []
    if (Array.isArray(response)) {
      courses = response
    } else if (response && response.data && Array.isArray(response.data)) {
      courses = response.data
    } else if (response && response.posts && Array.isArray(response.posts)) {
      courses = response.posts
    } else if (response && typeof response === 'object') {
      // Maybe it's an object with course objects
      courses = Object.values(response).filter(item => item && typeof item === 'object' && item.id)
    }
    
    if (!courses || courses.length === 0) {
      hasMore = false
    } else {
      allCourses = [...allCourses, ...courses]
      page++
      
      // Safety limit
      if (page > 50) hasMore = false
    }
  }
  
  log(`   Found ${allCourses.length} course(s)`)
  return allCourses
}

async function getTopics(courseId) {
  const topics = await fetchAPI(`/tutor/v1/course-topic/${courseId}`)
  return topics || []
}

async function getLessons(topicId) {
  const lessons = await fetchAPI(`/tutor/v1/topic-contents/${topicId}`)
  return lessons || []
}

async function getLessonDetail(lessonId) {
  const lesson = await fetchAPI(`/tutor/v1/lesson/${lessonId}`)
  return lesson
}

async function getAttachments(lessonId) {
  const attachments = await fetchAPI(`/tutor/v1/lesson-attachments/${lessonId}`)
  return attachments || []
}

function mapLevel(tutorLevel) {
  const mapping = {
    'beginner': 'BEGINNER',
    'intermediate': 'INTERMEDIATE',
    'advanced': 'ADVANCED',
    'expert': 'EXPERT',
    'all_levels': 'BEGINNER'
  }
  return mapping[tutorLevel?.toLowerCase()] || 'BEGINNER'
}

async function exportCourse(course) {
  log(`\n  📖 Processing: ${course.title?.rendered || course.title}`)
  
  const courseData = {
    wp_id: course.id,
    title: course.title?.rendered || course.title,
    slug: course.slug,
    description: course.content?.rendered || course.description || '',
    thumbnail: course.featured_media_url || course.thumbnail_url || null,
    price: parseFloat(course.price || 0),
    originalPrice: parseFloat(course.regular_price || course.price || 0),
    level: mapLevel(course.difficulty_level || course.level),
    duration: course.course_duration || null,
    modules: []
  }
  
  // Get topics (modules)
  const topics = await getTopics(course.id)
  log(`     Found ${topics.length} topic(s)`)
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    
    const moduleData = {
      wp_id: topic.id,
      title: topic.title?.rendered || topic.title || `Modul ${i + 1}`,
      description: topic.summary || topic.description || null,
      order: i + 1,
      lessons: []
    }
    
    // Get lessons
    const lessons = await getLessons(topic.id)
    log(`       Topic "${moduleData.title}": ${lessons.length} lesson(s)`)
    
    for (let j = 0; j < lessons.length; j++) {
      const lesson = lessons[j]
      
      // Get full lesson detail
      const lessonDetail = await getLessonDetail(lesson.id) || lesson
      
      const lessonData = {
        wp_id: lesson.id,
        title: lessonDetail.title?.rendered || lessonDetail.title || `Lesson ${j + 1}`,
        content: lessonDetail.content?.rendered || lessonDetail.content || '',
        videoUrl: extractVideoUrl(lessonDetail),
        duration: parseInt(lessonDetail.video_duration || lessonDetail.duration || 0) || null,
        order: j + 1,
        isFree: lessonDetail.is_preview === true || lessonDetail.is_preview === '1',
        files: []
      }
      
      // Get attachments
      if (CONFIG.includeAttachments) {
        const attachments = await getAttachments(lesson.id)
        
        for (const att of attachments) {
          lessonData.files.push({
            title: att.title || att.filename,
            fileName: att.filename || att.title,
            fileUrl: att.url || att.source_url,
            fileSize: att.filesize || null,
            fileType: att.mime_type || null
          })
        }
      }
      
      moduleData.lessons.push(lessonData)
    }
    
    courseData.modules.push(moduleData)
  }
  
  return courseData
}

function extractVideoUrl(lesson) {
  // Check for Tutor LMS video array structure
  if (lesson.video && Array.isArray(lesson.video) && lesson.video.length > 0) {
    const videoData = lesson.video[0]
    // Check different sources in order of preference
    if (videoData.source_youtube) return videoData.source_youtube
    if (videoData.source_vimeo) return videoData.source_vimeo
    if (videoData.source_external_url) return videoData.source_external_url
    if (videoData.source_embedded) return videoData.source_embedded
  }
  
  // Try different video source fields (legacy/alternative)
  const videoSources = [
    lesson.video?.source_url,
    lesson.video_info?.source_url,
    lesson._video,
    lesson.video_url,
    lesson.youtube_url,
    lesson.vimeo_url,
    lesson.external_url
  ]
  
  for (const source of videoSources) {
    if (source && typeof source === 'string' && source.length > 0) {
      return source
    }
  }
  
  // Check for embedded video in content
  const content = lesson.post_content || lesson.content?.rendered || lesson.content || ''
  const youtubeMatch = content.match(/youtube\.com\/(?:embed\/|watch\?v=)([a-zA-Z0-9_-]+)/)
  if (youtubeMatch) {
    return `https://www.youtube.com/watch?v=${youtubeMatch[1]}`
  }
  
  const vimeoMatch = content.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    return `https://vimeo.com/${vimeoMatch[1]}`
  }
  
  return null
}

// Extract video duration in minutes from Tutor LMS runtime object
function extractVideoDuration(lesson) {
  if (lesson.video && Array.isArray(lesson.video) && lesson.video.length > 0) {
    const runtime = lesson.video[0].runtime
    if (runtime) {
      const hours = parseInt(runtime.hours || 0)
      const minutes = parseInt(runtime.minutes || 0)
      const seconds = parseInt(runtime.seconds || 0)
      return hours * 60 + minutes + Math.ceil(seconds / 60)
    }
  }
  return null
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('='.repeat(60))
  console.log('   TUTOR LMS DATA EXPORTER')
  console.log('='.repeat(60))
  console.log('')
  console.log(`🌐 WordPress URL: ${CONFIG.wordpressUrl}`)
  console.log('')
  
  // Check if URL is still default
  if (CONFIG.wordpressUrl.includes('your-wordpress-site.com')) {
    console.log('❌ Please edit the script and set your WordPress URL')
    console.log('')
    console.log('   Open: export-tutor-lms.js')
    console.log('   Edit: CONFIG.wordpressUrl = "https://your-actual-site.com"')
    console.log('   Edit: CONFIG.username and CONFIG.applicationPassword')
    return
  }
  
  try {
    // Get courses via WordPress REST API (public endpoint)
    log('🔗 Fetching courses from WordPress...')
    
    const wpCourses = await fetchAPI('/wp/v2/courses?per_page=100&_embed')
    
    if (!wpCourses || !Array.isArray(wpCourses) || wpCourses.length === 0) {
      console.log('')
      console.log('⚠️  No courses found')
      console.log('')
      return
    }
    
    log(`✅ Found ${wpCourses.length} courses via WP REST API`)
    
    // Process courses
    const exportedCourses = []
    
    for (const course of wpCourses) {
      log(`\n  📖 Processing: ${course.title?.rendered || course.title}`)
      
      const courseData = {
        wp_id: course.id,
        title: course.title?.rendered || course.title,
        slug: course.slug,
        description: course.content?.rendered || course.excerpt?.rendered || '',
        thumbnail: course.featured_media_url || course._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        price: 0,
        level: 'BEGINNER',
        modules: []
      }
      
      // Get course contents (topics) using Tutor API
      const courseContents = await fetchAPI(`/tutor/v1/course-contents/${course.id}`)
      
      if (courseContents && courseContents.data && Array.isArray(courseContents.data)) {
        log(`     Found ${courseContents.data.length} topic(s)`)
        
        for (let i = 0; i < courseContents.data.length; i++) {
          const topic = courseContents.data[i]
          
          const moduleData = {
            wp_id: topic.id,
            title: topic.title || `Modul ${i + 1}`,
            description: topic.summary || null,
            order: i + 1,
            lessons: []
          }
          
          // Fetch lessons with video data from /tutor/v1/lessons?topic_id=
          const lessonsWithVideo = await fetchAPI(`/tutor/v1/lessons?topic_id=${topic.id}`)
          
          if (lessonsWithVideo && lessonsWithVideo.data && Array.isArray(lessonsWithVideo.data)) {
            log(`       Topic "${moduleData.title}": ${lessonsWithVideo.data.length} lesson(s) with video`)
            
            for (let j = 0; j < lessonsWithVideo.data.length; j++) {
              const lesson = lessonsWithVideo.data[j]
              
              // Only process lessons (not quizzes, etc.)
              if (lesson.post_type === 'lesson' || !lesson.post_type) {
                const videoUrl = extractVideoUrl(lesson)
                const duration = extractVideoDuration(lesson)
                
                moduleData.lessons.push({
                  wp_id: lesson.ID || lesson.id,
                  title: lesson.post_title || lesson.title || `Lesson ${j + 1}`,
                  content: lesson.post_content || '',
                  videoUrl: videoUrl,
                  duration: duration,
                  order: j + 1,
                  isFree: lesson.is_preview === true || lesson.is_preview === '1' || lesson._tutor_is_preview === '1',
                  files: lesson.attachments || []
                })
                
                if (videoUrl) {
                  log(`         ✅ Video found: ${lesson.post_title?.slice(0, 40)}...`)
                }
              }
            }
          } else {
            // Fallback: use contents from course-contents endpoint (without video)
            if (topic.contents && Array.isArray(topic.contents)) {
              log(`       Topic "${moduleData.title}": ${topic.contents.length} item(s) (no video data)`)
              
              for (let j = 0; j < topic.contents.length; j++) {
                const item = topic.contents[j]
                
                if (item.post_type === 'lesson' || !item.post_type) {
                  moduleData.lessons.push({
                    wp_id: item.ID || item.id,
                    title: item.post_title || item.title || `Lesson ${j + 1}`,
                    content: item.post_content || '',
                    videoUrl: extractVideoUrl(item),
                    duration: null,
                    order: j + 1,
                    isFree: item.is_preview === true || item.is_preview === '1',
                    files: []
                  })
                }
              }
            }
          }
          
          courseData.modules.push(moduleData)
        }
      } else {
        log(`     No course contents found`)
      }
      
      exportedCourses.push(courseData)
    }
    
    // Save to file
    const outputData = { courses: exportedCourses }
    const outputPath = path.join(__dirname, CONFIG.outputFile)
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2))
    
    // Summary
    let totalModules = 0
    let totalLessons = 0
    
    for (const course of exportedCourses) {
      totalModules += course.modules.length
      for (const module of course.modules) {
        totalLessons += module.lessons.length
      }
    }
    
    console.log('')
    console.log('='.repeat(60))
    console.log('   EXPORT COMPLETE')
    console.log('='.repeat(60))
    console.log('')
    console.log(`   📚 Courses:     ${exportedCourses.length}`)
    console.log(`   📁 Modules:     ${totalModules}`)
    console.log(`   📄 Lessons:     ${totalLessons}`)
    console.log('')
    console.log(`   📝 Output file: ${CONFIG.outputFile}`)
    console.log('')
    console.log('📌 Next step:')
    console.log('   Run: node migrate-tutor-lms.js')
    console.log('')
    
  } catch (error) {
    console.error('')
    console.error('❌ Export failed:', error.message)
    console.error('')
  }
}

main()
