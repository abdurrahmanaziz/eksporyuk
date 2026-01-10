#!/usr/bin/env node
/**
 * Import Tutor LMS courses/topics/lessons directly from Sejoli (WordPress) MySQL DB.
 *
 * - Source credentials: `nextjs-eksporyuk/.env.sejoli`
 * - Idempotent: uses deterministic IDs (tutor_course_{wpId}, tutor_topic_{wpId}, tutor_lesson_{wpId})
 */

const path = require('path');
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.sejoli') });

const prisma = new PrismaClient();

function toInt(value) {
  if (value === null || value === undefined) return null;
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTutorVideoUrl(metaValue) {
  if (!metaValue) return null;

  const raw = String(metaValue).trim();

  // Sometimes it might already be a URL
  if (/^https?:\/\//i.test(raw)) return raw;

  // Tutor LMS stores video in `_video` meta as serialized PHP array.
  // Extract known fields.
  const sourceMatch = raw.match(/s:6:"source";s:\d+:"([^"]+)"/);
  const youtubeMatch = raw.match(/s:14:"source_youtube";s:\d+:"([^"]*)"/);
  const vimeoMatch = raw.match(/s:12:"source_vimeo";s:\d+:"([^"]*)"/);
  const externalMatch = raw.match(/s:19:"source_external_url";s:\d+:"([^"]*)"/);
  const embeddedMatch = raw.match(/s:15:"source_embedded";s:\d+:"([^"]*)"/);

  const source = sourceMatch ? sourceMatch[1] : null;

  if (source === 'youtube' && youtubeMatch && youtubeMatch[1]) return youtubeMatch[1];
  if (source === 'vimeo' && vimeoMatch && vimeoMatch[1]) return vimeoMatch[1];
  if (externalMatch && externalMatch[1]) return externalMatch[1];
  if (embeddedMatch && embeddedMatch[1]) return embeddedMatch[1];

  return null;
}

async function detectWpPrefix(connection) {
  const [rows] = await connection.query('SHOW TABLES');
  const tableNames = rows
    .map((r) => r[Object.keys(r)[0]])
    .filter((t) => typeof t === 'string');

  // Pick the first pair that looks like WordPress posts/postmeta
  const postsTable = tableNames.find((t) => t.endsWith('_posts') && tableNames.includes(t.replace(/_posts$/, '_postmeta')));
  if (!postsTable) {
    throw new Error('Could not detect WordPress tables (*_posts and *_postmeta).');
  }

  const prefix = postsTable.replace(/posts$/, '');
  const postmetaTable = `${prefix}postmeta`;

  return { prefix, postsTable, postmetaTable };
}

async function fetchCourseMetaMap(connection, postmetaTable, courseIds) {
  if (!courseIds.length) return new Map();

  const wantedKeys = ['_tutor_course_price', '_course_duration', '_tutor_course_level'];
  const chunks = [];
  for (let i = 0; i < courseIds.length; i += 500) chunks.push(courseIds.slice(i, i + 500));

  const metaByCourseId = new Map();

  for (const chunk of chunks) {
    const [rows] = await connection.query(
      `SELECT post_id, meta_key, meta_value
       FROM ${postmetaTable}
       WHERE post_id IN (${chunk.map(() => '?').join(',')})
         AND meta_key IN (${wantedKeys.map(() => '?').join(',')})`,
      [...chunk, ...wantedKeys]
    );

    for (const row of rows) {
      const postId = String(row.post_id);
      const metaKey = row.meta_key;
      const metaValue = row.meta_value;
      if (!metaByCourseId.has(postId)) metaByCourseId.set(postId, {});
      metaByCourseId.get(postId)[metaKey] = metaValue;
    }
  }

  return metaByCourseId;
}

async function fetchLessonVideoMap(connection, postmetaTable, lessonIds) {
  if (!lessonIds.length) return new Map();

  const wantedKeys = ['_video', 'video_url', '_video_url', '_tutor_lesson_video'];
  const chunks = [];
  for (let i = 0; i < lessonIds.length; i += 500) chunks.push(lessonIds.slice(i, i + 500));

  const videoByLessonId = new Map();

  for (const chunk of chunks) {
    const [rows] = await connection.query(
      `SELECT post_id, meta_key, meta_value
       FROM ${postmetaTable}
       WHERE post_id IN (${chunk.map(() => '?').join(',')})
         AND meta_key IN (${wantedKeys.map(() => '?').join(',')})`,
      [...chunk, ...wantedKeys]
    );

    for (const row of rows) {
      const postId = String(row.post_id);
      const metaKey = row.meta_key;
      const metaValue = row.meta_value;

      // Priority: _video (serialized) then any url-ish value
      const existing = videoByLessonId.get(postId) || null;
      if (existing) continue;

      if (metaKey === '_video') {
        const url = parseTutorVideoUrl(metaValue);
        if (url) videoByLessonId.set(postId, url);
        continue;
      }

      if (metaValue && /^https?:\/\//i.test(String(metaValue).trim())) {
        videoByLessonId.set(postId, String(metaValue).trim());
      }
    }
  }

  return videoByLessonId;
}

async function main() {
  console.log('📚 Tutor LMS import (direct from Sejoli DB)');

  const host = process.env.SEJOLI_DB_HOST;
  const port = parseInt(process.env.SEJOLI_DB_PORT || '3306', 10);
  const user = process.env.SEJOLI_DB_USER;
  const password = process.env.SEJOLI_DB_PASSWORD;
  const database = process.env.SEJOLI_DB_NAME;

  if (!host || !user || !password || !database) {
    throw new Error('Missing Sejoli DB env. Need SEJOLI_DB_HOST, SEJOLI_DB_USER, SEJOLI_DB_PASSWORD, SEJOLI_DB_NAME (see nextjs-eksporyuk/.env.sejoli).');
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    charset: 'utf8mb4'
  });

  const { postsTable, postmetaTable } = await detectWpPrefix(connection);
  console.log(`✅ Connected. Using tables: ${postsTable}, ${postmetaTable}`);

  let mentorUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, role: true },
  });

  if (!mentorUser) {
    mentorUser = await prisma.user.findFirst({
      select: { id: true, email: true, role: true },
    });
  }

  if (!mentorUser) throw new Error('No users found in Eksporyuk DB.');
  console.log(`👤 Using mentorId: ${mentorUser.id} (${mentorUser.role}${mentorUser.email ? `, ${mentorUser.email}` : ''})`);

  const [courseRows] = await connection.query(
    `SELECT ID, post_title, post_name, post_content, post_status, post_date
     FROM ${postsTable}
     WHERE post_type = 'courses' AND post_status IN ('publish','draft')
     ORDER BY post_date ASC, ID ASC`
  );

  const courses = courseRows.map((r) => ({
    id: String(r.ID),
    title: r.post_title || `Course ${r.ID}`,
    slug: r.post_name || null,
    content: r.post_content || '',
    status: r.post_status || 'draft',
    date: r.post_date || null,
  }));

  console.log(`📦 Found ${courses.length} Tutor LMS courses`);
  if (courses.length === 0) {
    await connection.end();
    return;
  }

  const courseMetaMap = await fetchCourseMetaMap(connection, postmetaTable, courses.map((c) => c.id));

  let upsertedCourses = 0;
  let upsertedModules = 0;
  let upsertedLessons = 0;

  for (const course of courses) {
    const meta = courseMetaMap.get(course.id) || {};
    const price = meta._tutor_course_price ? parseFloat(String(meta._tutor_course_price)) : 0;

    const duration = toInt(meta._course_duration);
    const level = meta._tutor_course_level ? String(meta._tutor_course_level) : null;

    const isPublished = course.status === 'publish';
    const publishedAt = isPublished ? safeDate(course.date) : null;

    const dbCourseId = `tutor_course_${course.id}`;

    await prisma.course.upsert({
      where: { id: dbCourseId },
      create: {
        id: dbCourseId,
        mentorId: mentorUser.id,
        title: course.title,
        slug: course.slug,
        description: course.content || course.title,
        price: Number.isFinite(price) ? price : 0,
        duration,
        level,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        isPublished,
        publishedAt,
        monetizationType: (Number.isFinite(price) && price > 0) ? 'PAID' : 'FREE',
        membershipIncluded: true,
        updatedAt: new Date(),
        createdAt: safeDate(course.date) || new Date(),
      },
      update: {
        title: course.title,
        slug: course.slug,
        description: course.content || course.title,
        price: Number.isFinite(price) ? price : 0,
        duration,
        level,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        isPublished,
        publishedAt,
        monetizationType: (Number.isFinite(price) && price > 0) ? 'PAID' : 'FREE',
        membershipIncluded: true,
        updatedAt: new Date(),
      }
    });

    upsertedCourses++;

    const [topicRows] = await connection.query(
      `SELECT ID, post_title, post_content, menu_order
       FROM ${postsTable}
       WHERE post_type = 'topics' AND post_parent = ?
       ORDER BY menu_order ASC, ID ASC`,
      [course.id]
    );

    const topics = topicRows.map((r) => ({
      id: String(r.ID),
      title: r.post_title || `Topic ${r.ID}`,
      content: r.post_content || '',
      menuOrder: toInt(r.menu_order) || 0,
    }));

    // If no topics, create a default module.
    if (topics.length === 0) {
      const moduleId = `tutor_topic_default_${course.id}`;
      await prisma.courseModule.upsert({
        where: { id: moduleId },
        create: {
          id: moduleId,
          courseId: dbCourseId,
          title: 'Materi Utama',
          description: null,
          order: 1,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        update: {
          title: 'Materi Utama',
          order: 1,
          updatedAt: new Date(),
        }
      });
      upsertedModules++;
      continue;
    }

    // Fetch lessons for all topics first so we can batch-load video meta
    const allLessons = [];
    for (const topic of topics) {
      const [lessonRows] = await connection.query(
        `SELECT ID, post_title, post_content, menu_order
         FROM ${postsTable}
         WHERE post_type = 'lesson' AND post_parent = ?
         ORDER BY menu_order ASC, ID ASC`,
        [topic.id]
      );

      for (const r of lessonRows) {
        allLessons.push({
          id: String(r.ID),
          topicId: topic.id,
          title: r.post_title || `Lesson ${r.ID}`,
          content: r.post_content || '',
          menuOrder: toInt(r.menu_order) || 0,
        });
      }
    }

    const videoMap = await fetchLessonVideoMap(connection, postmetaTable, allLessons.map((l) => l.id));

    // Upsert modules + lessons
    const topicsSorted = [...topics].sort((a, b) => (a.menuOrder - b.menuOrder) || (Number(a.id) - Number(b.id)));

    for (let topicIndex = 0; topicIndex < topicsSorted.length; topicIndex++) {
      const topic = topicsSorted[topicIndex];
      const moduleId = `tutor_topic_${topic.id}`;

      await prisma.courseModule.upsert({
        where: { id: moduleId },
        create: {
          id: moduleId,
          courseId: dbCourseId,
          title: topic.title,
          description: stripHtml(topic.content).substring(0, 500) || null,
          order: topicIndex + 1,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        update: {
          title: topic.title,
          description: stripHtml(topic.content).substring(0, 500) || null,
          order: topicIndex + 1,
          updatedAt: new Date(),
        }
      });

      upsertedModules++;

      const lessons = allLessons
        .filter((l) => l.topicId === topic.id)
        .sort((a, b) => (a.menuOrder - b.menuOrder) || (Number(a.id) - Number(b.id)));

      for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
        const lesson = lessons[lessonIndex];
        const lessonId = `tutor_lesson_${lesson.id}`;

        await prisma.courseLesson.upsert({
          where: { id: lessonId },
          create: {
            id: lessonId,
            moduleId,
            title: lesson.title,
            content: lesson.content || lesson.title,
            videoUrl: videoMap.get(lesson.id) || null,
            duration: null,
            order: lessonIndex + 1,
            isFree: false,
            updatedAt: new Date(),
            createdAt: new Date(),
          },
          update: {
            moduleId,
            title: lesson.title,
            content: lesson.content || lesson.title,
            videoUrl: videoMap.get(lesson.id) || null,
            order: lessonIndex + 1,
            updatedAt: new Date(),
          }
        });

        upsertedLessons++;
      }
    }

    console.log(`✅ Imported: ${course.title} (topics: ${topics.length}, lessons: ${allLessons.length})`);
  }

  console.log('\n🎉 Done');
  console.log(`- Courses upserted: ${upsertedCourses}`);
  console.log(`- Modules upserted: ${upsertedModules}`);
  console.log(`- Lessons upserted: ${upsertedLessons}`);

  await connection.end();
}

main()
  .catch(async (err) => {
    console.error('❌ Import failed:', err.message);
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
