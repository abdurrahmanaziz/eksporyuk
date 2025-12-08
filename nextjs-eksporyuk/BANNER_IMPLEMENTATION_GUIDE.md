# 🎨 Panduan Implementasi Banner System

## ✅ Status Implementasi

**12 Banner contoh telah dibuat** dengan gambar dari Pexels.com dan ditempatkan di berbagai lokasi strategis di platform EksporYuk.

---

## 📍 Banner Placement & Contoh

### 1. **DASHBOARD** (3 Carousel Banners)
**Lokasi:** Halaman dashboard utama (atas)
**Display Type:** CAROUSEL (sliding)

#### Banner 1: Komunitas Eksportir
- **Judul:** "Bergabung dengan Komunitas Eksportir Terbesar"
- **Deskripsi:** Dapatkan akses ke ribuan eksportir sukses, tips ekspor, dan peluang bisnis global
- **Gambar:** https://images.pexels.com/photos/6169668/pexels-photo-6169668.jpeg
- **Link:** `/community/groups`
- **Warna:** Background: #1e40af (Blue), Button: #fbbf24 (Yellow)
- **CTA:** "Join Sekarang"

#### Banner 2: Kursus Gratis
- **Judul:** "Kursus Ekspor Gratis untuk Member Baru"
- **Deskripsi:** Pelajari dasar-dasar ekspor dari mentor berpengalaman. Akses seumur hidup!
- **Gambar:** https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg
- **Link:** `/courses`
- **Warna:** Background: #059669 (Green), Button: #fbbf24 (Yellow)
- **CTA:** "Mulai Belajar"

#### Banner 3: B2B Marketplace
- **Judul:** "Hubungkan dengan Buyer Internasional"
- **Deskripsi:** Platform B2B matching dengan buyer dari 50+ negara. Mulai ekspor hari ini!
- **Gambar:** https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg
- **Link:** `/marketplace`
- **Warna:** Background: #7c3aed (Purple), Button: #fbbf24 (Yellow)
- **CTA:** "Explore Marketplace"

**Implementasi di Code:**
```tsx
// src/app/(dashboard)/dashboard/page.tsx
import DashboardBanner from '@/components/banners/DashboardBanner'

<DashboardBanner placement="DASHBOARD" />
```

---

### 2. **SIDEBAR** (2 Static Banners)
**Lokasi:** Sidebar kanan di berbagai halaman (Dashboard, Feed, Profile)
**Display Type:** STATIC (tidak bergerak)

#### Banner 1: Upgrade Pro Member
- **Judul:** "Upgrade ke Pro Member"
- **Deskripsi:** Akses unlimited courses, mentoring, dan premium tools
- **Gambar:** https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg
- **Link:** `/membership`
- **Warna:** Background: #dc2626 (Red), Button: #fbbf24 (Yellow)
- **CTA:** "Upgrade Now"
- **Priority:** 10 (Paling atas)

#### Banner 2: Event Minggu Ini
- **Judul:** "Event Eksportir Minggu Ini"
- **Deskripsi:** Webinar gratis: "Cara Mendapatkan Sertifikat Ekspor"
- **Gambar:** https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg
- **Link:** `/events`
- **Warna:** Background: #0891b2 (Cyan), Button: #fbbf24 (Yellow)
- **CTA:** "Daftar Gratis"
- **Priority:** 8

**Implementasi di Code:**
```tsx
// src/components/layout/Sidebar.tsx atau src/components/banners/SidebarBanner.tsx
import SidebarBanner from '@/components/banners/SidebarBanner'

<SidebarBanner placement="SIDEBAR" limit={2} />
```

---

### 3. **FEED** (2 Inline Sponsored Banners)
**Lokasi:** Di tengah feed posts (setiap 5 posts)
**Display Type:** INLINE (menyatu dengan konten)

#### Banner 1: Freight Forwarding (SPONSORED)
- **Judul:** "Jasa Freight Forwarding Terpercaya"
- **Deskripsi:** Kirim produk Anda ke seluruh dunia dengan aman dan cepat
- **Gambar:** https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg
- **Link:** `https://wa.me/628123456789`
- **Sponsor:** Global Logistics
- **Sponsor Logo:** https://images.pexels.com/photos/1116302/pexels-photo-1116302.jpeg
- **Warna:** Background: #f59e0b (Orange), Button: #000000 (Black)
- **CTA:** "Hubungi Kami"
- **isSponsored:** true

#### Banner 2: Accounting Software (SPONSORED)
- **Judul:** "Software Accounting untuk Eksportir"
- **Deskripsi:** Kelola invoice, PO, dan laporan keuangan ekspor dengan mudah
- **Gambar:** https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg
- **Link:** `/products/accounting-software`
- **Sponsor:** EksporPro
- **Sponsor Logo:** https://images.pexels.com/photos/39284/macbook-apple-imac-computer-39284.jpeg
- **Warna:** Background: #6366f1 (Indigo), Button: #fbbf24 (Yellow)
- **CTA:** "Coba Gratis 30 Hari"
- **isSponsored:** true

**Implementasi di Code:**
```tsx
// src/app/(dashboard)/feed/page.tsx
{posts.map((post, index) => (
  <>
    <PostCard key={post.id} post={post} />
    {(index + 1) % 5 === 0 && (
      <FeedBanner placement="FEED" />
    )}
  </>
))}
```

---

### 4. **GROUP** (2 Sidebar Banners)
**Lokasi:** Sidebar kanan di halaman grup
**Display Type:** STATIC

#### Banner 1: Mentor Online
- **Judul:** "Mentor Ekspor Online"
- **Deskripsi:** Konsultasi 1-on-1 dengan mentor berpengalaman
- **Gambar:** https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg
- **Link:** `/mentors`
- **Warna:** Background: #10b981 (Emerald), Button: #fbbf24 (Yellow)
- **CTA:** "Pilih Mentor"

#### Banner 2: Template Dokumen
- **Judul:** "Template Dokumen Ekspor"
- **Deskripsi:** Download 50+ template dokumen ekspor gratis
- **Gambar:** https://images.pexels.com/photos/3184431/pexels-photo-3184431.jpeg
- **Link:** `/resources/templates`
- **Warna:** Background: #8b5cf6 (Violet), Button: #fbbf24 (Yellow)
- **CTA:** "Download Sekarang"

**Implementasi di Code:**
```tsx
// src/components/groups/GroupSidebar.tsx
import SidebarBanner from '@/components/banners/SidebarBanner'

<SidebarBanner placement="GROUP" limit={2} />
```

---

### 5. **PROFILE** (1 Sidebar Banner)
**Lokasi:** Sidebar kanan di halaman profil user
**Display Type:** STATIC

#### Banner: Lengkapi Profil
- **Judul:** "Lengkapi Profil Anda"
- **Deskripsi:** Dapatkan lebih banyak peluang dengan profil yang lengkap
- **Gambar:** https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg
- **Link:** `/profile/edit`
- **Warna:** Background: #ec4899 (Pink), Button: #fbbf24 (Yellow)
- **CTA:** "Lengkapi Profil"

**Implementasi di Code:**
```tsx
// src/app/(dashboard)/profile/[id]/page.tsx
<SidebarBanner placement="PROFILE" limit={1} />
```

---

### 6. **FLOATING** (1 Floating Promo Banner)
**Lokasi:** Pojok kanan bawah (sticky)
**Display Type:** FLOATING (mengambang)

#### Banner: Promo Membership
- **Judul:** "Promo Membership 50% OFF"
- **Deskripsi:** Hanya hari ini! Upgrade ke Pro Member dengan diskon 50%
- **Gambar:** https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg
- **Link:** `/membership?promo=PROMO50`
- **Warna:** Background: #ef4444 (Red), Button: #fbbf24 (Yellow)
- **CTA:** "Klaim Promo"
- **Duration:** 7 hari dari sekarang
- **Position:** Fixed bottom-right

**Implementasi di Code:**
```tsx
// src/components/layout/RootLayout.tsx atau DashboardLayout.tsx
import FloatingBanner from '@/components/banners/FloatingBanner'

<FloatingBanner placement="FLOATING" />
```

---

### 7. **POPUP** (1 Welcome Popup)
**Lokasi:** Popup modal di tengah layar
**Display Type:** POPUP (modal)

#### Banner: Welcome Ebook
- **Judul:** "Selamat Datang di EksporYuk!"
- **Deskripsi:** Dapatkan ebook gratis "Panduan Lengkap Memulai Ekspor" untuk member baru
- **Gambar:** https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg
- **Link:** `/resources/ebook-panduan-ekspor`
- **Warna:** Background: #0284c7 (Sky), Button: #fbbf24 (Yellow)
- **CTA:** "Download Gratis"
- **viewLimit:** 1 (hanya tampil 1x per user)

**Implementasi di Code:**
```tsx
// src/components/banners/PopupBanner.tsx
import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/dialog'

useEffect(() => {
  const hasSeenPopup = localStorage.getItem('popup_banner_shown')
  if (!hasSeenPopup) {
    setShowPopup(true)
    localStorage.setItem('popup_banner_shown', 'true')
  }
}, [])
```

---

## 🎯 Fitur Banner System

### Targeting Options
- **targetRoles:** Filter berdasarkan role user (MEMBER, AFFILIATE, SUPPLIER, ADMIN)
- **targetMemberships:** Filter berdasarkan membership tier (basic, pro, lifetime)
- **targetProvinces:** Filter berdasarkan provinsi user

### Analytics & Tracking
- **viewCount:** Jumlah tampilan banner
- **clickCount:** Jumlah klik pada banner
- **viewLimit:** Batas maksimal tampilan (opsional)
- **clickLimit:** Batas maksimal klik (opsional)
- **dailyBudget:** Budget harian untuk sponsored banner (opsional)

### Scheduling
- **startDate:** Tanggal mulai tampil
- **endDate:** Tanggal selesai tampil
- **isActive:** Status aktif/non-aktif manual

### Sponsored Content
- **isSponsored:** true/false
- **sponsorName:** Nama sponsor
- **sponsorLogo:** Logo sponsor

---

## 📊 API Endpoints

### Get Banners by Placement
```typescript
GET /api/banners?placement=DASHBOARD&limit=3

Response:
{
  "banners": [
    {
      "id": "xxx",
      "title": "...",
      "description": "...",
      "imageUrl": "...",
      "linkUrl": "...",
      "linkText": "...",
      "placement": "DASHBOARD",
      "displayType": "CAROUSEL",
      "backgroundColor": "#1e40af",
      "textColor": "#ffffff",
      "buttonColor": "#fbbf24",
      "buttonTextColor": "#000000",
      "priority": 10,
      "isActive": true,
      "isSponsored": false
    }
  ]
}
```

### Track Banner View
```typescript
POST /api/banners/view
Body: { "bannerId": "xxx" }
```

### Track Banner Click
```typescript
POST /api/banners/click
Body: { "bannerId": "xxx" }
```

---

## 🎨 Component Examples

### DashboardBanner.tsx (Carousel)
```tsx
'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function DashboardBanner({ placement = 'DASHBOARD' }) {
  const [banners, setBanners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const res = await fetch(`/api/banners?placement=${placement}&limit=5`)
      const data = await res.json()
      setBanners(data.banners || [])
      
      // Track view
      if (data.banners?.[0]?.id) {
        await fetch('/api/banners/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bannerId: data.banners[0].id }),
        })
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  if (loading || banners.length === 0) return null

  const banner = banners[currentIndex]

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-8">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${banner.imageUrl})`,
          backgroundColor: banner.backgroundColor 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
      </div>

      <div className="relative z-10 h-full flex flex-col justify-center px-12">
        <h1 className="text-4xl font-bold mb-4" style={{ color: banner.textColor }}>
          {banner.title}
        </h1>
        <p className="text-lg mb-8 max-w-2xl" style={{ color: banner.textColor }}>
          {banner.description}
        </p>
        
        <Link
          href={banner.linkUrl}
          className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-base w-fit"
          style={{ 
            backgroundColor: banner.buttonColor, 
            color: banner.buttonTextColor 
          }}
          onClick={async () => {
            await fetch('/api/banners/click', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bannerId: banner.id }),
            })
          }}
        >
          {banner.linkText}
        </Link>
      </div>

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 p-2 rounded-full"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 p-2 rounded-full"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

### SidebarBanner.tsx (Static)
```tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export default function SidebarBanner({ placement = 'SIDEBAR', limit = 2 }) {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const res = await fetch(`/api/banners?placement=${placement}&limit=${limit}`)
      const data = await res.json()
      setBanners(data.banners || [])
      
      // Track views
      for (const banner of data.banners || []) {
        await fetch('/api/banners/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bannerId: banner.id }),
        })
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || banners.length === 0) return null

  return (
    <div className="space-y-4">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.linkUrl}
          onClick={async () => {
            await fetch('/api/banners/click', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bannerId: banner.id }),
            })
          }}
          className="block rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
        >
          <div 
            className="relative h-48"
            style={{ backgroundColor: banner.backgroundColor }}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 
                className="font-bold text-lg mb-1" 
                style={{ color: banner.textColor }}
              >
                {banner.title}
              </h3>
              <p 
                className="text-sm mb-3" 
                style={{ color: banner.textColor }}
              >
                {banner.description}
              </p>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ 
                  backgroundColor: banner.buttonColor, 
                  color: banner.buttonTextColor 
                }}
              >
                {banner.linkText}
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
```

---

## 🚀 Cara Menambah Banner Baru

### Via Admin Panel
1. Login sebagai admin
2. Buka `/admin/banners`
3. Klik "Buat Banner Baru"
4. Isi form:
   - Title & Description
   - Upload/URL gambar
   - Link tujuan & CTA text
   - Pilih placement & display type
   - Set colors (background, text, button)
   - Atur targeting (roles, memberships, provinces)
   - Set scheduling (start/end date)
   - Optional: Sponsor info, view/click limits
5. Klik "Simpan"

### Via Seeder Script
```javascript
await prisma.banner.create({
  data: {
    title: 'Judul Banner',
    description: 'Deskripsi singkat',
    imageUrl: 'https://images.pexels.com/...',
    linkUrl: '/target-page',
    linkText: 'CTA Button',
    placement: 'DASHBOARD',
    displayType: 'CAROUSEL',
    backgroundColor: '#1e40af',
    textColor: '#ffffff',
    buttonColor: '#fbbf24',
    buttonTextColor: '#000000',
    priority: 10,
    startDate: new Date(),
    endDate: new Date('2030-12-31'),
    isActive: true,
    isSponsored: false,
    targetRoles: [],
    targetMemberships: [],
    targetProvinces: [],
    createdBy: adminUserId,
  },
})
```

---

## 📈 Analytics Dashboard

Dashboard analytics banner tersedia di `/admin/banners` menampilkan:
- Total banners aktif
- Total views hari ini
- Total clicks hari ini
- CTR (Click-Through Rate)
- Top performing banners
- Revenue dari sponsored banners

---

## ✨ Best Practices

1. **Ukuran Gambar:**
   - Dashboard Carousel: 1920x600px
   - Sidebar: 600x400px
   - Feed Inline: 1200x400px
   - Floating: 400x400px
   - Popup: 800x600px

2. **Warna:**
   - Gunakan high contrast untuk readability
   - Button warna terang (#fbbf24) dengan text gelap (#000000)
   - Background sesuai brand/tema

3. **Copy:**
   - Title: Max 60 karakter
   - Description: Max 120 karakter
   - CTA: Action-oriented, jelas (3-5 kata)

4. **Targeting:**
   - Segment berdasarkan user behavior
   - Test A/B untuk optimize conversion
   - Monitor CTR dan adjust

5. **Performance:**
   - Compress gambar (WebP recommended)
   - Lazy load untuk banner below fold
   - Cache API responses

---

## 🎯 Kesimpulan

Sistem banner sudah lengkap dengan:
- ✅ 12 banner contoh di 7 placement berbeda
- ✅ Gambar dari Pexels.com (royalty-free)
- ✅ Targeting & analytics built-in
- ✅ Admin panel untuk management
- ✅ API endpoints ready
- ✅ Component examples & dokumentasi

**Akses Admin Panel:** `/admin/banners` (login sebagai admin@eksporyuk.com)
