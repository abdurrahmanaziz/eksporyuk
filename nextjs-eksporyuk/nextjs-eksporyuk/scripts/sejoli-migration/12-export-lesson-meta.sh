#!/usr/bin/expect -f

set timeout 300

# Export lesson metadata via SSH
spawn ssh aziz@103.125.181.47

expect "password:"
send "Bismillah.2022\r"

expect "$ "
send "mysql -u root -p aziz_member.eksporyuk.com -e \"SELECT pm.post_id, pm.meta_key, pm.meta_value FROM wp_postmeta pm INNER JOIN wp_posts p ON pm.post_id = p.ID WHERE p.post_type = 'lesson' AND pm.meta_key REGEXP '(video|duration|thumbnail|attachment|file)' ORDER BY pm.post_id;\" > /tmp/lesson_meta.tsv\r"

expect "password:"
send "Bismillah.2022\r"

expect "$ "
send "cat /tmp/lesson_meta.tsv\r"

expect "$ "
send "exit\r"

expect eof