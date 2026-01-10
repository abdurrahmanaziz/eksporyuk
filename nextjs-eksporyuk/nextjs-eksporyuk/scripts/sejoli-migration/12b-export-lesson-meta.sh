#!/usr/bin/expect -f

set timeout 300

# Export lesson metadata via SSH with correct user
spawn ssh aziz@103.125.181.47

expect "password:"
send "Bismillah.2022\r"

expect "$ "
send "mysql -u aziz_wordpress -p'AY6Y25b)1F(Z' aziz_member.eksporyuk.com -N -e \"SELECT pm.post_id, pm.meta_key, pm.meta_value FROM wp_postmeta pm INNER JOIN wp_posts p ON pm.post_id = p.ID WHERE p.post_type = 'lesson' AND (pm.meta_key LIKE '%video%' OR pm.meta_key LIKE '%duration%' OR pm.meta_key LIKE '%thumbnail%' OR pm.meta_key LIKE '%file%') ORDER BY pm.post_id LIMIT 1000;\" > /tmp/lesson_meta.tsv\r"

expect "$ "
send "wc -l /tmp/lesson_meta.tsv\r"

expect "$ "
send "cat /tmp/lesson_meta.tsv | head -20\r"

expect "$ "
send "exit\r"

expect eof