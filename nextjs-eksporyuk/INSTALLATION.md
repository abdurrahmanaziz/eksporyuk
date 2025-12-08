# 🚀 Panduan Instalasi & Setup Eksporyuk Web App

## Langkah 1: Install Dependencies

Buka terminal di folder `nextjs-eksporyuk` dan jalankan:

```powershell
cd "c:\Users\GIGABTYE AORUS'\Herd\eksporyuk\nextjs-eksporyuk"
npm install
```

## Langkah 2: Setup Database

1. Buat database MySQL baru:
```sql
CREATE DATABASE eksporyuk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copy file `.env.example` menjadi `.env`:
```powershell
Copy-Item .env.example .env
```

3. Edit file `.env` dan sesuaikan konfigurasi database:
```env
DATABASE_URL="mysql://root:password@localhost:3306/eksporyuk"
NEXTAUTH_SECRET="generate-random-string-here"
```

Untuk generate NEXTAUTH_SECRET, jalankan:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Langkah 3: Setup Prisma & Database Schema

```powershell
# Generate Prisma Client
npm run prisma:generate

# Push schema ke database
npm run prisma:push
```

## Langkah 4: Jalankan Development Server

```powershell
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000

## Langkah 5: Buat User Admin Pertama

Buka Prisma Studio:
```powershell
npm run prisma:studio
```

Atau insert manual via SQL:
```sql
INSERT INTO User (id, email, name, password, role, emailVerified, isActive, createdAt, updatedAt) 
VALUES (
  'admin001', 
  'admin@eksporyuk.com', 
  'Admin Eksporyuk', 
  '$2a$10$YourHashedPasswordHere',  -- Hash password dengan bcrypt
  'ADMIN', 
  1,
  1,
  NOW(), 
  NOW()
);

INSERT INTO Wallet (id, userId, balance, totalEarnings, totalPayout, createdAt, updatedAt)
VALUES (
  UUID(),
  'admin001',
  0,
  0,
  0,
  NOW(),
  NOW()
);
```

Untuk hash password, gunakan bcrypt:
```javascript
// Jalankan di Node.js console atau browser console
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('admin123', 10);
console.log(hashedPassword);
```

## 📁 Struktur Folder

```
nextjs-eksporyuk/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static files
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth pages (login, register)
│   │   ├── (dashboard)/      # Dashboard pages
│   │   ├── api/              # API routes
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Homepage
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── layout/           # Layout components
│   │   ├── modules/          # Feature modules
│   │   └── ui/               # UI components
│   ├── lib/
│   │   ├── auth/             # Authentication utilities
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Utility functions
│   └── types/                # TypeScript types
├── .env                       # Environment variables
├── .env.example              # Environment template
├── next.config.js            # Next.js config
├── package.json              # Dependencies
├── tailwind.config.ts        # Tailwind config
└── tsconfig.json             # TypeScript config
```

## 🔑 Role-Based Access

### Role yang Tersedia:
- **ADMIN / FOUNDER / CO_FOUNDER**: Akses penuh ke semua fitur
- **MENTOR**: Buat kursus, produk, grup, lihat earnings
- **AFFILIATE**: Generate link, tracking, earnings
- **MEMBER_PREMIUM**: Akses semua konten premium
- **MEMBER_FREE**: Akses terbatas, bisa upgrade

### Menu Dashboard per Role:

**Admin/Founder/Co-Founder:**
- Dashboard overview
- User management
- Membership management
- Products & Courses
- Groups & Events
- Affiliate management
- Financial reports
- Integrations & Settings

**Mentor:**
- Dashboard overview
- My Courses
- My Products
- My Groups
- Students management
- Earnings report

**Affiliate:**
- Dashboard overview
- My affiliate links
- Click & conversion stats
- Earnings & payouts
- Challenges & leaderboard

**Member Premium/Free:**
- Dashboard overview
- Community feed
- My groups
- My courses (premium only)
- Events
- Profile settings

## 🔧 Konfigurasi Integrasi

Edit file `.env` untuk menambahkan API keys:

```env
# Payment Gateway (Xendit)
XENDIT_API_KEY="your-xendit-api-key"
XENDIT_WEBHOOK_TOKEN="your-webhook-token"

# Email Marketing (Mailketing)
MAILKETING_API_KEY="your-mailketing-api-key"
MAILKETING_API_URL="https://api.mailketing.com"

# WhatsApp (Starsender)
STARSENDER_API_KEY="your-starsender-api-key"
STARSENDER_API_URL="https://api.starsender.com"

# Push Notifications (OneSignal)
ONESIGNAL_APP_ID="your-onesignal-app-id"
ONESIGNAL_REST_API_KEY="your-rest-api-key"

# Real-time Chat (Pusher)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="ap1"

# Video Conference
ZOOM_API_KEY="your-zoom-api-key"
ZOOM_API_SECRET="your-zoom-api-secret"

# Short Link Domain
SHORT_LINK_DOMAIN="link.eksporyuk.com"
```

## 🎨 Customization

### Mengubah Warna Brand:
Edit `tailwind.config.ts` dan `src/app/globals.css`

### Mengubah Logo:
Replace file di `public/logo.png` dan update di `src/components/layout/DashboardSidebar.tsx`

### Menambah Menu:
Edit `src/components/layout/DashboardSidebar.tsx` pada object `navigation`

## 📱 Persiapan untuk Mobile App (Flutter)

API endpoints sudah ready untuk diintegrasikan dengan Flutter mobile app:

**Base URL:** `http://localhost:3000/api`

**Authentication:**
- POST `/api/auth/register` - Register user baru
- POST `/api/auth/[...nextauth]` - Login dengan NextAuth

**User Management:**
- GET `/api/users` - Get all users
- GET `/api/users/[id]` - Get user detail
- PATCH `/api/users/[id]` - Update user
- DELETE `/api/users/[id]` - Delete user

**Dashboard:**
- GET `/api/dashboard/stats` - Get statistics

API akan menggunakan JWT token untuk authentikasi. Flutter app perlu:
1. Store JWT token setelah login
2. Include token di header: `Authorization: Bearer <token>`
3. Handle refresh token

## 🐛 Troubleshooting

### Error: Cannot connect to database
- Pastikan MySQL server berjalan
- Cek username & password di `.env`
- Cek nama database sudah benar

### Error: Prisma Client not generated
```powershell
npm run prisma:generate
```

### Error: Module not found
```powershell
rm -rf node_modules
rm package-lock.json
npm install
```

### Port 3000 sudah digunakan
```powershell
# Gunakan port lain
PORT=3001 npm run dev
```

## 📝 Development Tips

1. Gunakan Prisma Studio untuk manage data: `npm run prisma:studio`
2. Check logs di browser console untuk debug
3. Gunakan React DevTools & Network tab untuk monitoring
4. Enable hot reload dengan Fast Refresh (default di Next.js)

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change NEXTAUTH_SECRET
- [ ] Use strong database password
- [ ] Enable HTTPS
- [ ] Setup CORS properly
- [ ] Hide sensitive .env variables
- [ ] Enable rate limiting
- [ ] Setup WAF (Web Application Firewall)
- [ ] Regular database backups

## 📧 Support

Jika ada pertanyaan atau issue:
- Email: support@eksporyuk.com
- Documentation: /docs
- GitHub Issues: (repository URL)

Happy coding! 🚀
