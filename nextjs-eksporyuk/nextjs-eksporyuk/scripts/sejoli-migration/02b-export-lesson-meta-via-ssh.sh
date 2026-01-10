#!/bin/bash
# Export lesson metadata from WordPress

ssh aziz@103.125.181.47 << 'ENDSSH' > exports/tutor_lesson_meta.tsv
mysql -u aziz_wordpress -p'AY6Y25b)1F(Z' aziz_member.eksporyuk.com -N -e "
SELECT 
    pm.post_id,
    pm.meta_key,
    pm.meta_value
FROM wp_postmeta pm
INNER JOIN wp_posts p ON pm.post_id = p.ID
WHERE p.post_type = 'lesson'
AND pm.meta_key IN (
    '_video',
    '_video_source',
    'video',
    'video_source',
    '_lesson_video_source',
    '_lesson_thumbnail_id',
    '_video_poster',
    '_lesson_duration',
    '_course_id_for_lesson',
    '_tutor_course_id_for_lesson',
    '_parent_course'
)
ORDER BY pm.post_id, pm.meta_key;
"
ENDSSH

echo "✅ Lesson meta exported to exports/tutor_lesson_meta.tsv"
wc -l exports/tutor_lesson_meta.tsv
