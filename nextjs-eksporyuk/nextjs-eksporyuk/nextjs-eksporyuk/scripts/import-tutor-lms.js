#!/usr/bin/env node
/**
 * Tutor LMS → Eksporyuk Importer (API-based)
 *
 * Usage:
 *   TUTOR_BASE_URL=https://member.eksporyuk.com \
 *   TUTOR_API_KEY=key_e2078f63c7bd0f8a8bb6a5c7a1f4e71f \
 *   TUTOR_API_SECRET=secret_4bcce69ccaa4b6f40044861b8f4b200b04d73193d44a1c99f8a9a607c4d905a0 \
 *   node scripts/import-tutor-lms.js
 *
 * This script fetches up to 2 courses (as requested), including topics and lessons,
 * and prepares data for insertion into the new platform.
 * It uses read-only Tutor LMS REST API endpoints documented by Themeum.
 */

// Use global fetch (Node 18+). If unavailable, require('node-fetch').
const hasGlobalFetch = typeof fetch === 'function'
const _fetch = hasGlobalFetch ? fetch : require('node-fetch')

const BASE = process.env.TUTOR_BASE_URL || 'https://member.eksporyuk.com'
const API_KEY = process.env.TUTOR_API_KEY || 'key_e2078f63c7bd0f8a8bb6a5c7a1f4e71f'
const API_SECRET = process.env.TUTOR_API_SECRET || 'secret_4bcce69ccaa4b6f40044861b8f4b200b04d73193d44a1c99f8a9a607c4d905a0'

function authHeaders() {
  // If your site expects custom headers for API auth, set them here.
  // Otherwise, omit; some Tutor LMS endpoints may be public read-only depending on config.
  return {
    'X-API-KEY': API_KEY,
    'X-API-SECRET': API_SECRET,
    'Accept': 'application/json'
  }
}

async function safeJson(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function fetchCourses() {
  const url = `${BASE}/wp-json/tutor/v1/courses?paged=1`
  console.log('Fetching courses:', url)
  const res = await _fetch(url, { headers: authHeaders() })
  if (!res.ok) {
    const body = await safeJson(res)
    throw new Error(`Failed to fetch courses (${res.status}): ${JSON.stringify(body).slice(0,200)}`)
  }
  const data = await res.json()
  if (Array.isArray(data)) return data
  // Some installations return `{ data: [...] }`
  return data?.data || []
}

async function fetchCourseDetails(courseId) {
  const url = `${BASE}/wp-json/tutor/v1/courses/${courseId}`
  console.log('Fetching course details:', url)
  const res = await _fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Failed course ${courseId}: ${res.status}`)
  return safeJson(res)
}

async function fetchTopics(courseId) {
  const url = `${BASE}/wp-json/tutor/v1/topics?course_id=${courseId}`
  console.log('Fetching topics:', url)
  const res = await _fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Failed topics for ${courseId}: ${res.status}`)
  return safeJson(res)
}

async function fetchLessons(topicId) {
  const url = `${BASE}/wp-json/tutor/v1/lessons?topic_id=${topicId}`
  console.log('Fetching lessons:', url)
  const res = await _fetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Failed lessons for topic ${topicId}: ${res.status}`)
  return safeJson(res)
}

function normalizeCourses(rawCourses) {
  return rawCourses.map((c) => ({
    id: c?.ID || c?.id || c?.course_id || null,
    title: c?.post_title || c?.title || '',
    slug: c?.post_name || c?.slug || '',
    description: c?.post_content || c?.content || '',
  }))
}

async function main() {
  console.log('Tutor LMS Importer started')
  console.log('BASE:', BASE)

  const rawCourses = await fetchCourses()
  const courses = normalizeCourses(rawCourses)
  if (courses.length === 0) {
    console.log('No courses found')
    process.exit(0)
  }

  // Limit to 2 courses as requested
  const target = courses.slice(0, 2)
  console.log(`Found ${courses.length} courses, importing 2:`)
  target.forEach((c) => console.log(`- [${c.id}] ${c.title}`))

  const bundle = []
  for (const course of target) {
    const details = await fetchCourseDetails(course.id)
    const topicsData = await fetchTopics(course.id)
    const topics = Array.isArray(topicsData) ? topicsData : topicsData?.data || []

    const topicBundles = []
    for (const t of topics) {
      const topicId = t?.ID || t?.id || t?.topic_id
      const lessonsData = await fetchLessons(topicId)
      const lessons = Array.isArray(lessonsData) ? lessonsData : lessonsData?.data || []

      const lessonNorm = lessons.map((l) => ({
        id: l?.ID || l?.id || l?.lesson_id,
        title: l?.post_title || l?.title || '',
        content: l?.post_content || l?.content || '',
        // Video source mapping (if available in lesson meta)
        videoUrl: l?.video_url || l?.meta?._tutor_video || null,
      }))
      topicBundles.push({
        id: topicId,
        title: t?.post_title || t?.title || '',
        lessons: lessonNorm,
      })
    }

    bundle.push({
      course,
      details,
      topics: topicBundles,
    })
  }

  // For now, print summary. Next step: insert into Prisma models.
  console.log('\nImport Summary:')
  for (const b of bundle) {
    console.log(`\nCourse: ${b.course.title}`)
    console.log(`Topics: ${b.topics.length}`)
    let lessonCount = 0
    b.topics.forEach((tb) => (lessonCount += tb.lessons.length))
    console.log(`Lessons: ${lessonCount}`)
  }

  // Optionally, write to a JSON file for review
  const fs = require('fs')
  fs.writeFileSync('tutor-import.json', JSON.stringify(bundle, null, 2))
  console.log('\nSaved tutor-import.json with full data payload')
}

main().catch((err) => {
  console.error('Importer error:', err.message)
  process.exit(1)
})
