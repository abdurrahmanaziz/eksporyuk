# Security Best Practices untuk Eksporyuk

## 🔐 1. Sensitive Data NEVER di Git

### ✅ BENAR (.env - TIDAK di-commit)
```bash
# .gitignore
.env
.env.local
.env.production
*.key
*.pem
```

### ❌ SALAH (Hard-coded secrets)
```typescript
// ❌ JANGAN BEGINI!
const apiKey = "xnd_production_12345..." // Public di GitHub!

// ✅ BENAR
const apiKey = process.env.XENDIT_SECRET_KEY // Di env vars
```

---

## 🔒 2. Environment Variables Storage

**Lokasi aman untuk secrets:**

### GitHub Secrets (untuk CI/CD)
```yaml
# .github/workflows/deploy.yml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  XENDIT_SECRET_KEY: ${{ secrets.XENDIT_SECRET_KEY }}
```

**Setup:**
```
Repository → Settings → Secrets and variables → Actions → New secret
```

### Vercel Environment Variables
```
Vercel Dashboard → Project → Settings → Environment Variables
```

**Categories:**
- Production (only production deployment)
- Preview (staging branches)
- Development (local dev)

### Neon Connection String
```
Neon Dashboard → Connection Details → Copy (automatically encrypted)
```

---

## 🛡️ 3. Repository Access Control

### Public vs Private

**Saat ini (Public repo):**
- ✅ Code visible
- ✅ Good for open-source
- ❌ Must be careful dengan secrets

**Recommended (Private repo):**
```
Repository → Settings → Danger Zone → Change visibility → Private
```

**Benefits:**
- ✅ Code hanya team Anda
- ✅ Still free unlimited
- ✅ Extra layer of security

### Team Access
```
Repository → Settings → Collaborators
- Admin: Full access
- Write: Can push code
- Read: View only
```

---

## 🔐 4. Database Security (Neon)

### Connection Security
```env
# ✅ Pooled connection (TLS encrypted)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require&pgbouncer=true"
```

**Built-in protections:**
- ✅ TLS 1.3 encryption
- ✅ IP whitelist (optional)
- ✅ Password rotation
- ✅ Audit logs

### Backup Strategy
```bash
# Auto-backup (Neon free):
- Daily backups (last 7 days)
- Point-in-time recovery

# Manual backup (extra safety):
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Store di:
1. Local encrypted drive
2. Cloud storage (Google Drive encrypted)
3. Second Neon project (branching)
```

---

## 🚨 5. Security Checklist

### Before Migration
- [ ] All secrets di `.env` (tidak di code)
- [ ] `.env` in `.gitignore`
- [ ] No `console.log(password)` di code
- [ ] API keys rotated (generate baru)
- [ ] Database password strong (min 16 char)

### After Migration
- [ ] GitHub repository private
- [ ] 2FA enabled di GitHub account
- [ ] Vercel account 2FA enabled
- [ ] Neon account 2FA enabled
- [ ] Team members limited access
- [ ] Audit logs monitored weekly

### Ongoing
- [ ] Review GitHub commits weekly
- [ ] Check Vercel deployment logs
- [ ] Monitor Neon database metrics
- [ ] Update dependencies monthly (`npm audit`)
- [ ] Rotate API keys quarterly

---

## 🔍 6. Monitoring & Alerts

### GitHub Security Alerts
```
Repository → Security → Dependabot alerts
- Auto-creates PR untuk vulnerable dependencies
- Email notifications
```

### Vercel Security Headers
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY', // Prevent clickjacking
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff', // Prevent MIME sniffing
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains', // Force HTTPS
        },
      ],
    },
  ]
}
```

### Neon Connection Monitoring
```typescript
// lib/prisma.ts
prisma.$on('error', (e) => {
  console.error('Database error:', e);
  // Send to Sentry or error tracking service
});
```

---

## 🆘 7. Incident Response Plan

### If GitHub Account Compromised
1. Change GitHub password immediately
2. Revoke all personal access tokens
3. Check recent commits for malicious code
4. Notify team members
5. Rotate all API keys in Vercel/Neon

### If Database Credentials Leaked
1. Rotate Neon password immediately (Dashboard → Settings)
2. Update `DATABASE_URL` in Vercel
3. Check Neon audit logs for unauthorized access
4. Restore from backup if needed

### If Vercel Deployment Compromised
1. Rollback to previous deployment
2. Check deployment logs
3. Regenerate deployment token
4. Update GitHub secrets

---

## 📊 8. Security Scorecard

### Current Security Level: ⚠️ MEDIUM

**Strengths:**
- ✅ Using environment variables
- ✅ Database in IntegrationConfig (not env)
- ✅ HTTPS everywhere

**Weaknesses:**
- ⚠️ Public repository (code visible)
- ⚠️ No 2FA enforcement
- ⚠️ No security headers configured
- ⚠️ No automated security scanning

### Target Security Level: ✅ HIGH

**Action items:**
1. Make repository private
2. Enable 2FA on all accounts
3. Add security headers (done in guide)
4. Setup Dependabot
5. Regular security audits

---

## 💡 Additional Tools (Optional)

### 1. Dependabot (Free)
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/nextjs-eksporyuk"
    schedule:
      interval: "weekly"
```

### 2. CodeQL Scanning (Free for public repos)
```yaml
# .github/workflows/codeql.yml
name: CodeQL Security Scan
on: [push, pull_request]
```

### 3. Snyk (Security scanning)
```bash
npm install -g snyk
snyk auth
snyk test # Scan for vulnerabilities
```

### 4. Git-secrets (Prevent committing secrets)
```bash
# Install
brew install git-secrets # macOS
# atau
pip install detect-secrets # cross-platform

# Setup
git secrets --install
git secrets --register-aws
```

---

## 🎯 Summary

**Your data is SAFE if:**
1. ✅ Secrets in environment variables (NOT in code)
2. ✅ Repository private (or public with careful review)
3. ✅ 2FA enabled everywhere
4. ✅ Regular security updates
5. ✅ Team access controlled

**GitHub/Vercel/Neon are MORE SECURE than self-managed VPS because:**
- Enterprise-grade infrastructure
- 24/7 security team
- Automatic updates
- Multiple redundancy
- Industry compliance (SOC 2, ISO 27001)

**Bottom line:** Your data lebih aman di GitHub + Vercel + Neon daripada di VPS yang Anda manage sendiri.
