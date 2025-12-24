#!/bin/bash
# Export video metadata from Tutor LMS via SSH

SSH_HOST="103.125.181.47"
SSH_USER="aziz"
SSH_PASS="Bismillah.2022"
DB_NAME="aziz_member.eksporyuk.com"
OUTPUT_FILE="exports/lesson_videos.tsv"

echo "🎬 Exporting video metadata from Sejoli..."

sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" << 'ENDSSH'
cd /home/aziz/member.eksporyuk.com

# Check if wp-cli exists
if [ -f "wp" ]; then
    WP="./wp"
elif command -v wp &> /dev/null; then
    WP="wp"
else
    echo "WP-CLI not found, trying direct mysql..."
    # Get DB credentials from wp-config.php
    DB_USER=$(grep "DB_USER" wp-config.php | cut -d "'" -f 4)
    DB_PASS=$(grep "DB_PASSWORD" wp-config.php | cut -d "'" -f 4)
    DB_NAME=$(grep "DB_NAME" wp-config.php | cut -d "'" -f 4)
    
    mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e "
    SELECT 
        p.ID,
        p.post_title,
        MAX(CASE WHEN pm.meta_key = '_video' THEN pm.meta_value END) as video_url,
        MAX(CASE WHEN pm.meta_key = '_video_poster' THEN pm.meta_value END) as video_poster,
        MAX(CASE WHEN pm.meta_key = '_tutor_video_duration' THEN pm.meta_value END) as duration,
        MAX(CASE WHEN pm.meta_key = 'video_source' THEN pm.meta_value END) as video_source,
        MAX(CASE WHEN pm.meta_key = '_lesson_video_source' THEN pm.meta_value END) as lesson_video_source
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
    WHERE p.post_type = 'lesson' AND p.post_status = 'publish'
    GROUP BY p.ID, p.post_title
    ORDER BY p.ID;
    " 2>/dev/null
    exit 0
fi

# Try with WP-CLI
$WP db query "
SELECT 
    p.ID,
    p.post_title,
    MAX(CASE WHEN pm.meta_key = '_video' THEN pm.meta_value END) as video_url,
    MAX(CASE WHEN pm.meta_key = '_video_poster' THEN pm.meta_value END) as video_poster,
    MAX(CASE WHEN pm.meta_key = '_tutor_video_duration' THEN pm.meta_value END) as duration,
    MAX(CASE WHEN pm.meta_key = 'video_source' THEN pm.meta_value END) as video_source,
    MAX(CASE WHEN pm.meta_key = '_lesson_video_source' THEN pm.meta_value END) as lesson_video_source
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
WHERE p.post_type = 'lesson' AND p.post_status = 'publish'
GROUP BY p.ID, p.post_title
ORDER BY p.ID;
" --allow-root 2>/dev/null
ENDSSH
