#!/usr/bin/expect -f

set timeout 120
set host "103.125.181.47"
set user "aziz"
set pass "Bismillah.2022"

spawn ssh -o StrictHostKeyChecking=no $user@$host

expect {
    "password:" { send "$pass\r" }
    timeout { puts "Connection timeout"; exit 1 }
}

expect "$ "

# Get video metadata using wp-config credentials
send "cd /home/aziz/member.eksporyuk.com && DB_USER=\$(grep \"DB_USER\" wp-config.php | cut -d \"'\" -f 4) && DB_PASS=\$(grep \"DB_PASSWORD\" wp-config.php | cut -d \"'\" -f 4) && DB_NAME=\$(grep \"DB_NAME\" wp-config.php | cut -d \"'\" -f 4) && mysql -u\"\$DB_USER\" -p\"\$DB_PASS\" \"\$DB_NAME\" -N -e \"SELECT p.ID, p.post_title, MAX(CASE WHEN pm.meta_key = '_video' THEN pm.meta_value END) as video_url, MAX(CASE WHEN pm.meta_key = '_tutor_video_duration' THEN pm.meta_value END) as duration, MAX(CASE WHEN pm.meta_key = 'video_source' THEN pm.meta_value END) as video_source FROM wp_posts p LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id WHERE p.post_type = 'lesson' AND p.post_status = 'publish' GROUP BY p.ID, p.post_title ORDER BY p.ID;\"\r"

expect {
    "$ " { }
    timeout { puts "Query timeout"; exit 1 }
}

send "exit\r"
expect eof
