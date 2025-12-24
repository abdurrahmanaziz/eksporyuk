#!/usr/bin/expect -f
set timeout 300
spawn ssh aziz@103.125.181.47
expect "password:"
send "Bismillah.2022\r"
expect "$ "
send "mysql -u root -p aziz_member.eksporyuk.com -N -e \"SELECT ID, post_author, post_date, post_content, post_title, post_status, post_name, post_parent, post_type FROM wp_posts WHERE post_type IN ('topics', 'course-topic') ORDER BY ID;\" > /tmp/topics.tsv\r"
expect "password:"
send "Bismillah.2022\r"
expect "$ "
send "cat /tmp/topics.tsv\r"
expect "$ "
send "exit\r"
expect eof
