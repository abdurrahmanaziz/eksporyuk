#!/usr/bin/env node
/**
 * Check WordPress database tables and Tutor LMS data
 */

const mysql = require('mysql2/promise')
require('dotenv').config({ path: './.env.wp' })

async function main() {
  const conn = await mysql.createPool({
    host: process.env.WP_DB_HOST,
    port: parseInt(process.env.WP_DB_PORT),
    user: process.env.WP_DB_USER,
    password: process.env.WP_DB_PASSWORD,
    database: process.env.WP_DB_NAME,
    connectionLimit: 5
  })

  console.log('Connected to:', process.env.WP_DB_NAME)
  console.log()

  // Check tables
  const [tables] = await conn.query('SHOW TABLES')
  console.log('📊 Total tables:', tables.length)
  
  const wpTables = tables.filter(t => Object.values(t)[0].includes('_posts'))
  console.log('📝 Posts tables:', wpTables.map(t => Object.values(t)[0]))
  console.log()

  // Find table prefix
  const firstTable = Object.values(tables[0])[0]
  const prefix = firstTable.match(/^(.+?)_/)?.[1] + '_' || 'wp_'
  console.log('🔧 Detected prefix:', prefix)
  console.log()

  // Check post types
  const [postTypes] = await conn.query(`
    SELECT post_type, COUNT(*) as count 
    FROM ${prefix}posts 
    WHERE post_status IN ('publish', 'draft')
    GROUP BY post_type
    ORDER BY count DESC
    LIMIT 20
  `)
  
  console.log('📚 Post types in database:')
  postTypes.forEach(pt => {
    console.log(`  - ${pt.post_type}: ${pt.count}`)
  })
  console.log()

  // Check Tutor LMS specifically
  const [tutorCourses] = await conn.query(`
    SELECT COUNT(*) as count 
    FROM ${prefix}posts 
    WHERE post_type = 'courses' AND post_status IN ('publish', 'draft')
  `)
  
  console.log('🎓 Tutor LMS courses:', tutorCourses[0].count)

  // Try alternative post type
  const [altCourses] = await conn.query(`
    SELECT post_type, COUNT(*) as count 
    FROM ${prefix}posts 
    WHERE post_type LIKE '%course%' 
    GROUP BY post_type
  `)
  
  if (altCourses.length > 0) {
    console.log('🔍 Course-related post types:')
    altCourses.forEach(c => {
      console.log(`  - ${c.post_type}: ${c.count}`)
    })
  }

  await conn.end()
}

main().catch(console.error)
