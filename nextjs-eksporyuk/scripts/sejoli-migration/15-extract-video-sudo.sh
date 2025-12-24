#!/usr/bin/expect -f

set timeout 300

spawn ssh aziz@103.125.181.47

expect "password:"
send "Bismillah.2022\r"

expect "$ "
send "sudo mysql aziz_member.eksporyuk.com -e \"SELECT pm.post_id, pm.meta_key, pm.meta_value FROM wp_postmeta pm INNER JOIN wp_posts p ON pm.post_id = p.ID WHERE p.post_type = 'lesson' AND pm.meta_key IN ('_video', 'video_source', '_video_source', 'lesson_video_poster', '_lesson_video_source') LIMIT 100;\" > /tmp/video_meta.tsv\r"

expect "$ "
send "cat /tmp/video_meta.tsv\r"

expect "$ "
send "exit\r"

expect eof