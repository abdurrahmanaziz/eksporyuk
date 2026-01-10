#!/usr/bin/env node
/**
 * Check video metadata for lessons
 */

const mysql = require('mysql2/promise')
require('dotenv').config({ path: './.env.wp' })

async function main() {
  const conn = await mysql.createPool({
    host: process.env.WP_DB_HOST,
    port: parseInt(process.env.WP_DB_PORT),
    user: process.env.WP_DB_USER,
    password: process.env.WP_DB_PASSWORD,
    database: process.env.WP_DB_NAME
  })

  const PREFIX = process.env.WP_TABLE_PREFIX || 'wp_'

  // Get sample lesson
  const [lesson] = await conn.query(`
    SELECT ID FROM ${PREFIX}posts WHERE post_type = 'lesson' LIMIT 1
  `)

  if (lesson.length === 0) {
    console.log('No lessons found')
    return
  }

  const lessonId = lesson[0].ID
  console.log('Sample lesson ID:', lessonId)
  console.log()

  // Get all meta keys for this lesson
  const [meta] = await conn.query(`
    SELECT meta_key, meta_value 
    FROM ${PREFIX}postmeta 
    WHERE post_id = ?
    ORDER BY meta_key`, [lessonId]
  )

  console.log('Meta keys for lesson:')
  meta.forEach(m => {
    const value = m.meta_value.length > 100 
      ? m.meta_value.substring(0, 100) + '...' 
      : m.meta_value
    console.log(`  ${m.meta_key}: ${value}`)
  })
  console.log()

  // Check common video meta keys across all lessons
  const [videoMeta] = await conn.query(`
    SELECT DISTINCT meta_key, COUNT(*) as count
    FROM ${PREFIX}postmeta pm
    JOIN ${PREFIX}posts p ON pm.post_id = p.ID
    WHERE p.post_type = 'lesson'
      AND (meta_key LIKE '%video%' OR meta_key LIKE '%url%' OR meta_key LIKE '%source%')
    GROUP BY meta_key
    ORDER BY count DESC
  `)

  console.log('Video-related meta keys across all lessons:')
  videoMeta.forEach(m => {
    console.log(`  ${m.meta_key}: ${m.count} lessons`)
  })

  await conn.end()
}

main().catch(console.error)
