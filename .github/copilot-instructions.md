# Eksporyuk Platform - AI Agent Guidelines

## Project Overview

**Eksporyuk** is a hybrid Laravel + Next.js membership and affiliate platform for export business education. The Laravel backend (`/`) serves primarily for local development tooling (Herd), while the main application lives in **Next.js 16** (`/nextjs-eksporyuk`).

**Architecture**: Monorepo with dual frameworks
- **Laravel 12** (`/`) - Development environment only (Herd server)
- **Next.js 16** (`/nextjs-eksporyuk`) - Main application with App Router
- **Database**: SQLite (dev) via Prisma ORM, designed for MySQL/Postgres in production
- **Auth**: NextAuth.js with JWT sessions (30-day expiry)

## Critical Knowledge

### Role-Based System (7 roles)
User roles drive everything from UI rendering to API access:
- `ADMIN` - Full platform control, revenue management
- `FOUNDER` / `CO_FOUNDER` - Revenue share (60%/40% split after fees)
- `MENTOR` - Course creation, student management  
- `AFFILIATE` - Commission earning, link generation
- `MEMBER_PREMIUM` / `MEMBER_FREE` - Access-based features

**Middleware**: `/src/middleware.ts` enforces route protection and role-based redirects. Always check session role before rendering admin/affiliate/mentor-specific content.

### Revenue Distribution Logic
Every transaction triggers a **specific split calculation** (see `/src/lib/commission-helper.ts`):

1. **Affiliate Commission**: First, take percentage/flat rate from `Membership.affiliateCommissionRate` or `Product.affiliateCommissionRate`
2. **Remaining Split**:
   - Admin: 15% → goes to `wallet.balancePending` (requires approval)
   - Founder: 60% of remainder → `balancePending` 
   - Co-Founder: 40% of remainder → `balancePending`

**Key**: Affiliate commissions go directly to `wallet.balance` (withdrawable), while admin/founder shares go to `balancePending` with `PendingRevenue` records for approval flow.

```typescript
// Example: Rp 1,000,000 transaction with 30% affiliate rate
affiliateCommission = 300,000 → balance
remaining = 700,000
adminFee = 105,000 → balancePending
founderShare = 357,000 → balancePending  
cofounderShare = 238,000 → balancePending
```

### Affiliate Short Link System
Multi-domain short link generator (`/affiliate/short-links`):
- **Pattern**: `https://{domain}/{username}/{optional-slug}`
- **Redirect Handler**: `/api/r/[username]` or `/go/[username]/[[...slug]]`
- **Tracking**: Click tracking includes IP, user agent, referrer → updates `AffiliateShortLink.clicks`, `ShortLinkDomain.totalClicks`
- **Auto-Apply**: Links can attach affiliate code (`?ref=CODE`) and coupon (`?coupon=CODE`) to target URLs
- **Uniqueness**: Enforced by `@@unique([domainId, username, slug])` constraint

When creating short links, always check username availability via `/api/affiliate/short-links/check-username?username={value}&domainId={id}`.

### Database Workflow (Prisma)
**Never use `prisma migrate reset` in development with real data!** Use this flow:

```bash
# For schema changes
npx prisma db push              # No migration files, immediate sync
# OR
npx prisma migrate dev --name [description]  # Proper migration

# After schema changes
npx prisma generate             # Regenerate client

# Seed data
node seed-memberships.js        # Or specific seed scripts
```

**Common Scripts** (root utility scripts, not npm commands):
- `check-*.js` - Database state inspection (e.g., `check-membership-data.js`)
- `test-*.js` - Feature verification (e.g., `test-commission-system.js`)
- `seed-*.js` - Data initialization (e.g., `seed-memberships.js`)

### Authentication Flow
NextAuth uses credentials provider with bcrypt password hashing:

1. **Login**: `/auth/login` → `/api/auth/[...nextauth]` → JWT token with user role
2. **Session enrichment** in `authOptions.callbacks.jwt`: Attaches `id`, `role`, `username`, `whatsapp` to token
3. **Session access**: `getServerSession(authOptions)` in API routes, `useSession()` in components
4. **Google OAuth**: Conditionally enabled if `GOOGLE_CLIENT_ID` exists in env

**Session debugging**: If JWT errors occur, clear cookies with `/clear-cookies.js` script (run in browser console).

## Development Commands

```bash
# Start development (Next.js only)
cd nextjs-eksporyuk
npm run dev                      # Port 3000

# Database operations  
npm run prisma:generate          # After schema changes
npm run prisma:push              # Sync schema without migration
npm run prisma:studio            # Visual database browser

# Seeding
npm run prisma:seed              # Run prisma/seed.ts
node seed-memberships.js         # Specific membership data

# Verification
node check-env.js                # Validate environment variables
node audit-membership-features.js # Feature completeness check
```

## API Route Patterns

All API routes follow Next.js 16 App Router conventions (`/src/app/api/**`):

```typescript
// Role-protected endpoint example
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // ... implementation
}
```

**Transaction processing**: Always call `processTransactionCommission()` from `/src/lib/commission-helper.ts` after successful payments to handle revenue split and wallet updates.

## Feature-Specific Conventions

### Commission Types
Support two models in `Membership` and `Product`:
- `PERCENTAGE`: Commission as % of price (e.g., 30%)  
- `FLAT`: Fixed amount commission (e.g., Rp 100,000)

Calculate in `/src/lib/revenue-split.ts` → `calculateRevenueSplit()`.

### Email/WhatsApp Notifications  
Integration services live in `/src/lib/services/`:
- `notificationService.ts` - Multi-channel notifications
- `mailketingService.ts` - Email marketing integration
- `starsenderService.ts` - WhatsApp messaging (Starsender API)

Auto-notifications triggered by `autoNotificationService.ts` on events like purchase completion, membership activation.

### Xendit Payment Integration
Payment gateway configured in `/src/lib/xendit.ts`:
- Virtual Account, E-Wallet, QRIS support
- Webhook handler: `/api/webhooks/xendit` (validates `XENDIT_WEBHOOK_TOKEN`)
- **Important**: After webhook confirms payment, must call revenue distribution logic

## File Structure Landmarks

```
nextjs-eksporyuk/
├── prisma/
│   └── schema.prisma          # 3900+ lines, 30+ models
├── src/
│   ├── app/
│   │   ├── (admin)/           # Admin routes (protected)
│   │   ├── (affiliate)/       # Affiliate dashboard
│   │   ├── (auth)/            # Login/register pages
│   │   ├── api/               # REST endpoints
│   │   └── middleware.ts      # Route protection
│   ├── lib/
│   │   ├── auth-options.ts    # NextAuth configuration
│   │   ├── commission-helper.ts # Revenue split logic
│   │   ├── prisma.ts          # Database client singleton
│   │   └── services/          # Business logic services
│   └── components/
│       ├── ui/                # Radix UI + shadcn components
│       └── modules/           # Feature-specific components
├── *.js (root)                # Utility/test scripts (not build)
└── *.md (root)                # Feature documentation
```

## Common Pitfalls

1. **User ID mismatch**: After database resets, browser sessions hold old user IDs → always clear cookies or create seed users with matching IDs
2. **Missing wallet records**: Use `prisma.wallet.upsert` instead of `update` to auto-create missing wallets
3. **Commission calculation**: Always retrieve `affiliateCommissionRate` from the product/membership record, not hardcoded values
4. **Route protection**: All `/admin/*`, `/affiliate/*`, `/mentor/*` routes must verify role in both middleware AND API handlers
5. **Schema updates**: Prefer `db push` over migrations during active development to avoid data loss

## Testing & Debugging

- **Feature audits**: Run `node audit-[feature].js` scripts to verify database state
- **API testing**: Test scripts like `test-commission-calculation.js` demonstrate expected flows
- **Error tracking**: Check `/src/middleware.ts` logs for auth issues, API routes log business logic errors
- **Database inspection**: `npm run prisma:studio` for visual debugging

## External Integrations

Configure in `/src/lib/integration-config.ts`:
- **Xendit**: Payment gateway (required for transactions)
- **Mailketing**: Email marketing platform
- **Starsender**: WhatsApp business messaging  
- **OneSignal**: Push notifications
- **Pusher**: Real-time features (chat, notifications)

Check `.env.example` for required keys. Missing integrations fail gracefully (console warnings, not crashes).

## Environment Variables (Critical)

```env
# Core
DATABASE_URL="file:./dev.db"          # SQLite for dev
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generate-random]"   # 32+ chars

# Payment (Production critical)
XENDIT_API_KEY=""
XENDIT_SECRET_KEY=""  
XENDIT_WEBHOOK_TOKEN=""

# Optional but recommended
PUSHER_APP_ID=""                      # Real-time features
ONESIGNAL_APP_ID=""                   # Notifications
```

## When Adding New Features

1. **Database first**: Update `prisma/schema.prisma`, run `npx prisma db push && npx prisma generate`
2. **API routes**: Create in `/src/app/api/`, always protect with session checks
3. **Revenue impact?**: If feature involves payments, integrate `commission-helper.ts`
4. **Role-based?**: Update `/src/middleware.ts` and add UI conditional rendering
5. **Test script**: Create `test-[feature].js` to verify end-to-end flow
6. **Documentation**: Add `[FEATURE]_COMPLETE.md` with implementation details

## Useful Documentation Files

Reference these markdown files for detailed feature context:
- `COMMISSION_WITHDRAW_SYSTEM_AUDIT.md` - Commission & wallet system
- `AFFILIATE_SHORT_LINKS_COMPLETE.md` - Short link implementation  
- `MEMBERSHIP_SYSTEM_SPEC.md` - Membership purchase flow
- `COMPLETE_SYSTEM_AUDIT.md` - Full platform overview
- `QUICK_REFERENCE.txt` - Common operations & flows

---

**Key Philosophy**: This platform prioritizes transactional integrity (commission splits, wallet updates) and role-based access control. When in doubt, check existing `test-*.js` scripts for working examples of complex flows like commission calculation or transaction processing.
