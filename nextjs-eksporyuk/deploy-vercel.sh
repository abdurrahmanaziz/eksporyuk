#!/bin/bash

# Eksporyuk Vercel Deployment Script
# Usage: ./deploy-vercel.sh [preview|production]

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Deployment type
DEPLOY_TYPE="${1:-preview}"

echo -e "${GREEN}🚀 Eksporyuk Vercel Deployment${NC}"
echo "======================================"
echo ""

# Step 1: Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from nextjs-eksporyuk directory"
    exit 1
fi

if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Error: prisma/schema.prisma not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Correct directory"

# Step 2: Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠ Vercel CLI not found${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo -e "${GREEN}✓${NC} Vercel CLI installed"

# Step 3: Check if logged in
VERCEL_USER=$(vercel whoami 2>&1 || echo "Not logged in")
if [[ "$VERCEL_USER" == *"Not logged in"* ]] || [[ "$VERCEL_USER" == *"Error"* ]]; then
    echo -e "${YELLOW}⚠ Not logged in to Vercel${NC}"
    echo "Please login:"
    vercel login
else
    echo -e "${GREEN}✓${NC} Logged in as: $VERCEL_USER"
fi

# Step 4: Pre-deployment checks
echo ""
echo -e "${YELLOW}📋 Pre-deployment Checklist${NC}"
echo "======================================"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Warning: .env file not found${NC}"
    echo "Make sure environment variables are set in Vercel Dashboard"
else
    echo -e "${GREEN}✓${NC} .env file exists (local only)"
fi

# Check critical files
FILES_TO_CHECK=(
    "package.json"
    "prisma/schema.prisma"
    "next.config.js"
    "vercel.json"
    ".env.example"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

# Step 5: Test Prisma generate
echo ""
echo -e "${YELLOW}🔧 Testing Prisma Client Generation...${NC}"
npx prisma generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Prisma client generated successfully"
else
    echo -e "${RED}❌ Prisma generate failed${NC}"
    echo "Fix Prisma schema errors before deploying"
    exit 1
fi

# Step 6: Ask for confirmation
echo ""
echo -e "${YELLOW}📦 Deployment Configuration${NC}"
echo "======================================"
echo "Deploy Type: ${DEPLOY_TYPE}"
echo "Vercel User: ${VERCEL_USER}"
echo ""

if [ "$DEPLOY_TYPE" == "production" ]; then
    echo -e "${RED}⚠ WARNING: You are deploying to PRODUCTION${NC}"
    echo ""
    read -p "Are you sure? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Deployment cancelled"
        exit 0
    fi
fi

# Step 7: Deploy
echo ""
echo -e "${GREEN}🚀 Starting Deployment...${NC}"
echo "======================================"

if [ "$DEPLOY_TYPE" == "production" ]; then
    echo "Deploying to PRODUCTION..."
    vercel --prod
else
    echo "Deploying PREVIEW..."
    vercel
fi

# Step 8: Post-deployment
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment Successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test your deployment URL"
    echo "2. Check Vercel logs for errors"
    echo "3. Verify database connection"
    echo "4. Test login functionality"
    echo "5. Check admin and affiliate features"
    echo ""
    echo "Useful commands:"
    echo "  vercel logs [url]          # View logs"
    echo "  vercel inspect [url]       # Inspect deployment"
    echo "  vercel list                # List deployments"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment Failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check Vercel logs: vercel logs"
    echo "2. Verify environment variables in Vercel Dashboard"
    echo "3. Check build errors above"
    echo "4. Review VERCEL_DEPLOYMENT_GUIDE.md"
    echo ""
    exit 1
fi
