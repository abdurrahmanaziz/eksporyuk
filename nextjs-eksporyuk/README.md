# Eksporyuk Web App v5.2

Platform komunitas dan membership lengkap dengan fitur affiliate, event management, dan sistem keuangan terintegrasi.

## 🚀 Features

- **Multi-Role System**: Admin, Founder, Co-Founder, Mentor, Affiliate, Member Premium, Member Free
- **Membership Management**: Multiple package options with automated payment and profit sharing
- **Affiliate System**: Short link generator, tracking, tier commissions, and challenges
- **Community Groups**: Modern UI with posts, stories, likes, comments, and save features
- **Event & Webinar**: Calendar, RSVP, Zoom/Google Meet integration
- **Financial System**: Automated wallet management, commission distribution, reporting
- **Marketing Tools**: Coupons, marketing kit, email/WhatsApp templates
- **Integrations**: Xendit, Mailketing, Starsender, OneSignal, Pusher

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## 🛠️ Installation

1. Clone the repository
```bash
git clone <repository-url>
cd nextjs-eksporyuk
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
```
Edit `.env` with your configuration

4. Setup database
```bash
npm run prisma:push
npm run prisma:generate
```

5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
nextjs-eksporyuk/
├── prisma/              # Database schema
├── public/              # Static files
└── src/
    ├── app/             # Next.js app router
    │   ├── api/         # API routes
    │   ├── (auth)/      # Auth pages
    │   └── (dashboard)/ # Dashboard pages
    ├── components/      # React components
    │   ├── ui/          # UI components
    │   ├── layout/      # Layout components
    │   └── modules/     # Feature modules
    ├── lib/             # Utilities and helpers
    │   ├── auth/        # Authentication
    │   ├── prisma.ts    # Prisma client
    │   └── utils.ts     # Utility functions
    ├── types/           # TypeScript types
    └── hooks/           # Custom React hooks
```

## 🔑 Default Users

After seeding, you can login with:
- Admin: admin@eksporyuk.com / admin123
- Founder: founder@eksporyuk.com / founder123
- Mentor: mentor@eksporyuk.com / mentor123

## 🌐 API Documentation

API endpoints are available at `/api/*`:
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/products/*` - Products
- `/api/groups/*` - Community groups
- `/api/affiliates/*` - Affiliate system
- `/api/events/*` - Events and webinars
- `/api/transactions/*` - Financial transactions
- `/api/marketing/*` - Marketing tools

## 🔧 Configuration

Key configuration files:
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables

## 📱 Mobile App Integration

This web app is designed to work seamlessly with Flutter mobile apps using the REST API endpoints. API keys can be generated in the admin panel.

## 🤝 Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is proprietary software.
