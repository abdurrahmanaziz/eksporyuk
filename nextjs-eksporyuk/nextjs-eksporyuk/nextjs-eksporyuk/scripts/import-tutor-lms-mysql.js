#!/usr/bin/env node
/**
 * Tutor LMS → Eksporyuk Importer (MySQL via SSH tunnel)
 * Reads WordPress DB using `.env.wp` credentials and extracts 2 courses,
 * their topics and lessons, including video URLs from postmeta.
 */

const fs = require('fs')
const mysql = require('mysql2/promise')
require('dotenv').config({ path: './.env.wp' })

const HOST = process.env.WP_DB_HOST || '127.0.0.1'
const PORT = parseInt(process.env.WP_DB_PORT || '3307', 10)
const USER = process.env.WP_DB_USER
const PASS = process.env.WP_DB_PASSWORD
const DB   = process.env.WP_DB_NAME
const PREFIX = process.env.WP_TABLE_PREFIX || 'wp_'

if (!USER || !PASS || !DB) {
  console.error('Missing WP DB env. Check .env.wp (WP_DB_USER, WP_DB_PASSWORD, WP_DB_NAME).')
  process.exit(1)
}

async function getConnection() {
  return mysql.createPool({
    host: HOST,
    port: PORT,
    user: USER,
    password: PASS,
    database: DB,
    connectionLimit: 5,
    charset: 'utf8mb4'
  })
}

async function fetchCourses(conn, limit = 2) {
  const [rows] = await conn.query(
    `SELECT ID, post_title, post_name, post_content
     FROM ${PREFIX}posts
     WHERE post_type = 'courses' AND post_status IN ('publish','draft')
     ORDER BY post_date DESC
     LIMIT ?`, [limit]
  )
  return rows
}

async function fetchTopics(conn, courseId) {
  // Tutor LMS stores topics as post_type 'topics' with post_parent = courseId
  const [rows] = await conn.query(
    `SELECT ID, post_title, post_content
     FROM ${PREFIX}posts
     WHERE post_type = 'topics' AND post_parent = ?
     ORDER BY menu_order ASC, ID ASC`, [courseId]
  )
  return rows
}

async function fetchLessons(conn, topicId) {
  // Lessons are post_type 'lesson' with post_parent = topicId
  const [rows] = await conn.query(
    `SELECT ID, post_title, post_content
     FROM ${PREFIX}posts
     WHERE post_type = 'lesson' AND post_parent = ?
     ORDER BY menu_order ASC, ID ASC`, [topicId]
  )
  return rows
}

async function fetchLessonVideoUrl(conn, lessonId) {
  // Tutor LMS stores video in _video meta as serialized PHP array
  const [rows] = await conn.query(
    `SELECT meta_value 
     FROM ${PREFIX}postmeta 
     WHERE post_id = ? AND meta_key = '_video'`, [lessonId]
  )
  
  if (rows.length === 0) return null
  
  const serialized = rows[0].meta_value
  try {
    // Parse PHP serialized array - extract all possible video URLs
    const sourceMatch = serialized.match(/s:6:"source";s:\d+:"([^"]+)"/)
    const youtubeMatch = serialized.match(/s:14:"source_youtube";s:\d+:"([^"]*)"/)
    const vimeoMatch = serialized.match(/s:12:"source_vimeo";s:\d+:"([^"]*)"/)
    const externalMatch = serialized.match(/s:19:"source_external_url";s:\d+:"([^"]*)"/)
    const embeddedMatch = serialized.match(/s:15:"source_embedded";s:\d+:"([^"]*)"/)
    
    const source = sourceMatch ? sourceMatch[1] : null
    
    // Priority: source-specific URL > external > embedded
    if (source === 'youtube' && youtubeMatch && youtubeMatch[1]) {
      return youtubeMatch[1]
    } else if (source === 'vimeo' && vimeoMatch && vimeoMatch[1]) {
      return vimeoMatch[1]
    } else if (externalMatch && externalMatch[1]) {
      return externalMatch[1]
    } else if (embeddedMatch && embeddedMatch[1]) {
      return embeddedMatch[1]
    }
    
    return null
  } catch (e) {
    console.error(`Error parsing video meta for lesson ${lessonId}:`, e.message)
    return null
  }
}

async function main() {
  const conn = await getConnection()
  console.log('Connected to WP MySQL via SSH tunnel', { HOST, PORT, DB })

  const courses = await fetchCourses(conn, 2)
  if (courses.length === 0) {
    console.log('No Tutor LMS courses found.')
    process.exit(0)
  }

  const bundle = []
  for (const c of courses) {
    const topics = await fetchTopics(conn, c.ID)
    const topicBundles = []
    for (const t of topics) {
      const lessons = await fetchLessons(conn, t.ID)
      const lessonBundles = []
      for (const l of lessons) {
        const videoUrl = await fetchLessonVideoUrl(conn, l.ID)
        lessonBundles.push({
          id: l.ID,
          title: l.post_title,
          content: l.post_content,
          videoUrl
        })
      }
      topicBundles.push({
        id: t.ID,
        title: t.post_title,
        content: t.post_content,
        lessons: lessonBundles
      })
    }
    bundle.push({
      course: {
        id: c.ID,
        title: c.post_title,
        slug: c.post_name,
        description: c.post_content,
      },
      topics: topicBundles
    })
  }

  fs.writeFileSync('tutor-import.json', JSON.stringify(bundle, null, 2))
  console.log('Saved tutor-import.json')
  await conn.end()
}

main().catch(err => {
  console.error('MySQL importer error:', err)
  process.exit(1)
})
