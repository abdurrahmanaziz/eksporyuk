# 📚 Panduan Migrasi Materi dari Tutor LMS ke Eksporyuk

## 🎯 Overview

Panduan ini menjelaskan cara migrasi materi pembelajaran dari **Tutor LMS (WordPress)** ke sistem LMS **Eksporyuk**.

## 📊 Mapping Struktur Data

| Tutor LMS (WordPress) | Eksporyuk |
|----------------------|-----------|
| Course | Course |
| Topic | CourseModule |
| Lesson | CourseLesson |
| Attachment | LessonFile |
| Quiz | Quiz |
| Question | QuizQuestion |

## 🔧 Langkah-langkah Migrasi

### Step 1: Export Data dari Tutor LMS

Ada 2 cara untuk export data dari Tutor LMS:

#### Opsi A: Menggunakan Plugin WP All Export (Recommended)

1. Install plugin **WP All Export** di WordPress
2. Buat export untuk Custom Post Type:
   - `courses` - untuk kursus
   - `topics` - untuk modul/topik
   - `lesson` - untuk pelajaran
3. Export ke format **JSON** atau **CSV**

#### Opsi B: Export via Database (SQL)

```sql
-- Export Courses
SELECT 
  p.ID,
  p.post_title as title,
  p.post_name as slug,
  p.post_content as description,
  pm.meta_value as thumbnail
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
WHERE p.post_type = 'courses' AND p.post_status = 'publish';

-- Export Topics (Modules)
SELECT 
  t.ID,
  t.post_title as title,
  t.post_parent as course_id,
  t.menu_order as order
FROM wp_posts t
WHERE t.post_type = 'topics' AND t.post_status = 'publish';

-- Export Lessons
SELECT 
  l.ID,
  l.post_title as title,
  l.post_content as content,
  l.post_parent as topic_id,
  l.menu_order as order,
  lm.meta_value as video_url
FROM wp_posts l
LEFT JOIN wp_postmeta lm ON l.ID = lm.post_id AND lm.meta_key = '_video'
WHERE l.post_type = 'lesson' AND l.post_status = 'publish';
```

#### Opsi C: Tutor LMS REST API

```bash
# Get all courses
curl -X GET "https://your-site.com/wp-json/tutor/v1/courses" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get course topics
curl -X GET "https://your-site.com/wp-json/tutor/v1/course-topic/{course_id}" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get lessons
curl -X GET "https://your-site.com/wp-json/tutor/v1/lesson/{lesson_id}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 2: Format Data JSON

Setelah export, format data ke struktur JSON seperti ini:

```json
{
  "courses": [
    {
      "wp_id": 123,
      "title": "Ekspor Pemula",
      "slug": "ekspor-pemula",
      "description": "<p>Belajar dasar-dasar ekspor...</p>",
      "thumbnail": "https://your-site.com/uploads/thumbnail.jpg",
      "price": 0,
      "level": "BEGINNER",
      "modules": [
        {
          "wp_id": 456,
          "title": "Modul 1: Pengenalan Ekspor",
          "description": "Dasar-dasar ekspor impor",
          "order": 1,
          "lessons": [
            {
              "wp_id": 789,
              "title": "Apa itu Ekspor?",
              "content": "<p>Ekspor adalah kegiatan...</p>",
              "videoUrl": "https://www.youtube.com/watch?v=xxxx",
              "duration": 15,
              "order": 1,
              "isFree": true,
              "files": [
                {
                  "title": "Panduan PDF",
                  "fileName": "panduan-ekspor.pdf",
                  "fileUrl": "https://your-site.com/uploads/panduan.pdf"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Step 3: Jalankan Script Migrasi

Simpan data JSON di file `tutor-lms-data.json`, lalu jalankan script migrasi:

```bash
cd nextjs-eksporyuk
node migrate-tutor-lms.js
```

---

## 📁 File yang Dibutuhkan

1. **tutor-lms-data.json** - Data export dari Tutor LMS
2. **migrate-tutor-lms.js** - Script migrasi (sudah dibuat)

---

## ⚠️ Catatan Penting

### Video URL
- Tutor LMS biasanya menggunakan video YouTube/Vimeo embed
- Eksporyuk mendukung:
  - YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
  - Vimeo: `https://vimeo.com/VIDEO_ID`
  - Direct MP4: `https://your-cdn.com/video.mp4`

### File Attachments
- File attachment dari WordPress perlu di-upload ulang ke storage baru
- Atau gunakan URL asli jika masih accessible

### HTML Content
- Content lesson dari Tutor LMS dalam format HTML
- Eksporyuk mendukung rich text HTML

### Quiz
- Quiz dari Tutor LMS bisa dimigrasi ke model Quiz di Eksporyuk
- Tipe soal yang didukung: multiple choice, essay, true/false

---

## 🔄 Cara Alternatif: Manual via Admin Panel

Jika data tidak terlalu banyak, bisa input manual:

1. Login ke `/admin/courses`
2. Klik **"Tambah Kursus"**
3. Isi detail kursus
4. Tab **"Konten"** → Tambah Modul → Tambah Lesson

---

## 📞 Support

Jika ada kendala, cek log error di console atau file debug.
