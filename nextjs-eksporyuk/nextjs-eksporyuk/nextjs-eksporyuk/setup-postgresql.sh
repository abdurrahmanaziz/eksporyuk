#!/bin/bash
# Setup PostgreSQL di VPS untuk Eksporyuk
# Spek: CPU 4, RAM 12GB, Storage 90GB

set -e

echo "=========================================="
echo "PostgreSQL Setup for Eksporyuk"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Database credentials
DB_NAME="eksporyuk"
DB_USER="eksporyuk_user"
DB_PASS="EksporYuk2024!Strong@PostgreSQL"
NEON_URL="postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

echo -e "${YELLOW}Step 1: Installing PostgreSQL...${NC}"
sudo apt update
sudo apt install -y postgresql postgresql-contrib

echo -e "${GREEN}✓ PostgreSQL installed${NC}"

echo -e "${YELLOW}Step 2: Starting PostgreSQL service...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo -e "${GREEN}✓ PostgreSQL service started${NC}"

echo -e "${YELLOW}Step 3: Creating database and user...${NC}"
sudo -u postgres psql << EOF
-- Drop if exists
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Create database
CREATE DATABASE $DB_NAME;

-- Create user with password
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Show result
\l $DB_NAME
\du $DB_USER
EOF

echo -e "${GREEN}✓ Database and user created${NC}"

echo -e "${YELLOW}Step 4: Optimizing PostgreSQL for 12GB RAM...${NC}"
PG_CONF=$(sudo -u postgres psql -t -P format=unaligned -c 'SHOW config_file')

sudo bash -c "cat >> $PG_CONF << 'PGCONF'

# Eksporyuk Production Settings (12GB RAM)
# Updated: $(date)

# Memory Settings
shared_buffers = 3GB                    # 25% of RAM
effective_cache_size = 9GB              # 75% of RAM
work_mem = 32MB                         # For complex queries
maintenance_work_mem = 512MB            # For VACUUM, CREATE INDEX

# Connection Settings
max_connections = 200                   # Support banyak users
max_prepared_transactions = 100

# Write Performance
wal_buffers = 16MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min

# Query Planner
random_page_cost = 1.1                  # For SSD
effective_io_concurrency = 200          # For SSD

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_min_duration_statement = 1000       # Log slow queries (>1s)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
PGCONF
"

echo -e "${GREEN}✓ PostgreSQL optimized for 12GB RAM${NC}"

echo -e "${YELLOW}Step 5: Exporting data from Neon...${NC}"
cd /home/eksporyuk
PGPASSWORD='npg_YUbWXw6urZ0d' pg_dump -h ep-purple-breeze-a1ovfiz0-pooler.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb --no-owner --no-acl > eksporyuk_neon_backup.sql

if [ -f "eksporyuk_neon_backup.sql" ]; then
    echo -e "${GREEN}✓ Data exported from Neon ($(wc -l < eksporyuk_neon_backup.sql) lines)${NC}"
else
    echo -e "${RED}✗ Export failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 6: Importing data to local PostgreSQL...${NC}"
PGPASSWORD="$DB_PASS" psql -h localhost -U $DB_USER -d $DB_NAME < eksporyuk_neon_backup.sql

echo -e "${GREEN}✓ Data imported successfully${NC}"

echo -e "${YELLOW}Step 7: Updating .env file...${NC}"
cd /home/eksporyuk/eksporyuk/nextjs-eksporyuk

# Backup old .env
cp .env .env.neon.backup.$(date +%Y%m%d_%H%M%S)

# Create new .env
cat > .env << 'ENVFILE'
# Production Database (Local PostgreSQL)
DATABASE_URL="postgresql://eksporyuk_user:EksporYuk2024!Strong@PostgreSQL@localhost:5432/eksporyuk"

# NextAuth
NEXTAUTH_SECRET="eksporyuk-secret-key-2024-production"
NEXTAUTH_URL="https://app.eksporyuk.com"

# Optional: Keep Neon as backup
# DATABASE_URL_BACKUP="postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
ENVFILE

echo -e "${GREEN}✓ .env updated${NC}"

echo -e "${YELLOW}Step 8: Regenerating Prisma client...${NC}"
npx prisma generate

echo -e "${GREEN}✓ Prisma client generated${NC}"

echo -e "${YELLOW}Step 9: Restarting application...${NC}"
pm2 stop eksporyuk
pm2 start npm --name "eksporyuk" -- start
pm2 save

echo -e "${GREEN}✓ Application restarted${NC}"

echo -e "${YELLOW}Step 10: Restarting PostgreSQL...${NC}"
sudo systemctl restart postgresql

echo -e "${GREEN}✓ PostgreSQL restarted${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Database Details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASS"
echo ""
echo "Connection String:"
echo "  postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
echo ""
echo "Backup Location:"
echo "  /home/eksporyuk/eksporyuk_neon_backup.sql"
echo ""
echo "Check application:"
echo "  pm2 logs eksporyuk"
echo "  curl -I https://app.eksporyuk.com/"
echo ""
