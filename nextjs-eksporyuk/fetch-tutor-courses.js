/**
 * Fetch Tutor LMS Courses from WordPress Database
 * 
 * REQUIREMENTS:
 * 1. SSH Tunnel harus aktif: ssh -L 3307:127.0.0.1:3306 aziz@103.125.181.47 -N
 * 2. Install mysql2: npm install mysql2
 * 
 * USAGE:
 * node fetch-tutor-courses.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');

// Database config from .env.wp
const DB_CONFIG = {
  host: process.env.WP_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.WP_DB_PORT || '3307'),
  user: process.env.WP_DB_USER || 'aziz_member.eksporyuk.com',
  password: process.env.WP_DB_PASSWORD || 'E%ds(xRh3T]AA|Qh',
  database: process.env.WP_DB_NAME || 'aziz_member.eksporyuk.com',
  connectTimeout: 30000,
};

const TABLE_PREFIX = process.env.WP_TABLE_PREFIX || 'wp_';

async function fetchTutorCourses() {
  console.log('🔌 Connecting to WordPress Database via SSH Tunnel...');
  console.log(`   Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  console.log(`   Database: ${DB_CONFIG.database}\n`);

  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database!\n');

    // 1. Fetch all courses (post_type = courses in Tutor LMS)
    console.log('📚 Fetching Courses...');
    const [courses] = await connection.execute(`
      SELECT 
        p.ID as id,
        p.post_title as title,
        p.post_name as slug,
        p.post_content as description,
        p.post_excerpt as short_description,
        p.post_status as status,
        p.post_date as created_at,
        p.post_modified as updated_at,
        p.post_author as author_id,
        u.display_name as author_name
      FROM ${TABLE_PREFIX}posts p
      LEFT JOIN ${TABLE_PREFIX}users u ON p.post_author = u.ID
      WHERE p.post_type = 'courses'
      AND p.post_status = 'publish'
      ORDER BY p.post_date DESC
    `);
    
    console.log(`   Found ${courses.length} courses\n`);

    // 2. For each course, fetch topics and lessons
    const fullCourses = [];
    
    for (const course of courses) {
      console.log(`\n📖 Processing: ${course.title}`);
      
      // Fetch course meta
      const [courseMeta] = await connection.execute(`
        SELECT meta_key, meta_value
        FROM ${TABLE_PREFIX}postmeta
        WHERE post_id = ?
      `, [course.id]);
      
      const meta = {};
      courseMeta.forEach(m => { meta[m.meta_key] = m.meta_value; });
      
      // Fetch topics (sections) for this course
      const [topics] = await connection.execute(`
        SELECT 
          p.ID as id,
          p.post_title as title,
          p.post_name as slug,
          p.menu_order as order_index
        FROM ${TABLE_PREFIX}posts p
        WHERE p.post_type = 'topics'
        AND p.post_parent = ?
        AND p.post_status = 'publish'
        ORDER BY p.menu_order ASC
      `, [course.id]);
      
      console.log(`   Topics: ${topics.length}`);
      
      // For each topic, fetch lessons
      const topicsWithLessons = [];
      
      for (const topic of topics) {
        const [lessons] = await connection.execute(`
          SELECT 
            p.ID as id,
            p.post_title as title,
            p.post_name as slug,
            p.post_content as content,
            p.menu_order as order_index
          FROM ${TABLE_PREFIX}posts p
          WHERE p.post_type = 'lesson'
          AND p.post_parent = ?
          AND p.post_status = 'publish'
          ORDER BY p.menu_order ASC
        `, [topic.id]);
        
        // Fetch lesson meta (video URL, duration, etc)
        const lessonsWithMeta = [];
        for (const lesson of lessons) {
          const [lessonMeta] = await connection.execute(`
            SELECT meta_key, meta_value
            FROM ${TABLE_PREFIX}postmeta
            WHERE post_id = ?
            AND meta_key IN ('_video', '_tutor_course_duration', '_lesson_attachments', '_video_source', '_video_source_external_url', '_video_source_embedded')
          `, [lesson.id]);
          
          const lessonMetaObj = {};
          lessonMeta.forEach(m => { lessonMetaObj[m.meta_key] = m.meta_value; });
          
          lessonsWithMeta.push({
            ...lesson,
            videoUrl: lessonMetaObj._video_source_external_url || lessonMetaObj._video || null,
            videoSource: lessonMetaObj._video_source || 'external_url',
            videoEmbed: lessonMetaObj._video_source_embedded || null,
            duration: lessonMetaObj._tutor_course_duration || null,
            attachments: lessonMetaObj._lesson_attachments ? JSON.parse(lessonMetaObj._lesson_attachments) : [],
          });
        }
        
        topicsWithLessons.push({
          ...topic,
          lessons: lessonsWithMeta,
          lessonCount: lessonsWithMeta.length,
        });
      }
      
      // Calculate total lessons
      const totalLessons = topicsWithLessons.reduce((sum, t) => sum + t.lessons.length, 0);
      console.log(`   Lessons: ${totalLessons}`);
      
      // Get thumbnail
      const thumbnailId = meta._thumbnail_id;
      let thumbnail = null;
      if (thumbnailId) {
        const [thumbResult] = await connection.execute(`
          SELECT meta_value as url
          FROM ${TABLE_PREFIX}postmeta
          WHERE post_id = ? AND meta_key = '_wp_attached_file'
        `, [thumbnailId]);
        if (thumbResult.length > 0) {
          thumbnail = `https://member.eksporyuk.com/wp-content/uploads/${thumbResult[0].url}`;
        }
      }
      
      fullCourses.push({
        ...course,
        thumbnail,
        duration: meta._course_duration || null,
        level: meta._tutor_course_level || 'beginner',
        price: meta._tutor_course_price || 0,
        topics: topicsWithLessons,
        topicCount: topicsWithLessons.length,
        lessonCount: totalLessons,
      });
    }
    
    // Save to JSON
    const outputFile = 'tutor-courses-export.json';
    fs.writeFileSync(outputFile, JSON.stringify(fullCourses, null, 2));
    console.log(`\n✅ Exported to ${outputFile}`);
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Courses: ${fullCourses.length}`);
    console.log(`   Total Topics: ${fullCourses.reduce((sum, c) => sum + c.topicCount, 0)}`);
    console.log(`   Total Lessons: ${fullCourses.reduce((sum, c) => sum + c.lessonCount, 0)}`);
    
    // List courses
    console.log('\n📋 COURSES:');
    fullCourses.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.title} (${c.topicCount} topics, ${c.lessonCount} lessons)`);
    });
    
    return fullCourses;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SSH Tunnel mungkin belum aktif. Jalankan:');
      console.log('   ssh -L 3307:127.0.0.1:3306 aziz@103.125.181.47 -N');
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  fetchTutorCourses()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { fetchTutorCourses };
