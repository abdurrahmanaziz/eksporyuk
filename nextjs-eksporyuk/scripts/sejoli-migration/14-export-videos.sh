#!/usr/bin/expect -f

set timeout 300

spawn ssh aziz@103.125.181.47

expect "password:"
send "Bismillah.2022\r"

expect "$ "
send "mysql -u root -p'Bismillah.2022' aziz_member.eksporyuk.com -N -e \"SELECT pm.post_id, pm.meta_key, pm.meta_value FROM wp_postmeta pm INNER JOIN wp_posts p ON pm.post_id = p.ID WHERE p.post_type = 'lesson' AND (pm.meta_key LIKE '%video%' OR pm.meta_key = '_video' OR pm.meta_key = 'video' OR pm.meta_key = '_lesson_video_source' OR pm.meta_key = 'lesson_video_poster') ORDER BY pm.post_id;\" > /tmp/lesson_videos.tsv\r"

expect "$ "
send "wc -l /tmp/lesson_videos.tsv && head -20 /tmp/lesson_videos.tsv\r"

expect "$ "
send "cat /tmp/lesson_videos.tsv\r"

expect "$ "
send "exit\r"

expect eof