Buatkan Web Apps dengan Next.js yang nantinya akan bisa dibuat mobiles apps android dan ios dengan flutter. dengan fitur dibawah ini. pastikan semua role memiliki tampilan masing-masing. pastikan terintegrasi penuh dengan sistem dan database! Jika fitur ini berhubungan dengan role lainnya.

---

# 🚀 PR Checklist - Migrasi Data Sejoli ke Platform Baru

## Status: In Progress (20 Desember 2025)

### PR #1: Sinkronisasi Membership dari Transaksi Sejoli
**Status: ⏳ TODO**
- [ ] User yang sudah SUCCESS pembayaran di admin/sales WAJIB memiliki membership aktif
- [ ] Mapping durasi dari Sejoli ke membership baru:
  - Sejoli 6 Bulan → Membership 6 Bulan
  - Sejoli 12 Bulan → Membership 12 Bulan  
  - Sejoli Lifetime → Membership Lifetime
- [ ] Buat script untuk sync UserMembership dari Transaction yang SUCCESS
- [ ] Validasi semua member premium punya membership record aktif

### PR #2: Import Kelas dari Tutor LMS (Web Sejoli)
**Status: ⏳ TODO**
- [ ] Gunakan API Tutor LMS untuk ambil data kelas dari web Sejoli
- [ ] Import video, judul, deskripsi secara lengkap
- [ ] **Kelas "Ekspor Yuk"** → Akses untuk SEMUA membership (6 bulan, 12 bulan, lifetime)
- [ ] **Kelas "Website Ekspor"** → Akses HANYA untuk membership LIFETIME
- [ ] Setup Course-Membership relation dengan benar

### PR #3: Setup Grup Wajib untuk Member
**Status: ⏳ TODO**
- [ ] **Grup "Support Ekspor Yuk"** → Semua membership masuk (6 bulan, 12 bulan, lifetime)
- [ ] **Grup "Website Ekspor"** → Hanya membership LIFETIME
- [ ] Auto-join member ke grup sesuai paket membership
- [ ] Validasi semua member aktif sudah masuk grup yang sesuai

---

### Progress Log:
| Tanggal | PR | Status | Notes |
|---------|-----|--------|-------|
| 20 Des 2025 | - | ✅ | Affiliate data 88.1% coverage, admin/sales menampilkan affiliate & komisi |
| 20 Des 2025 | - | ✅ | PENDING transactions menampilkan affiliate (komisi setelah bayar) |

---

# 💡 Eksporyuk Web Apps – PRD Ringkas (v1.0 → v5.2)

## 🧭 1. Struktur Peran Utama

| Role                             | Fungsi Utama                                                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin / Founder / Co-Founder** | Kontrol utama fitur, monitor keuangan, manajemen membership, produk & grup. Founder & Co-Founder punya wallet otomatis, pembagian hasil otomatis 60 / 40 setelah potong affiliate dan fee 15%. |
| **Mentor / Instruktur**          | Buat kelas, kursus, produk, dan grup privat. Dapat komisi sharing dari penjualan kelas.                                                                                                        |
| **Affiliate**                    | Dapat link referral pendek, tracking klik & konversi, dashboard statistik, tier komisi (tingkat bonus & tantangan penjualan).                                                                  |
| **Member Premium**               | Akses kelas, grup VIP, webinar & produk eksklusif. Dapat fitur simpan postingan & follow mentor.                                                                                               |
| **Member Biasa (Free)**          | Akses dasar komunitas dan feed, tanpa kelas premium. Dapat upgrade kapan saja.                                                                                                                 |

---

## 🧩 2. Fitur Utama (versi gabungan)

### 🔹 A. Dashboard & Profil

* Statistik personal (omzet, komisi, event aktif)
* Edit profil + role management (otomatis upgrade ke affiliate dengan persetujuan admin)
* Notifikasi email / WhatsApp pilihan pengguna

---

### 🔹 B. Membership & Produk

* Sistem paket (1 bulan, 3 bulan, 6 bulan, 12 bulan, lifetime) dengan manipulasi harga dan badge “paling laris”
* Pembayaran otomatis → bagi hasil Founder/Co-Founder/Admin/Affiliate
* Kupon otomatis & referral cookies aktif pada domain utama
* Produk & membership dapat terhubung ke grup komunitas agar member otomatis join

---

### 🔹 C. Affiliate System & Short link

* Link pendek generator atau short link dengan tracking klik & konversi. jadi affiliate dari link yang panjang bisa dibuat short link agar lebih keren. Admin bisa setting short link untuk nambah beberapa domain yang bisa di setting dnsnya. affiliate nanti tinggal pilih mau gunakan domain mana yang sudah disediakan sama admin. semua shortlink juga ada tracking lengkap. contoh (eks: `link.eksporyuk.com/dinda`) jadi simple. tapi sebelum buat short link nanti di periksa dulu sudah ada yang gunakan atau belum untuk usernamenya.
* Dashboard affiliate (statistik, payout status, history klik & penjualan)
* Tier komisi & challenge (tingkatan bonus, leaderboard, target mingguan)
* Otomatis terhubung ke produk / membership via cookies
* Wallet affiliate terpisah dan payout manual oleh admin

---

### 🔹 D. Grup Komunitas (v5.2 Modern UI)

* **Tipe grup**: Publik, Privat, Hidden
* **Roles**: Owner, Admin, Moderator, Member
* **Postingan berfitur lengkap**:
  - **Text Formatting**: Bold, Italic, Underline, Strikethrough
  - **Typography**: Heading 1-6, Normal text, Quote style
  - **Lists**: Bullet points, Numbered lists, Checklist
  - **Media Upload**: Foto, Video, Audio, Dokumen (PDF, DOC, etc)
  - **Link Preview**: Auto preview untuk website, YouTube, Vimeo, dll
  - **Interactive**: Tag @username, Emoji picker, Sticker, Reactions
  - **Engagement**: Reply per comment, Pin post, Save postingan
  - **Advanced Posts**: Polling, Event announcement, Location tag
  - **Quote Styles**: Facebook-style dengan background warna-warni
  - **Scheduling**: Jadwal postingan untuk publish nanti
  - **Privacy Controls**: Turn on/off comments per post
* **Story & feed visual** (ala Facebook)
* **List mentor populer**, member aktif (status online hijau), event mendatang
* **Fitur follow antar member** & DM / chat privat
* **Integrasi kelas dan produk** per grup (kelas langsung terkait dengan grup)
* **Leaderboard & badge** partisipasi
* **Admin Settings untuk Grup**: 
  - Enable/disable posting features per grup
  - Moderate postingan sebelum publish
  - Setting permissions per role

---

### 🔹 E. Event & Webinar

* Jadwal event, RSVP, dan pengingat
* Integrasi Zoom / Google Meet / recording archive
* Komisi event (opsional) – diatur per produk

---

### 🔹 F. Keuangan & Dompet

* Semua transaksi tercatat dalam panel admin: omzet, komisi, affiliate, fee perusahaan
* Dompet setiap role (Founder, Co-Founder, Affiliate, Mentor) otomatis update
* Filter harian / mingguan / bulanan / tahunan
* Export laporan CSV

---

### 🔹 G. Marketing & Template

* Kupon & diskon otomatis
* Marketing kit (logo, copywriting, CTA affiliate)
* Template email dan WhatsApp broadcast
* Tantangan affiliate / gamifikasi

---

### 🔹 H. Sistem & Integrasi

* API Keys publik untuk koneksi Flutter / mobile apps
* Broadcast notif email / WA 
* Log aktivitas & analytic dashboard
* Import / Migrasi member WordPress (v4.0)
* Integrasi server terpisah per modul (agar scalable hingga > 10 ribu member)
* Pengaturan Api untuk Mailketing, Starsender dan xendit, one signal, pusher

---

### 🔹 I. Database & Direktori Ekspor (Premium Features)

* **Database Buyer** - Direktori buyer/importir internasional dengan filter negara, produk, dan skala bisnis
* **Database Supplier** - Direktori supplier/produsen lokal dengan verifikasi dan rating
* **Database Forwarder** - Direktori freight forwarder, shipping agent, dan logistik ekspor dengan rate comparison
* **Dokumen Ekspor** - Template & generator dokumen ekspor (Invoice, Packing List, COO, dll) dengan auto-fill
* **Member Directory** - Cek member per kota/provinsi untuk networking lokal dan kolaborasi regional
* Sistem verifikasi & rating untuk database (kredibilitas tinggi)
* Export/import data CSV untuk integrasi dengan sistem lain
* API akses untuk member premium (quota-based)

**Diferensiasi Paket:**
- Free: Lihat 5 data/bulan
- 1 Bulan: Lihat 20 data/bulan
- 3 Bulan: Lihat 50 data/bulan + download CSV
- 6 Bulan: Lihat 100 data/bulan + download CSV + API access
- 12 Bulan: Unlimited access + priority listing + verified badge

---

## 🧱 3. Struktur Menu (Modular)

```plaintext
DASHBOARD
 ├─ Profil
 ├─ Notifikasi

MANAJEMEN PENGGUNA
 ├─ Pengguna
 ├─ Roles & Permissions
 ├─ Membership

KONTEN
 ├─ Produk
 ├─ Grup
 ├─ Acara
 ├─ Kursus

KOMUNITAS
 ├─ Feed Komunitas
 ├─ Event & Webinar

DIREKTORI EKSPOR (Premium)
 ├─ Database Buyer
 ├─ Database Supplier
 ├─ Database Forwarder
 ├─ Dokumen Ekspor
 ├─ Member Directory (By City/Region)

PEMASARAN
 ├─ Afiliasi
 ├─ Kupon & Diskon
 ├─ Marketing Kit

KEUANGAN
 ├─ Pendapatan
 ├─ Dompet
 ├─ Payment Settings

ALAT
 ├─ Chat
 ├─ Broadcast
 ├─ Analitik
 ├─ Gamifikasi
 ├─ Activity Logs

TEMPLATE
 ├─ Template Email
 ├─ Template WhatsApp

SISTEM
 ├─ Pengaturan
 ├─ Integrasi
 ├─ API Keys
```

---

## 🚀 Output yang Diharapkan Untuk Copilot

> “Buatkan struktur code Flutter (atau Next.js) berdasarkan PRD ringkas di atas, dengan modul modular sesuai menu.
> Setiap modul memiliki folder controllers, models, views, dan services (API connector ke backend Laravel).
> Buat UI modern versi 5.2 (komunitas dengan feed, grup, mentor, event, dan simpan postingan).”


# 🧾 PRD v5.3 — Membership & Access System Core Update (Final)

## 🎯 Tujuan
Membangun sistem keanggotaan inti yang mengatur akses user terhadap kelas, grup, dan produk di ekosistem EksporYuk. Sistem ini memastikan setiap user hanya memiliki **satu membership aktif** dan seluruh akses terhubung secara otomatis ke konten terkait.

---

## 🧩 1. Struktur Utama Sistem

### 1.1 Membership Core
- 1 user hanya memiliki **1 membership aktif**.
- Membership memiliki durasi: 1, 3, 6, 12 bulan, atau lifetime.
- Upgrade menggantikan plan lama → status lama jadi `expired`.
- Perpanjangan menambah durasi plan aktif tanpa kehilangan progress.

**Tabel:** `memberships`, `membership_features`, `user_memberships`

---

### 1.2 Grup & Kelas Langsung di Membership
- Admin memilih grup & kelas bawaan di setiap membership plan.
- User otomatis bergabung ke semua grup & kelas bawaan setelah aktivasi.
- Upgrade otomatis mengganti akses ke grup/kelas sesuai plan baru.

**Contoh:**
| Plan | Grup | Kelas |
|------|------|-------|
| Silver | Komunitas Pemula | Dasar Ekspor |
| Gold | Komunitas Premium | Strategi Ekspor, Kelas Buyer |
| Platinum | Semua Grup | Semua Kelas + Webinar VIP |

---

### 1.3 Produk Tambahan (Add-on)
- Produk dijual terpisah dari membership.
- Produk bisa berisi kelas, grup, ebook, webinar, template.
- User membeli produk → otomatis dapat akses ke semua item di dalamnya.

**Tabel:** `products`, `product_items`, `user_products`

---

### 1.4 Hubungan Antar Modul
```
User
 ├─ Membership (1 aktif)
 │   ├─ Grup default
 │   ├─ Kelas default
 │   └─ Bonus konten
 ├─ Produk (bisa banyak)
 │   ├─ Grup tambahan
 │   └─ Kelas tambahan
 └─ Transaksi → Affiliate → Founder/Co-Founder Split
```

---

## 💰 2. Sistem Transaksi & Komisi

### 2.1 Logika Transaksi
- Semua pembelian (membership / produk) disimpan di sales.
- Saat pembayaran sukses:
  1. Membership / produk aktif otomatis.
  2. Pembagian hasil otomatis:
     - Affiliate → komisi sesuai produk atau membership.
     - Founder & Co-Founder → pembagian 60/40 setelah potongan affiliate.
     - Perusahaan → 15% pendapatan masuk saldo operasional.
     - Revenue bisa on/off

### 2.2 Wallet dan Keuangan
- Saldo otomatis masuk ke wallet tiap role: admin dll.
- Admin punya hak penuh kontrol transaksi & approval.
- Laporan bisa difilter per hari, minggu, bulan, tahun.

---

## 📚 3. Fitur Grup & Kelas Otomatis

### 3.1 Grup Otomatis dari Membership
- User aktif → auto join grup sesuai plan.
- Upgrade → keluar dari grup lama, masuk ke grup baru.
- Grup bisa: publik, privat, tersembunyi.

### 3.2 Kelas Otomatis
- Kelas default plan langsung aktif setelah pembayaran.
- Progress disimpan di `user_course_progress`.
- Saat masa aktif habis → kelas terkunci tanpa hapus progress.

---

## 🔁 4. Alur Utama

### 4.1 Alur Pembelian Membership
1. User pilih paket → durasi → checkout → bayar.
2. Sistem aktifkan membership & akses grup/kelas otomatis.
3. Bagi hasil & wallet terupdate.
4. Notifikasi via Email & WhatsApp.

---

### 4.2 Alur Upgrade Membership (Revisi Lengkap)
1. User upgrade ke plan lebih tinggi.
2. Plan lama → status `expired`.
3. Plan baru aktif dengan durasi baru.
4. Grup & kelas lama dinonaktifkan, grup/kelas baru terbuka otomatis.
5. Admin bisa pilih **mode pembayaran upgrade:**
   - **Mode 1 — Akumulasi (bayar selisih)**
     - Sistem menghitung harga baru dikurangi nilai sisa plan lama.
   - **Mode 2 — Full Payment (bayar penuh di depan)**
     - Sistem mengabaikan sisa masa aktif, user membayar harga penuh.
6. Data tersimpan di `membership_upgrade_logs`:
   ```json
   {
     "user_id": 123,
     "old_plan_id": 1,
     "new_plan_id": 2,
     "upgrade_date": "2025-11-20",
     "payment_mode": "accumulate",
     "total_paid": 499000
   }
   ```
7. Notifikasi otomatis via Email, WA, dan push notification.

---

### 4.3 Alur Produk Tambahan
1. Admin buat produk berisi kelas/grup/webinar.
2. User beli produk → sistem aktifkan akses otomatis.
3. Produk bisa dibeli walau user sudah punya membership.

---

## ⚙️ 5. Panel Admin - Kelola Membership

### 5.1 Form Buat/Edit Paket Membership
Ketika admin membuat paket membership, wajib ada field berikut:

**A. Informasi Dasar:**
- **Harga** - Harga paket (bisa multiple pricing untuk durasi berbeda)
- **Judul & Slug** - Judul paket, slug auto-generate dari judul (editable)
- **Deskripsi** - Deskripsi lengkap paket (rich text editor)
- **Logo** - Upload logo paket (icon/badge)
- **Banner** - Upload banner untuk sales page

**B. Marketing Features:**
- **Badge "Paling Laris"** - Toggle on/off untuk tampilkan badge di checkout
- **Badge "Paling Murah"** - Toggle on/off untuk tampilkan badge di checkout
- **Link Eksternal Salespage** - URL custom salespage (opsional)

**C. Follow-Up System:**
- **Notifikasi Follow-Up WhatsApp** - Admin bisa tambah unlimited follow-up message
- Format: Delay (hari), Pesan Template
- Follow-up ini juga tersedia untuk affiliate di dashboard mereka
- Setiap lead dari affiliate dapat menggunakan follow-up sequence ini

**D. Integrasi Konten:**
- **Pilih Grup** - Multi-select grup yang auto-join saat aktivasi
- **Pilih Produk** - Multi-select produk yang auto-grant saat aktivasi
- **Pilih Kelas** - Multi-select kelas yang auto-enroll saat aktivasi
- **Pilih Fitur** - Checklist fitur yang didapat (akses database, export, dll)

### 5.2 Link Output dari Membership

Setelah membership dibuat, sistem generate 2 jenis link:

**1. Link Salespage (Tercookies)**
- Format: `https://eksporyuk.com/membership/{slug}`
- Sudah tercookies dengan affiliate tracking
- Redirect ke link eksternal salespage (jika diisi)
- Tracking klik affiliate otomatis

**2. Link Checkout**
Sistem menyediakan 3 template checkout:

**a) Checkout Single Plan**
- Format: `https://eksporyuk.com/checkout/{slug}`
- 1 paket membership saja
- Tampilkan detail paket, fitur, harga, diskon

**b) Checkout Multiple Plans (Comparison)**
- Format: `https://eksporyuk.com/checkout/compare?plans={slug1},{slug2},{slug3}`
- Misal: 6 bulan, 12 bulan, lifetime dalam 1 halaman
- Tampilan tabel perbandingan fitur
- User pilih salah satu untuk checkout

**c) Checkout All-in-One**
- Format: `https://eksporyuk.com/checkout/all`
- Semua paket membership ditampilkan
- Filter by duration, price, features

### 5.3 Fitur Checkout Page

**A. User Authentication:**
- Jika belum login → Form registrasi wajib:
  - Nama lengkap
  - Email aktif (Gmail)
  - Nomor WhatsApp
  - Password
- Jika sudah login → Tampilkan info user, tombol "Ganti Akun"

**B. Checkout Form:**
- Tampilkan detail paket terpilih
- **Kolom kupon** - Auto-apply jika ada di cookies
- Total harga (setelah diskon)
- Tombol "Bayar Sekarang" → Integrasi Xendit

**C. Payment Flow:**
1. User klik "Bayar Sekarang"
2. Create transaction (status: PENDING)
3. Redirect ke Xendit payment page
4. Webhook callback → Update status SUCCESS
5. Auto-activate membership, join grup, enroll kelas, grant produk
6. Send email & WhatsApp konfirmasi
7. Trigger follow-up sequence

**Referensi UI:** Checkout dibales.ai

### 5.4 Admin Sales Dashboard

Setelah checkout, data masuk ke **Admin > Sales** dengan kolom:

| Kolom | Format | Keterangan |
|-------|--------|------------|
| **Invoice** | INV001, INV002, dst | Auto-increment, tampil di baris atas |
| **Tanggal** | 23 Nov 2025 | Tampil di bawah invoice |
| **Nama** | Budi Santoso | Nama pembeli (baris atas) |
| **Email** | budi@gmail.com | Email pembeli (baris bawah) |
| **Produk** | Membership Gold | Jenis: Paket/Produk/Kelas |
| **Affiliate** | Dinda (Rp 150.000) | Nama affiliate (atas), Komisi (bawah) |
| **Follow Up** | 3/5 terkirim | Status follow-up message |
| **Aksi** | [Detail] [Resend] | View full info, resend notif |

**Detail Info (Modal):**
- Semua info profil buyer
- Info affiliate (jika ada)
- Transaction history
- Follow-up logs
- Payment proof (dari Xendit)

### 5.5 Kelola Produk & Kelas

**Fitur Produk:**
- Bisa tambah grup (auto-join saat beli)
- Bisa tambah kelas (auto-enroll saat beli)
- Follow-up WhatsApp (sama seperti membership)
- Checkout flow sama seperti membership

**Fitur Kelas:**
- Bisa tambah grup (private group untuk kelas)
- Bisa tambah produk bonus (ebook, template, dll)
- Follow-up WhatsApp untuk reminder belajar
- Checkout flow sama seperti membership

---

## 🔗 6. Integrasi
| Layanan | Fungsi |
|----------|--------|
| Xendit / Pembayaran otomatis |
| Mailketing | Email invoice & aktivasi |
| Starsender / Fonnte | WhatsApp notifikasi |
| Pusher / OneSignal | Real-time notifikasi & chat |

---

## 🧠 7. Roadmap Versi Berikutnya (5.4+)
- Multi-tier Affiliate (level 2–3)
- Laporan Founder/Co-Founder detail
- Sistem top-up saldo & pembayaran dengan wallet
- Reminder otomatis perpanjangan membership
- Sinkronisasi Flutter App & Web Apps

# 🧾 PRD v5.4 — Learning Management System (LMS)

## 🎯 Tujuan
Menambahkan sistem pembelajaran berbasis kursus (LMS) seperti Tutor LMS dengan fitur monetisasi, progress tracking, notifikasi belajar, dan integrasi penuh dengan membership, grup, serta produk.

---

## 🧩 1. Struktur Kursus
- Hierarki: **Kursus → Modul → Pelajaran → Quiz → Sertifikat**
- Atribut kursus:
  - Judul, deskripsi, thumbnail, kategori, level (pemula/menengah/ahli)
  - Status (draft, pending, publish)
  - Durasi & bahasa
  - Instruktur & harga (jika berbayar)

---

## 👩‍🏫 2. Instruktur
- Role mentor/instruktur bisa membuat kursus baru.
- Kursus baru masuk status *pending review*.
- Admin memiliki hak untuk approve / reject / edit kursus.
- Profil instruktur menampilkan bio, sosial media, jumlah kursus, rating, total murid.
- Role  Admin buat kursus langsung bisa aktif, tambahkan bisa menunjuk mentor sebagai penanggung jawab kelas
---

## 💰 3. Monetisasi (Opsional)
- Monetisasi dapat diaktifkan/nonaktifkan per kursus.
- Mode:
  1. **Gratis** — untuk semua member.
  2. **Berbayar langsung** — via Xendit.
  3. **Langganan (Subscription)** — hanya untuk plan tertentu.
  4. **Affiliate aktif (opsional)** — kursus punya link affiliate sendiri.
- Admin dapat mengatur:
  - Harga reguler & diskon.
  - Komisi affiliate per kursus.
- ⚙️ **Aturan Otomatis:** Jika kursus atau kelas masuk dalam *membership plan*, maka otomatis menjadi **GRATIS** untuk semua member dengan plan tersebut, dan tidak memerlukan pembayaran tambahan.

---

## 📚 4. Fitur Pembelajaran
- Progress tracking otomatis.
- Resume kursus: user bisa lanjut dari posisi terakhir.
- Quiz & assignment (multiple choice, essay).
- Penilaian otomatis & manual.
- Sertifikat otomatis saat kursus selesai.
- Komentar & forum diskusi di tiap kursus.
- Tampilan progress belajar visual (progress bar, persentase, badge).

---

## 🔔 5. Notifikasi & Reminder Belajar
- Sistem memantau aktivitas belajar mingguan.
- Jika user belum belajar selama X hari, sistem mengirim:
  - **Email / WhatsApp**: “Hai [Nama], kamu belum lanjut kelas minggu ini!”
  - **Notifikasi in-app (kanan atas)** mirip BuddyBoss.
- Saat klik notifikasi, user diarahkan ke **halaman terakhir yang dia pelajari**.
- Reminder bisa dikonfigurasi di admin panel (hari, waktu, tipe notif).

---

## 🔗 6. Integrasi Sistem
- Kursus dapat dikaitkan dengan:
  - **Membership** → kursus otomatis aktif sesuai plan (GRATIS untuk plan tersebut).
  - **Grup** → tiap kursus punya grup belajar privat.
  - **Produk** → kursus dijual sebagai bagian paket produk.
- Akses aktif otomatis setelah pembelian atau aktivasi membership.

---

## ⚙️ 7. Admin Panel
- Kelola kursus & status publikasi.
- Approve mentor & kursus baru.
- Atur komisi instruktur dan affiliate.
- Pantau progress belajar siswa & statistik.

---

## 📊 8. Statistik & Insight
- Jumlah siswa aktif.
- Persentase penyelesaian kursus.
- Kursus paling populer.
- Pendapatan per kursus & total instruktur.
- Aktivitas belajar mingguan (aktif/tidak aktif).

---

## 🔗 9. Integrasi
| Layanan | Fungsi |
|----------|--------|
| Xendit | Pembayaran otomatis |
| Mailketing | Email reminder belajar & invoice |
| Starsender / Fonnte | WhatsApp reminder belajar |
| Pusher / OneSignal | Push notification (in-app & mobile) |
| Supabase / Firebase | Penyimpanan progress & real-time data |

---

## 🧠 10. Roadmap v5.5
- AI Tutor Assistant (chatbot belajar)
- Sistem penilaian berbasis skor adaptif
- Leaderboard & weekly challenge untuk siswa
- Integrasi notifikasi kalender (Google/Outlook)

Tidak ada dokumen yang cocok ditemukan di file yang kamu unggah sebelumnya.
Namun, saya bisa langsung bantu **melist ulang seluruh fitur grup komunitas (versi 5.2 dan pembahasan terbaru)** yang sudah kita rumuskan dari hasil diskusi kamu — versi yang lebih ringkas tapi lengkap 👇

---

## 🧩 **Fitur Grup Komunitas (v5.2 – Update Terpadu)**

### **1️⃣ Manajemen Grup**

* Public / Private / Hidden Group.
* Grup hanya bisa dibuat oleh Admin.
* Member otomatis bergabung jika membeli produk atau membership yang terhubung dengan grup.
* Group Roles: Owner, Admin, Moderator, Member.
* Aturan grup, pengumuman, pinned post.

---

### **2️⃣ Komunikasi & Aktivitas**

* Timeline / Activity Feed (seperti Facebook).
* Postingan: teks, gambar, video, polling.
* Komentar berjenjang & mention (@username).
* Reaksi: like, love, wow, dll.
* DM antar member dan group chat realtime (via Pusher / Socket.io).
* Fitur “Simpan Postingan” (bookmark ke profil member).

---

### **3️⃣ Pembelajaran & Integrasi Produk**

* Grup bisa dihubungkan langsung ke **kelas atau produk**.
* Jika produk masuk membership, grupnya otomatis gratis.
* Setiap grup bisa menampilkan daftar kelas / produk terkait.
* Fitur dokumen & file library.
* Tampilkan progress belajar (jika terkait LMS).

---

### **4️⃣ Event & Aktivitas Grup**

* Event terintegrasi (Zoom / Google Meet link).
* Member bisa RSVP langsung.
* Reminder otomatis via email / WA (pakai Mailketing & Starsender).
* Daftar event mendatang di sidebar kanan.

---

### **5️⃣ Engagement & Gamifikasi**

* Leaderboard mingguan (berdasarkan postingan & engagement).
* Badges & Achievements.
* Polling, kuis, challenge grup.
* “Member of the Week” otomatis.

---

### **6️⃣ Keamanan & Moderasi**

* Laporan posting / member.
* Keyword moderation & pre-approval post.
* Ban, mute, dan block member.

---

### **7️⃣ Profil Member**

* Profil publik seperti Facebook.
* Tombol follow / connect.
* Status online (indikator hijau).
* Riwayat posting, grup diikuti, dan aktivitas terbaru.

---

### **8️⃣ Notifikasi**

* Push notif (browser & mobile) via OneSignal.
* Notif email & WA untuk interaksi penting.
* Reminder aktivitas mingguan: “Anda belum aktif di grup minggu ini.”

---

### **9️⃣ Tampilan & Desain**

* Desain modern (inspirasi Facebook + BuddyBoss).
* Sidebar kiri: navigasi grup, kelas, event.
* Sidebar kanan: member aktif, event mendatang, leaderboard.
* Responsif untuk mobile.

---

# 📋 SOP PENGERJAAN SISTEM (WAJIB DIBACA)

## 🚨 Aturan Utama Developer

### 1️⃣ **DILARANG HAPUS FITUR**
- **JANGAN PERNAH** hapus fitur yang sudah dibuat di sistem
- Setiap fitur yang sudah live harus tetap dijaga
- Jika ada request hapus → **WAJIB KONFIRMASI** dan cek impact ke fitur lain
- Mode kerja: **UPDATE & ENHANCE**, bukan replace

### 2️⃣ **SELALU CEK PRD.MD**
- File `prd.md` adalah **sumber kebenaran tunggal**
- Sebelum coding, baca PRD terkait fitur yang dikerjakan
- Jika ada perubahan requirement → update PRD dulu, baru coding
- PRD harus selalu sinkron dengan kode production

### 3️⃣ **INTEGRASI PENUH WAJIB**
- Setiap fitur harus terintegrasi penuh:
  - ✅ Database (Prisma schema)
  - ✅ API Routes (backend logic)
  - ✅ UI Pages (frontend display)
  - ✅ Role-based access (permissions)
- Tidak boleh ada fitur setengah jadi

### 4️⃣ **CROSS-ROLE COMPATIBILITY**
- Jika fitur berhubungan dengan role lain → perbaiki semuanya
- Contoh: Membership berhubungan dengan Affiliate, Founder, Admin
- Test dari semua role yang terlibat

### 5️⃣ **UPDATE MODE, BUKAN REPLACE**
- Perintah bersifat **perbaharui/enhance**, bukan hapus-ganti
- Jika ada conflict → tanyakan dulu sebelum hapus
- Simpan backup sebelum perubahan besar

### 6️⃣ **ZERO ERROR TOLERANCE**
- Setiap kerjaan harus dicek sebelum commit:
  - ✅ TypeScript compilation (no errors)
  - ✅ API endpoint testing (return correct response)
  - ✅ Database migration (no conflicts)
  - ✅ UI rendering (no broken layout)
- Gunakan audit script untuk validasi

### 7️⃣ **MENU & NAVIGATION**
- Jika menu belum dibuat → buat di sidebar sesuai role
- **DILARANG duplikat menu** (cek existing menu dulu)
- **DILARANG duplikat sistem** (cek fitur serupa dulu)
- Menu harus konsisten across roles

---

## 🔄 Workflow Pengerjaan

### Step 1: Analisis Requirement
1. Baca PRD terkait fitur
2. Identifikasi role yang terlibat
3. Cek existing code (database, API, UI)
4. Buat checklist task

### Step 2: Database Schema
1. Cek Prisma schema existing
2. Tambah model/field baru (jika perlu)
3. Generate migration
4. Test migration di dev

### Step 3: Backend API
1. Buat/update API routes
2. Implement business logic
3. Integrate dengan sistem existing (revenue-split, wallet, etc)
4. Test dengan Postman/curl

### Step 4: Frontend UI
1. Buat/update pages & components
2. Implement role-based rendering
3. Integrate dengan API
4. Test responsiveness

### Step 5: Testing & Validation
1. Run audit script (jika ada)
2. Test dari semua role terkait
3. Check TypeScript errors
4. Validate integration points

### Step 6: Documentation
1. Update PRD (jika ada perubahan spec)
2. Update API documentation
3. Create migration guide (jika breaking changes)

---

## ✅ Checklist Sebelum Commit

**Database:**
- [ ] Schema updated di `prisma/schema.prisma`
- [ ] Migration generated & tested
- [ ] No conflicts dengan existing models

**Backend:**
- [ ] API routes created/updated
- [ ] Business logic implemented
- [ ] Auth middleware integrated
- [ ] Role-based access implemented
- [ ] Error handling added
- [ ] Activity logging added (jika perlu)

**Frontend:**
- [ ] Pages created/updated
- [ ] Components created/updated
- [ ] API integration working
- [ ] Role-based UI rendering
- [ ] Responsive design
- [ ] Loading states handled
- [ ] Error states handled

**Integration:**
- [ ] Revenue split (jika ada payment)
- [ ] Wallet update (jika ada transaction)
- [ ] Email notification (jika perlu)
- [ ] WhatsApp notification (jika perlu)
- [ ] Activity log (untuk tracking)

**Testing:**
- [ ] TypeScript: No compilation errors
- [ ] API: All endpoints returning correct response
- [ ] UI: No broken layouts
- [ ] Auth: Role-based access working
- [ ] Integration: All connected systems working

**Documentation:**
- [ ] PRD updated (jika ada perubahan)
- [ ] API docs updated
- [ ] Code comments added
- [ ] Migration guide (jika perlu)

---

## 🎯 Priority Levels

**P0 - Critical (Fix Immediately):**
- Production errors
- Payment system down
- Auth/Security issues
- Data loss/corruption

**P1 - High (Fix within 24h):**
- Feature broken for all users
- Performance issues
- Integration failures

**P2 - Medium (Fix within 1 week):**
- Feature broken for specific role
- UI/UX improvements
- Minor bugs

**P3 - Low (Backlog):**
- Nice-to-have features
- Optimization
- Refactoring

---

## 🛠️ Tools & Commands

**Development:**
```bash
# Start dev server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Generate Prisma client
npx prisma generate

# Run database migration
npx prisma migrate dev

# Seed database
npx prisma db seed
```

**Testing:**
```bash
# Run feature audit
node audit-membership-features.js

# Run API tests
node test-opsi-c.js

# Check specific endpoint
curl http://localhost:3000/api/[endpoint]
```

**Cleanup:**
```bash
# Clear Next.js cache
Remove-Item ".next" -Recurse -Force

# Kill Node processes
Get-Process node | Stop-Process -Force

# Restart Herd (Laravel)
herd restart
```

---

## 📞 Support & Escalation

Jika menemukan issue yang tidak bisa diselesaikan:
1. Screenshot error message
2. Copy full error stack trace
3. List steps to reproduce
4. Check similar issues di dokumentasi
5. Escalate ke senior developer dengan info lengkap

---

**Last Updated:** 23 November 2025  
**Version:** v5.3 (Membership System Complete)


**fitur pembuatan produk**
---

## 🧾 **1️⃣ Informasi Utama Produk**

| Field                       | Deskripsi                                                      | Keterangan                            |
| --------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| **Judul Produk**            | Nama yang tampil di halaman utama dan sales page               | *Wajib*                               |
| **Slug/URL Otomatis**       | Untuk URL unik, misal `/produk/nama-produk`                    | Bisa auto generate                    |
| **Deskripsi Singkat**       | 1-2 kalimat untuk preview card produk                          | Untuk listing / halaman utama         |
| **Deskripsi Lengkap**       | Penjelasan detail (bisa pakai editor teks, gambar, video, dll) | Untuk halaman salespage               |
| **Cover Image**             | Gambar utama (1280x720 rekomendasi)                            | Thumbnail produk                      |
| **Gallery / Video Preview** | Tambahan foto/video demo produk                                | Opsional tapi meningkatkan CTR        |
| **Kategori Produk**         | Ebook, Kelas, Webinar, Template, Jasa, dsb.                    | Bisa multiple                         |
| **Tag Produk**              | Kata kunci agar mudah dicari                                   | Misal “ekspor”, “training”, “digital” |
| **Status**                  | Draft / Publish / Coming Soon                                  | Admin bisa atur sebelum tampil publik |

---

## 💰 **2️⃣ Harga & Monetisasi**

| Field                             | Deskripsi                                 | Keterangan                    |
| --------------------------------- | ----------------------------------------- | ----------------------------- |
| **Harga Dasar**                   | Harga jual normal                         | Contoh: Rp499.000             |
| **Diskon / Harga Promo**          | Jika ada potongan harga                   | Bisa jadwal otomatis berakhir |
| **Tipe Harga**                    | Sekali bayar / Langganan bulanan / Gratis | Menyesuaikan jenis produk     |
| **Affiliate Komisi (%)**          | Persentase bagi hasil affiliate           | Contoh: 30%                   |
| **Potongan untuk Member Premium** | Harga lebih murah untuk member aktif      | Auto-detect membership        |
| **Pajak / Fee Opsional**          | Jika mau tambahkan VAT / admin fee        | Opsional                      |

---

## 🧩 **3️⃣ Integrasi & Akses**

| Field                            | Deskripsi                                      | Keterangan                   |
| -------------------------------- | ---------------------------------------------- | ---------------------------- |
| **Hubungkan ke Grup Komunitas**  | Setelah beli, user otomatis join grup tertentu | Bisa lebih dari 1            |
| **Hubungkan ke Kelas / Kursus**  | Setelah beli, kelas otomatis terbuka           | Wajib untuk produk edukasi   |
| **Hubungkan ke Event / Webinar** | Jika produk = webinar/event                    | Akan trigger kirim link Zoom |
| **Link File / Ebook / Resource** | File download (PDF, ZIP, MP4)                  | Dikirim ke email & dashboard |
| **Level Akses**                  | Publik / Member Only / Premium Only            | Bisa buat eksklusif          |
| **Batas Akses (hari)**           | Untuk trial / langganan                        | Contoh: akses 30 hari        |

---

## 🔔 **4️⃣ Otomatisasi & Notifikasi**

### **📋 Sistem Notifikasi & Reminder (v5.5 - Complete)**

**Filosofi:** Hybrid approach - Notifikasi umum untuk sistem, notifikasi spesifik per fitur untuk personalisasi maksimal.

---

#### **A. Notifikasi Umum (Global Templates)**
**Lokasi Admin:** Pengaturan > Notifikasi > Templates

Template standar untuk sistem:
- Welcome new user (email + WhatsApp)
- Email verification
- Password reset
- Account deactivated
- Weekly activity digest
- Monthly report

**Benefit:** Konsisten, mudah maintain, user experience seragam

---

#### **B. Notifikasi Per Membership (Specific)**
**Lokasi Admin:** Membership > Create/Edit > Tab "Reminders"

**Fitur Lengkap:**

**1. Multi-Channel Support**
- ✅ Email (via Mailketing)
- ✅ WhatsApp (via Starsender)
- ✅ Push Notification (via OneSignal)
- ✅ In-App Notification (via Pusher)

**2. Flexible Trigger Types**
- `AFTER_PURCHASE` - X jam/hari setelah pembelian
- `BEFORE_EXPIRY` - X hari sebelum membership habis
- `ON_SPECIFIC_DATE` - Tanggal tertentu (event, webinar)
- `CONDITIONAL` - Berdasarkan kondisi user (tidak aktif, belum belajar, dll)

**3. Smart Scheduling**
```typescript
{
  delayAmount: 3,           // Angka delay
  delayUnit: "DAYS",        // HOURS, DAYS, WEEKS
  preferredTime: "09:00",   // Jam kirim (HH:mm)
  timezone: "Asia/Jakarta",
  daysOfWeek: ["Mon", "Wed", "Fri"], // Hari tertentu
  avoidWeekends: true       // Skip weekend
}
```

**4. Rich Content Builder**

**Email Content:**
- Subject line
- HTML body dengan editor rich text
- CTA button (text + link)
- Shortcodes support

**WhatsApp Content:**
- Plain text message (max 1024 char)
- CTA button (optional)
- Shortcodes support

**Push Notification:**
- Title (max 65 char)
- Body (max 240 char)
- Icon URL
- Deep link untuk click action

**In-App Notification:**
- Title
- Body
- Link internal
- Auto-popup atau silent

**5. Shortcodes Available**
```
{name}          - Nama user
{email}         - Email user
{phone}         - Nomor HP
{plan_name}     - Nama membership plan
{expiry_date}   - Tanggal expire (formatted)
{days_left}     - Sisa hari membership
{payment_link}  - Link untuk renewal
{group_link}    - Link grup komunitas
{course_link}   - Link ke kursus
{dashboard_link} - Link dashboard user
```

**6. Conditional Logic (Advanced)**
```typescript
conditions: {
  userActive: false,        // Kirim jika user tidak aktif
  coursesCompleted: 0,      // Belum selesai kursus
  groupJoined: false,       // Belum join grup
  lastLoginDays: 7,         // Tidak login 7 hari
  purchaseCount: 0,         // Belum beli produk
  membershipUsage: "LOW"    // Usage rendah
}
```

**7. Sequence Control**
- `sequenceOrder` - Urutan reminder (drag to reorder)
- `stopOnAction` - Pause jika user ambil aksi
- `stopIfCondition` - Stop jika kondisi terpenuhi
- Unlimited reminders per membership

**8. Tracking & Analytics**
Per reminder track:
- Sent count
- Delivered count
- Opened count (email/push)
- Clicked count (CTA)
- Failed count
- Conversion rate

**Dashboard menampilkan:**
- Delivery success rate per channel
- Best performing reminder (highest conversion)
- Best time to send (analytics)
- User engagement heatmap

---

#### **C. UI Form Admin - Membership Reminder Builder**

**Tab "Reminders" di form Create/Edit Membership:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Automation & Reminders</CardTitle>
    <CardDescription>
      Setup unlimited follow-up sequence untuk membership ini
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    {/* List existing reminders */}
    <div className="space-y-4">
      {reminders.map((reminder, index) => (
        <ReminderCard 
          key={reminder.id}
          reminder={reminder}
          order={index + 1}
          onEdit={() => openReminderEditor(reminder)}
          onDelete={() => deleteReminder(reminder.id)}
          onToggle={() => toggleReminder(reminder.id)}
          isDraggable
        />
      ))}
    </div>
    
    <Button onClick={openReminderEditor}>
      + Add New Reminder
    </Button>
  </CardContent>
</Card>

{/* Reminder Editor Modal */}
<Dialog>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Create Reminder</DialogTitle>
    </DialogHeader>
    
    <Tabs defaultValue="basic">
      <TabsList>
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
      
      {/* Tab 1: Basic Settings */}
      <TabsContent value="basic">
        <div className="space-y-4">
          <div>
            <Label>Reminder Title *</Label>
            <Input placeholder="e.g., Welcome Email Day 1" />
          </div>
          
          <div>
            <Label>Trigger Type</Label>
            <Select>
              <SelectItem value="AFTER_PURCHASE">After Purchase</SelectItem>
              <SelectItem value="BEFORE_EXPIRY">Before Expiry</SelectItem>
              <SelectItem value="ON_SPECIFIC_DATE">Specific Date</SelectItem>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Delay Amount</Label>
              <Input type="number" placeholder="3" />
            </div>
            <div>
              <Label>Delay Unit</Label>
              <Select>
                <SelectItem value="HOURS">Hours</SelectItem>
                <SelectItem value="DAYS">Days</SelectItem>
                <SelectItem value="WEEKS">Weeks</SelectItem>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Send Channels</Label>
            <div className="space-y-2">
              <Checkbox label="Email" checked={emailEnabled} />
              <Checkbox label="WhatsApp" checked={whatsappEnabled} />
              <Checkbox label="Push Notification" checked={pushEnabled} />
              <Checkbox label="In-App" checked={inAppEnabled} />
            </div>
          </div>
        </div>
      </TabsContent>
      
      {/* Tab 2: Content */}
      <TabsContent value="content">
        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="push">Push</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
            <div className="space-y-4">
              <div>
                <Label>Subject Line *</Label>
                <Input placeholder="Selamat datang di {plan_name}!" />
              </div>
              
              <div>
                <Label>Email Body</Label>
                <RichTextEditor 
                  placeholder="Hai {name}, selamat bergabung..."
                  supportShortcodes
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CTA Button Text</Label>
                  <Input placeholder="Lihat Dashboard" />
                </div>
                <div>
                  <Label>CTA Button Link</Label>
                  <Input placeholder="{dashboard_link}" />
                </div>
              </div>
              
              <Alert>
                <InfoIcon />
                <AlertDescription>
                  Available shortcodes: {name}, {email}, {plan_name}, {expiry_date}, {group_link}
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          {/* Similar for WhatsApp, Push tabs */}
        </Tabs>
      </TabsContent>
      
      {/* Tab 3: Advanced */}
      <TabsContent value="advanced">
        <div className="space-y-4">
          <div>
            <Label>Preferred Send Time</Label>
            <Input type="time" value="09:00" />
            <p className="text-xs text-muted-foreground">
              Reminder akan dikirim pada jam ini (timezone: Asia/Jakarta)
            </p>
          </div>
          
          <div>
            <Label>Send Only On</Label>
            <div className="flex gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <ToggleButton key={day} value={day}>{day}</ToggleButton>
              ))}
            </div>
          </div>
          
          <div>
            <Label>Conditional Logic (Optional)</Label>
            <Select>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="userActive:false">Send only if user not active</SelectItem>
              <SelectItem value="coursesCompleted:0">Send only if no courses completed</SelectItem>
              <SelectItem value="groupJoined:false">Send only if not joined group</SelectItem>
            </Select>
          </div>
          
          <div>
            <Checkbox label="Stop sequence if user takes action" />
            <Checkbox label="Avoid weekends" />
          </div>
        </div>
      </TabsContent>
    </Tabs>
    
    <DialogFooter>
      <Button variant="outline" onClick={closeDialog}>Cancel</Button>
      <Button onClick={saveReminder}>Save Reminder</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

#### **D. Backend Logic - Reminder Execution**

**File:** `src/lib/notifications/reminderService.ts`

```typescript
export class ReminderService {
  // Schedule all reminders for a new membership purchase
  async scheduleRemindersForUser(userId: string, membershipId: string) {
    const reminders = await prisma.membershipReminder.findMany({
      where: { 
        membershipId,
        isActive: true 
      },
      orderBy: { sequenceOrder: 'asc' }
    })
    
    for (const reminder of reminders) {
      await this.scheduleReminder(userId, reminder)
    }
  }
  
  // Calculate send time based on trigger and delay
  private calculateSendTime(reminder: MembershipReminder, userMembership: UserMembership) {
    let baseDate = new Date()
    
    if (reminder.triggerType === 'AFTER_PURCHASE') {
      baseDate = userMembership.startDate
    } else if (reminder.triggerType === 'BEFORE_EXPIRY') {
      baseDate = userMembership.endDate
      // Subtract delay instead of add
    }
    
    // Add delay
    const delayMs = this.convertToMs(reminder.delayAmount, reminder.delayUnit)
    const sendDate = new Date(baseDate.getTime() + delayMs)
    
    // Apply preferred time
    if (reminder.preferredTime) {
      const [hours, minutes] = reminder.preferredTime.split(':')
      sendDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
    
    // Check day of week restrictions
    if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
      // Adjust to next allowed day
      while (!reminder.daysOfWeek.includes(this.getDayName(sendDate))) {
        sendDate.setDate(sendDate.getDate() + 1)
      }
    }
    
    // Avoid weekends
    if (reminder.avoidWeekends) {
      const day = sendDate.getDay()
      if (day === 0) sendDate.setDate(sendDate.getDate() + 1) // Sunday -> Monday
      if (day === 6) sendDate.setDate(sendDate.getDate() + 2) // Saturday -> Monday
    }
    
    return sendDate
  }
  
  // Send reminder via all enabled channels
  async sendReminder(log: ReminderLog) {
    const { reminder, user } = await this.loadReminderData(log.reminderId, log.userId)
    
    const results = []
    
    // Email
    if (reminder.emailEnabled) {
      results.push(await this.sendEmail(reminder, user))
    }
    
    // WhatsApp
    if (reminder.whatsappEnabled) {
      results.push(await this.sendWhatsApp(reminder, user))
    }
    
    // Push
    if (reminder.pushEnabled) {
      results.push(await this.sendPush(reminder, user))
    }
    
    // In-App
    if (reminder.inAppEnabled) {
      results.push(await this.sendInApp(reminder, user))
    }
    
    // Update log status
    await this.updateReminderLog(log.id, results)
  }
  
  // Replace shortcodes in content
  private replaceShortcodes(content: string, data: any) {
    return content
      .replace(/{name}/g, data.name)
      .replace(/{email}/g, data.email)
      .replace(/{phone}/g, data.phone || '')
      .replace(/{plan_name}/g, data.planName)
      .replace(/{expiry_date}/g, format(data.expiryDate, 'dd MMM yyyy'))
      .replace(/{days_left}/g, data.daysLeft.toString())
      .replace(/{payment_link}/g, data.paymentLink)
      .replace(/{group_link}/g, data.groupLink)
      .replace(/{course_link}/g, data.courseLink)
      .replace(/{dashboard_link}/g, data.dashboardLink)
  }
}
```

---

#### **E. Cron Job untuk Execution**

**File:** `src/app/api/cron/reminders/route.ts`

```typescript
// Run every hour
export async function GET(request: Request) {
  const now = new Date()
  
  // Find all pending reminders scheduled for this hour
  const pendingLogs = await prisma.reminderLog.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: {
        lte: now
      }
    },
    include: {
      reminder: true,
      user: true
    }
  })
  
  for (const log of pendingLogs) {
    try {
      await reminderService.sendReminder(log)
    } catch (error) {
      await prisma.reminderLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      })
    }
  }
  
  return NextResponse.json({ 
    processed: pendingLogs.length 
  })
}
```

---

#### **F. Analytics Dashboard**

**Admin > Membership > [Plan] > Tab "Reminder Analytics"**

Tampilkan metrics:
- Total reminders sent
- Delivery rate by channel (Email: 98%, WA: 95%, Push: 87%)
- Open rate (Email: 45%, Push: 62%)
- Click rate (CTA: 18%)
- Conversion rate (Upgrade/Renewal: 12%)
- Best performing reminder
- Optimal send time recommendation

---

| Fitur                                | Deskripsi                                        |
| ------------------------------------ | ------------------------------------------------ |
| **Kirim Email Otomatis**             | Setelah pembelian, kirim invoice + instruksi     |
| **Notifikasi WhatsApp (Starsender)** | Kirim pesan otomatis (link Zoom, reminder, dsb)  |
| **Reminder Event Otomatis**          | +3 hari, +1 hari, +1 jam sebelum event           |
| **Kirim Rekaman Setelah Event**      | Otomatis kirim link rekaman ke dashboard & email |
| **Follow-up Upsell**                 | Jika belum upgrade ke membership → muncul CTA    |

---

## 🎯 **5️⃣ Konten & Aset Tambahan**

| Field                  | Deskripsi                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| **CTA Button Text**    | Tombol custom di halaman sales (“Gabung Sekarang”, “Lihat Detail”) |
| **FAQ Produk**         | Tambahkan pertanyaan umum                                          |
| **Testimoni / Review** | Manual atau otomatis dari user yang sudah beli                     |
| **Bonus / Add-on**     | Tambahan eBook, template, voucher, dll                             |
| **Bundle Produk**      | Gabungkan beberapa produk jadi satu paket                          |

---

## 🧠 **6️⃣ Advanced / Backend**

| Fitur                                   | Deskripsi                               |
| --------------------------------------- | --------------------------------------- |
| **Webhook (Xendit)**                    | Update otomatis saat pembayaran sukses  |
| **Kupon / Referral Code**               | Bisa dikaitkan ke affiliate             |
| **Tracking Pixel (Facebook, GA, dsb.)** | Untuk remarketing                       |
| **SEO Meta Title & Description**        | Untuk halaman produk                    |
| **Status Produk**                       | Draft, Publish, Coming Soon             |
| **Creator / Mentor ID**                 | Jika produk dibuat oleh mentor tertentu |
| **Stock / Kuota (Webinar)**             | Batasi jumlah pendaftar                 |

---

🔥 Mantap banget — kamu udah mikir ke arah **retention system & engagement automation**,
yang akan bikin komunitas dan kelasmu terasa hidup kayak Facebook + BuddyBoss Pro + Notion discussion.

Berikut versi lengkap pembaruan **PRD ChatMentor & Realtime Notification System v7.3**,
yang sekarang sudah mencakup **interaksi real-time lintas fitur (chat, postingan, komentar, kelas, grup, event, dan notifikasi global).**

---

# 💬 **PRD v7.3 — ChatMentor + Realtime Engagement & Notification System**

## 🎯 **Tujuan**

Meningkatkan interaksi dan keterlibatan user melalui sistem **notifikasi real-time lintas fitur**.
Setiap aktivitas penting — seperti pesan baru, komentar, postingan, reply diskusi kelas, atau event — langsung memicu notifikasi di seluruh platform (web, mobile, email, dan push).

---

## 🧩 **1️⃣ Ruang Aktivitas yang Didukung**

| Area                                | Interaksi                      | Target Notifikasi                       |
| ----------------------------------- | ------------------------------ | --------------------------------------- |
| 🗨️ **ChatMentor**                  | Pesan antar mentor-user        | Penerima pesan langsung (real-time)     |
| 💬 **Komentar Postingan Komunitas** | Balasan di grup                | Semua anggota grup & yang ikut komentar |
| 🧠 **Diskusi Kelas / Modul**        | Komentar di modul pembelajaran | Semua murid di kelas & mentor pengajar  |
| 📅 **Event / Webinar**              | Pengumuman & reminder          | Peserta event yang terdaftar            |
| 🛍️ **Produk / Membership**         | Review baru, update konten     | Pembeli & admin produk                  |
| 👥 **Follow / Connect**             | User baru mengikuti user lain  | User yang di-follow                     |
| 🎁 **Affiliate**                    | Komisi masuk, referral baru    | Affiliate yang bersangkutan             |
| 🏆 **Gamifikasi / Badge**           | Dapat badge baru               | User terkait                            |

---

## ⚙️ **2️⃣ Jenis Notifikasi Real-Time**

| Jenis                      | Contoh Pesan                                             | Dikirim ke          |
| -------------------------- | -------------------------------------------------------- | ------------------- |
| 💌 **Pesan Chat Baru**     | “Mentor Dinda mengirim pesan baru.”                      | Penerima chat       |
| 💭 **Balasan Komentar**    | “Riko menanggapi komentarmu di grup ‘Ekspor Jepang’.”    | Pemilik komentar    |
| 📢 **Postingan Grup Baru** | “Dinda membuat postingan baru di grup ‘UKM Ekspor’.”     | Semua anggota grup  |
| 🎓 **Diskusi Kelas Baru**  | “Rahmat menulis komentar di Modul 3.”                    | Semua peserta kelas |
| 🧾 **Transaksi Sukses**    | “Pembayaranmu berhasil, membership aktif.”               | User pembeli        |
| 🎯 **Event Reminder**      | “Webinar dimulai dalam 30 menit.”                        | Peserta event       |
| 🧍‍♂️ **Follower Baru**    | “Rara mulai mengikuti kamu.”                             | User yang diikuti   |
| 🏅 **Achievement Baru**    | “Selamat! Kamu mendapat badge ‘Aktif Diskusi Mingguan’.” | User peraih         |

---

## 💡 **3️⃣ Alur Real-Time Notifikasi**

1. **Trigger** terjadi (post, chat, komentar, event baru).
2. Backend kirim ke WebSocket Server (Pusher/Socket.io).
3. User aktif → langsung muncul di navbar notifikasi.
4. User tidak aktif → dikirim ke OneSignal (push).
5. Pesan penting → dikirim ke Mailketing (email backup).

Contoh teknis backend:

```ts
emitNotification({
  type: 'COMMENT',
  message: 'Riko menanggapi komentarmu di kelas “Ekspor Jepang”',
  channel: ['pusher', 'onesignal'],
  targetUsers: [commentOwner, mentor, allParticipants],
});
```

---

## 🔔 **4️⃣ Integrasi Sistem Notifikasi Global**

| Channel                            | Teknologi             | Fungsi                                |
| ---------------------------------- | --------------------- | ------------------------------------- |
| **WebSocket (Pusher / Socket.io)** | Instant delivery      | Real-time UI update (tanpa reload)    |
| **OneSignal**                      | Mobile & browser push | User offline tetap dapat notif        |
| **Mailketing**                     | Email alert           | Notifikasi penting & pengingat        |
| **Starsender / Puzzle**            | WA reminder           | Optional (event atau webinar penting) |

---

## 🧱 **5️⃣ Struktur Database**

**Table: notifications**

```
id
user_id
type (CHAT, COMMENT, POST, EVENT, SYSTEM)
title
message
redirect_url
source_id (post_id, event_id, etc.)
status (sent, read, archived)
channel (pusher, onesignal, email)
created_at
```

**Table: notification_subscriptions**

```
user_id | group_id | class_id | event_id | subscribed (true/false)
```

> Setiap kali user join kelas/grup/event → otomatis `subscribed = true`.
> Jadi dia akan selalu dapat notifikasi dari interaksi di sana.

---

## 🧑‍🏫 **6️⃣ Fitur Khusus untuk Mentor**

| Fitur                         | Deskripsi                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| **Mentor Broadcast to Class** | Kirim pesan/pengumuman → semua murid dapat notif real-time. |
| **Auto Reminder**             | “Kamu belum belajar minggu ini.” (dikirim via Mailketing).  |
| **Discussion Watcher**        | Mentor dapat notifikasi jika ada komentar baru di modulnya. |
| **Feedback Alert**            | Notif otomatis jika murid beri rating modul.                |

---

## 🧑‍🎓 **7️⃣ Fitur Khusus untuk User / Member**

| Fitur                           | Deskripsi                                                              |
| ------------------------------- | ---------------------------------------------------------------------- |
| **Notif Langsung di Dashboard** | Bell icon muncul jumlah notif belum dibaca.                            |
| **Realtime Toast Message**      | Popup “Ada komentar baru di kelasmu!”                                  |
| **Center Notification Page**    | Riwayat semua notifikasi (read/unread).                                |
| **Filter**                      | Berdasarkan jenis: Chat, Kelas, Grup, Event, Sistem.                   |
| **Quick Access**                | Klik notif → langsung redirect ke halaman sumber (kelas, grup, event). |

---

## 🔒 **8️⃣ Logika Akses Notifikasi**

| User Role        | Notifikasi yang Didapat               |
| ---------------- | ------------------------------------- |
| **Free User**    | Notif umum (promo, posting publik)    |
| **Member Aktif** | Semua notif dari grup, kelas, chat    |
| **Mentor**       | Notif dari murid, kelas, dan admin    |
| **Admin**        | Semua notif sistem + laporan (report) |

---

## 🧭 **9️⃣ UI/UX Flow**

* 🔔 Bell Icon di header navbar (indikator jumlah notif belum dibaca)
* 🪄 Klik → muncul dropdown daftar notif dengan ikon (chat, kelas, grup)
* 🕓 Notif baru muncul instant (tanpa reload)
* 📩 Klik “Lihat Semua” → menuju halaman `/notifications`
* 🔘 Tombol “Tandai sudah dibaca”
* 📱 Push notif otomatis tersinkron dengan OneSignal

---

## 🧠 **10️⃣ Smart Rule & Engagement Automation**

| Trigger                        | Action                                              |
| ------------------------------ | --------------------------------------------------- |
| Murid belum buka kelas 3 hari  | Kirim notifikasi pengingat                          |
| Komentar di kelas > 10         | Kirim badge “Diskusi Aktif”                         |
| Mentor posting update          | Semua murid di kelas itu dapat notif                |
| Grup posting baru              | Semua anggota grup dapat notif                      |
| Event mendekat                 | Reminder otomatis dikirim (24 jam, 1 jam, 15 menit) |
| Postingan Viral (>20 komentar) | Admin dapat alert “Konten populer”                  |

---

## ⚙️ **11️⃣ Teknologi Utama**

| Komponen                         | Fungsi                        |
| -------------------------------- | ----------------------------- |
| **NestJS EventEmitter + Prisma** | Backend trigger sistem notif  |
| **Pusher / Socket.io**           | Real-time message & broadcast |
| **OneSignal**                    | Push browser & mobile         |
| **Mailketing API**               | Email penting & pengingat     |
| **Redis Queue**                  | Antrian notifikasi massal     |
| **Supabase Storage**             | Lampiran file notifikasi      |

---

## 🧾 **12️⃣ Ringkasan Fitur Utama**

✅ Chat real-time (mentor–member & grup)
✅ Notifikasi real-time (chat, posting, komentar, kelas, event)
✅ Push notifikasi via OneSignal
✅ Email notifikasi via Mailketing
✅ Popup CTA “Upgrade ke membership” bagi user free
✅ Dashboard notifikasi global
✅ Trigger pengingat otomatis (kelas belum diakses, event mendekat)

---

Kalimat sistem:

> “💡 Ada 3 komentar baru di kelas ‘Strategi Ekspor Jepang’ — yuk ikut diskusi sekarang!”

---

PRD Fitur Data Buyer v.1

* Admin bisa kelola & analisis data lengkap,
* Sementara user hanya bisa *melihat, menyaring, dan menyimpan favorit* tanpa bisa menyalin / ekspor data (karena data buyer sensitif).

Berikut hasil revisi dan perbedaannya 👇

---

## ⚙️ **🔹 Struktur Umum Database Buyer**

Sama seperti sebelumnya (`buyers`), tetapi kini akses dibagi dua:

* `admin_view`
* `member_view`

---

## 🧑‍💼 **1️⃣ FITUR ADMIN PANEL**

Admin memiliki akses penuh ke semua fungsi pengelolaan data buyer.

### ✳️ **Fitur Utama Admin**

| Fitur                              | Deskripsi                                                        |
| ---------------------------------- | ---------------------------------------------------------------- |
| 📤 **Import / Export Data**        | Bisa impor file Excel/CSV dan ekspor hasil pencarian ke Excel    |
| ✏️ **Tambah & Edit Buyer**         | Input manual data buyer atau ubah detailnya                      |
| 🕓 **Tanggal Otomatis**            | Setiap data upload otomatis menambahkan `date_added`             |
| 🇮🇩 **Auto Bendera Negara**       | Bendera muncul otomatis berdasarkan field `country`              |
| 📊 **Statistik Buyer**             | Lihat daftar buyer populer (berdasarkan view & like user)        |
| 👁️ **View Tracker (Per User)**    | Admin bisa lihat siapa yang melihat buyer mana, dan berapa kali  |
| ❤️ **Like Tracker**                | Admin bisa lihat buyer mana yang paling disukai oleh member      |
| 📈 **Dashboard Analitik Buyer**    | Grafik view/like/filter per negara & produk                      |
| 🧩 **Data Security & Role Access** | Admin bisa atur role apa saja yang bisa mengakses database buyer |

---

## 👥 **2️⃣ FITUR USER / MEMBER**

Member hanya bisa **melihat data**, **mencari buyer**, dan **memberi like**,
tanpa bisa melakukan ekspor data, edit, atau menyalin informasi kontak massal.

### 🧭 **Fitur Utama Member**

| Fitur                                      | Deskripsi                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 🔍 **Pencarian Buyer**                     | Bisa cari berdasarkan produk, negara, dan kata kunci                                               |
| 🧭 **Filter Data**                         | Negara (dropdown bendera), produk, payment term, dan shipping term                                 |
| 📅 **Tanggal Upload Otomatis Ditampilkan** | Menunjukkan kapan buyer terakhir diperbarui                                                        |
| 👁️ **View Counter (User)**                | Sistem otomatis mencatat ketika user membuka detail buyer, tapi tidak bisa melihat view orang lain |
| ❤️ **Like Buyer / Simpan Favorit**         | Bisa klik “❤️” untuk menyimpan buyer ke daftar favorit pribadi                                     |
| ⭐ **Daftar Buyer Favorit**                 | Halaman khusus menampilkan buyer yang disukai                                                      |
| 🚫 **Tanpa Export / Copy Massal**          | Tidak bisa menyalin data atau ekspor file Excel                                                    |
| 🔒 **Kontak Buyer Diblur (Opsional)**      | Untuk user non-premium, detail kontak (email/telepon) bisa disembunyikan sebagian                  |
| 🔔 **Notifikasi Buyer Baru**               | “Ada 12 buyer baru di kategori produk kamu minggu ini”                                             |
| 💬 **Laporkan Buyer**                      | Jika ada data buyer tidak valid, user bisa lapor ke admin                                          |

---

## 🔍 **3️⃣ PERBEDAAN FITUR ADMIN VS USER**

| Fitur               | Admin                      | Member                                     |
| ------------------- | -------------------------- | ------------------------------------------ |
| Import/Export Excel | ✅                          | ❌                                          |
| Tambah/Edit Buyer   | ✅                          | ❌                                          |
| Hapus Data          | ✅                          | ❌                                          |
| Auto Date Upload    | ✅                          | ✅ (lihat saja)                             |
| Auto Flag Negara    | ✅                          | ✅                                          |
| View Counter        | ✅ (lihat semua)            | ✅ (hanya view pribadi)                     |
| Like Buyer          | ✅ (lihat statistik global) | ✅ (like buyer sendiri)                     |
| Export Hasil Filter | ✅                          | ❌                                          |
| Filter / Pencarian  | ✅                          | ✅                                          |
| Statistik Buyer     | ✅                          | ❌                                          |
| Buyer Favorit       | ❌                          | ✅                                          |
| Kontak Buyer        | ✅ (lihat penuh)            | ⚙️ (lihat sebagian / full tergantung role) |

---

## 🔐 **4️⃣ Role Access di Sistem Membership**

| Role                  | Akses ke Database Buyer                                     |
| --------------------- | ----------------------------------------------------------- |
| **Non-Member (Free)** | ❌ Tidak bisa akses database buyer                           |
| **Member Basic**      | 🔍 Bisa cari & lihat buyer terbatas (max 10 buyer / minggu) |
| **Member Premium**    | 👁️ Akses semua buyer + lihat kontak lengkap                |
| **Mentor / Admin**    | 🧾 Full access (lihat semua, ekspor, edit, delete)          |

---

## 📊 **5️⃣ Contoh UI Member**

| 🇯🇵 | Buyer             | Produk       | Negara     | View  | Like | Tanggal     |
| ---- | ----------------- | ------------ | ---------- | ----- | ---- | ----------- |
| 🇯🇵 | Esaki Corp        | Garments     | Japan      | 👁️ 3 | ❤️ 1 | 27 Nov 2025 |
| 🇧🇩 | AllChem           | Cocoa Powder | Bangladesh | 👁️ 1 | ❤️ 0 | 26 Nov 2025 |
| 🇦🇺 | Tender Coconut Co | Coconut      | Australia  | 👁️ 2 | ❤️ 2 | 25 Nov 2025 |

* Klik baris → popup detail (terbatas untuk member)
* Tombol “❤️ Simpan Buyer” untuk masuk ke daftar favorit
* Tombol “Hubungi Buyer” hanya muncul jika membership premium

---

## 📈 **6️⃣ Statistik di Dashboard Admin**

| Statistik                | Fungsi                            |
| ------------------------ | --------------------------------- |
| 📅 Buyer Baru per Minggu | Mengetahui data buyer terbaru     |
| 👁️ Buyer Terpopuler     | Berdasarkan view user terbanyak   |
| ❤️ Buyer Terfavorit      | Berdasarkan like terbanyak        |
| 🌎 Buyer per Negara      | Pie chart jumlah buyer per negara |
| 📦 Buyer per Produk      | Analitik permintaan produk global |

---

## 🧠 **7️⃣ Rekomendasi Teknis**

| Fitur                  | Implementasi                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| **View Counter**       | Disimpan di tabel `buyer_views (buyer_id, user_id, viewed_at)`      |
| **Like Counter**       | Disimpan di tabel `buyer_likes (buyer_id, user_id)`                 |
| **Tanggal Otomatis**   | Gunakan `CURRENT_TIMESTAMP` saat insert                             |
| **Flag Negara**        | Gunakan library `country-flag-icons` (React)                        |
| **Kontak Buyer Blur**  | Logika conditional render: blur email/phone untuk non-premium       |
| **Import/Export File** | Gunakan library `SheetJS (xlsx)`                                    |
| **Role Access**        | Middleware role di backend (misal Laravel: `Gate::allows('admin')`) |

---

## 📅 **8️⃣ Roadmap Versi**

| Versi    | Fitur                                          |
| -------- | ---------------------------------------------- |
| **v1.5** | Auto tanggal upload, view counter, like system |
| **v1.6** | Role-based access (Admin vs User)              |
| **v1.7** | Statistik view & like global                   |
| **v1.8** | Buyer favorite & notifikasi buyer baru         |
| **v1.9** | AI Buyer Recommendation                        |

---

## 🎯 **Kesimpulan**

✅ Admin → full control & ekspor data
✅ Member → hanya view, like, dan simpan buyer favorit
✅ View dan Like dipisah (admin melihat global, member hanya melihat miliknya)
✅ Membership menentukan kedalaman akses data (kontak, ekspor, limit)

---
🧩 Siap! Berikut versi lengkap **PRD v1 – Supplier System (Full Feature Overview)**
Semua fitur dan alur sudah disusun secara utuh — termasuk Free, Premium, kontrol admin, integrasi, dan monetisasi.

---

# 🧱 **PRD v1 – Supplier System (Produk, Katalog, dan Komunikasi Bisnis)**

## 🎯 **Tujuan Utama**

Fitur *Supplier System* berfungsi sebagai wadah untuk:

1. Mempromosikan perusahaan dan produk ke komunitas ekspor.
2. Memfasilitasi interaksi bisnis antara **supplier** dan **member (buyer/mentor)** secara aman dan terkontrol.
3. Menjadi *database supplier terverifikasi* yang dapat dilihat dan diurutkan berdasarkan kategori, negara, dan legalitas.
4. Menjadi sumber monetisasi tambahan melalui paket **Free dan Premium**, serta *add-on* (AI tools, domain, katalog, dll).

---

## 🧭 **1️⃣ Struktur Role & Akses**

| Role                        | Akses Fitur          | Deskripsi                                                                        |
| --------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| **Admin**                   | Full Control         | Kelola supplier, fitur, paket, verifikasi, data legalitas, chat, dan reminder    |
| **Supplier Free**           | Basic Access         | Hanya bisa upload 1 produk, tidak bisa menerima chat                             |
| **Supplier Premium**        | Full Supplier Access | Upload produk tanpa batas, bisa chat, punya bio, bisa tampil di direktori publik |
| **Member / Buyer / Mentor** | Limited Interaction  | Bisa melihat profil supplier, produk, dan menghubungi supplier premium           |

---

## 🧩 **2️⃣ Modul Utama Supplier**

1. **Profil Supplier (Company Profile)**
2. **Manajemen Produk / Katalog**
3. **Sistem Chat Terkontrol**
4. **Dashboard Statistik & Insight**
5. **Paket Free vs Premium (Feature Restriction)**
6. **Automated Reminder Upgrade**
7. **Integrasi Add-on (AI, Mailketing, WA, Push)**
8. **Admin Control Panel**

---

## 🏢 **3️⃣ Profil Supplier (Company Profile)**

### Fitur Utama:

| Fitur                        | Free        | Premium                                      | Keterangan                                                 |
| ---------------------------- | ----------- | -------------------------------------------- | ---------------------------------------------------------- |
| Nama Perusahaan              | ✅           | ✅                                            | Wajib diisi                                                |
| Logo / Banner                | ✅           | ✅                                            | Upload 1 logo, 1 banner                                    |
| Deskripsi Perusahaan         | ✅           | ✅                                            | Maksimal 2000 karakter                                     |
| Bidang Usaha / Kategori      | ✅           | ✅                                            | Pilih dari dropdown                                        |
| Alamat & Negara              | ✅           | ✅                                            | Otomatis tampil bendera negara                             |
| Legalitas (NIB, SIUP, dsb)   | Upload Only | ✅ Verified & tampil publik                   | Diverifikasi admin                                         |
| Badge Verified               | ❌           | ✅                                            | Otomatis setelah verifikasi                                |
| Custom URL Profil            | ❌           | ✅ (contoh: eksporyuk.com/supplier/abcglobal) | SEO friendly                                               |
| Bio Page (Company Microsite) | ❌           | ✅                                            | Mini-landing page dengan link produk, social media, banner |
| Social Media & Website       | ✅           | ✅                                            | Input link FB, IG, Website                                 |

---

## 📦 **4️⃣ Manajemen Produk & Katalog**

| Fitur                | Free           | Premium       | Keterangan                   |
| -------------------- | -------------- | ------------- | ---------------------------- |
| Upload Produk        | Maks. 1 produk | Unlimited     | Admin bisa ubah batas        |
| Judul Produk         | ✅              | ✅             | Maks. 100 karakter           |
| Deskripsi Produk     | ✅              | ✅             | Editor teks HTML             |
| Upload Gambar        | Maks. 3 gambar | Unlimited     | Kompres otomatis             |
| Upload Dokumen       | ❌              | ✅             | PDF/DOC katalog              |
| Kategori Produk      | ✅              | ✅             | Bisa multi-kategori          |
| Multi Bahasa         | ❌              | ✅             | Auto translate EN/ID         |
| Link Ke Grup / Kelas | ❌              | ✅             | Bisa hubungkan ke event/grup |
| Like & View Counter  | ✅              | ✅             | Meningkatkan engagement      |
| Export Data Produk   | ❌              | Admin Only    | Untuk backup                 |
| Status Publish       | Draft / Aktif  | Draft / Aktif | Diset oleh supplier          |

---

## 💬 **5️⃣ Chat & Komunikasi (Controlled System)**

Chat diatur agar hanya terjalin antara pihak yang saling terhubung.

| Fitur                   | Free | Premium | Keterangan                   |
| ----------------------- | ---- | ------- | ---------------------------- |
| Terima Chat dari Member | ❌    | ✅       | Bisa balas chat yang masuk   |
| Kirim Chat ke User Baru | ❌    | ❌       | Tidak diizinkan              |
| Upload File / Katalog   | ❌    | ✅       | Format JPG, PDF              |
| Real-time Notification  | ❌    | ✅       | Integrasi OneSignal/Pusher   |
| Chat History            | ❌    | ✅       | Tersimpan otomatis           |
| Auto Reply              | ❌    | ✅       | Template pesan singkat       |
| Statistik Chat          | ❌    | ✅       | Total chat & response rate   |
| Moderasi Chat (Admin)   | ❌    | ✅       | Admin bisa pantau semua chat |

> “Unlimited chat” berarti **bisa membalas chat tanpa batas**, bukan bebas kirim chat ke semua user.

---

## 📈 **6️⃣ Statistik & Insight**

| Fitur              | Free | Premium | Keterangan                             |
| ------------------ | ---- | ------- | -------------------------------------- |
| Jumlah View Profil | ✅    | ✅       | Tersimpan otomatis                     |
| Jumlah Like Produk | ✅    | ✅       | Menunjukkan engagement                 |
| Detail Statistik   | ❌    | ✅       | Filter harian, mingguan, bulanan       |
| Chat Statistic     | ❌    | ✅       | Persentase balasan & waktu tanggapan   |
| Ranking Supplier   | ❌    | ✅       | Berdasarkan interaksi & view tertinggi |

---

## 💡 **7️⃣ Paket Free vs Premium — Pengaturan Admin**

Admin dapat mengatur semua fitur berikut via dashboard:

### a. Kuota & Limitasi:

* Jumlah produk maksimal
* Jumlah gambar per produk
* Durasi masa aktif free/premium
* Jumlah upload file katalog
* Limit chat aktif per minggu
* Frekuensi reminder upgrade

### b. Notifikasi & Reminder:

* Kirim otomatis (Mailketing, OneSignal, WA)
* Atur waktu (1 hari, 7 hari, 14 hari, 30 hari)
* Auto-promo (kupon diskon setelah reminder ke-3)
* Trial Premium (opsional 7 hari)

### c. Custom Fitur:

* Admin bisa aktifkan/matikan fitur tertentu (contoh: AI Product Description)
* Admin bisa tambahkan Add-on seperti Custom Domain atau Statistik Ekstra

---

## 🔔 **8️⃣ Reminder Upgrade System (Free → Premium)**

### Trigger Reminder:

1. Setelah registrasi
2. Setelah upload produk pertama
3. Setelah dapat view tapi tidak bisa balas chat
4. Setelah 7 hari belum upgrade
5. Setelah 14 & 30 hari

### Channel Reminder:

* **Email (Mailketing)**: Template promosi fitur Premium
* **WhatsApp (Starsender)**: Reminder singkat & CTA upgrade
* **Push Notification (OneSignal)**: Popup “Aktifkan fitur Premium”

### Tampilan Free Supplier:

* Fitur Premium muncul dalam kondisi *blurred/locked*
* Tiap tombol akan muncul CTA:

  > “Buka fitur ini dengan Premium Supplier”

---

## 🧠 **9️⃣ Integrasi Sistem**

| Integrasi              | Fungsi                                    | Catatan                          |
| ---------------------- | ----------------------------------------- | -------------------------------- |
| **Mailketing API**     | Kirim reminder, verifikasi, dan promosi   | Gunakan kredit otomatis          |
| **Starsender (WA)**    | Reminder chat dan notifikasi transaksi    | Dapat dikontrol admin            |
| **OneSignal / Pusher** | Real-time chat dan notifikasi             | Untuk web & mobile apps          |
| **Xendit**             | Pembayaran paket Premium                  | Otomatis aktivasi setelah sukses |
| **AI (Gemini/Claude)** | Generate deskripsi produk otomatis (poin) | Sistem poin terpisah             |
| **Storage (AWS/GCP)**  | Menyimpan dokumen supplier & produk       | Dikelola server-side             |

---

## 🪙 **10️⃣ Sistem Monetisasi**

| Fitur                  | Model        | Keterangan                                   |
| ---------------------- | ------------ | -------------------------------------------- |
| Paket Premium Supplier | Subscription | Bulanan / Tahunan                            |
| Add-on Domain          | One-time     | Custom domain (supplierku.eksporyuk.com)     |
| AI Product Description | Poin         | 1 deskripsi = 1 poin                         |
| Reminder Auto-Promo    | Kupon        | Diskon otomatis dari admin                   |
| Komisi Affiliate       | Referral     | Affiliate dapat komisi dari upgrade supplier |

---

## 🔐 **11️⃣ Keamanan & Moderasi**

* Semua upload difilter anti-spam (gambar & teks).
* Admin memiliki akses penuh untuk suspend supplier.
* Legalitas diverifikasi manual sebelum status *Verified*.
* Log aktivitas tercatat di database (upload, edit, chat, view).
* Chat dilindungi dengan audit log (tanggal, pengirim, penerima, IP).

---

## 🧭 **12️⃣ Alur Utama Sistem**

1. Supplier mendaftar → otomatis akun Free.
2. Upload produk pertama → sistem kirim reminder upgrade.
3. Member melihat produk → klik “Hubungi Supplier”.
4. Jika supplier Premium → chat aktif, jika Free → muncul CTA upgrade.
5. Admin memverifikasi supplier dan legalitas.
6. Supplier upgrade → fitur Premium aktif otomatis.
7. Sistem mencatat semua transaksi dan notifikasi.

---

## 🖥️ **13️⃣ Tampilan Dashboard (Ringkasan per Role)**

### Supplier Dashboard

* Statistik produk & view
* Notifikasi upgrade
* Panel chat & file katalog
* Reminder aktifitas

### Admin Dashboard

* Kelola supplier & paket
* Log reminder & aktivitas
* Statistik konversi
* Approval legalitas
* Manajemen konten katalog

### Member View

* Lihat produk & supplier verified
* Kirim chat ke supplier premium
* Filter berdasarkan negara, kategori, dan legalitas

---

## 🚀 **14️⃣ Tujuan Akhir Sistem Supplier**

✅ Meningkatkan kredibilitas komunitas dengan supplier terverifikasi
✅ Membuka peluang kolaborasi ekspor
✅ Memberikan sumber pemasukan baru dari Premium Package
✅ Membangun database supplier global terstruktur

---

Oke 💪 — berikut ini adalah **dokumen PRD v.1: Modul Dokumen Membership + Sistem Log Aktivitas Download (Verifikasi User)**
Ini versi **fundamental dan siap dikembangkan di backend maupun frontend** oleh tim dev (misal via Cursor AI).

---

# 📘 **Product Requirement Document (PRD v1) — Modul Dokumen Membership & Log Aktivitas Download**

## 🧭 **1. Tujuan Utama**

Membangun sistem manajemen dokumen **eksklusif untuk member aktif**, lengkap dengan:

* Hak akses berdasarkan level membership,
* Pencatatan download user secara real-time,
* Validasi aktivitas (siapa download, kapan, dari mana),
* Dashboard admin untuk pengawasan & verifikasi klaim user.

---

## ⚙️ **2. Fitur Utama**

### 📂 **2.1. Modul Dokumen Membership**

| Fitur                   | Deskripsi                                                                 |
| ----------------------- | ------------------------------------------------------------------------- |
| Upload Dokumen          | Admin dapat menambahkan file PDF, DOCX, XLSX, ZIP, dsb.                   |
| Judul & Deskripsi       | Form input untuk memberikan nama & deskripsi singkat dokumen.             |
| Kategori Dokumen        | Misal: Panduan, Template, Buyer Data, Legalitas, dll.                     |
| Level Membership        | Admin pilih level minimum untuk akses (Silver, Gold, Platinum, Lifetime). |
| Tanggal Upload Otomatis | Sistem otomatis menambahkan tanggal unggah.                               |
| Status Dokumen          | Aktif / Nonaktif (dokumen nonaktif tidak muncul di publik).               |
| Statistik Dokumen       | Menampilkan total view & download.                                        |
| Filter & Pencarian      | Filter berdasarkan kategori, tanggal, level membership.                   |
| Edit / Hapus Dokumen    | Admin dapat memperbarui atau menghapus dokumen.                           |

---

### 🧑‍💻 **2.2. Akses Dokumen untuk User**

| Fitur               | Deskripsi                                                                         |
| ------------------- | --------------------------------------------------------------------------------- |
| Validasi Membership | Sistem cek apakah user memiliki membership aktif.                                 |
| Level Restriction   | Hanya dokumen sesuai level membership yang muncul.                                |
| Download File       | User bisa langsung unduh dokumen yang diizinkan.                                  |
| View Counter        | Menambah jumlah “dilihat” setiap kali dokumen dibuka.                             |
| Download Counter    | Menambah jumlah “didownload” setiap kali file diunduh.                            |
| Histori Akses       | User bisa melihat daftar dokumen yang pernah diakses.                             |
| Reminder            | Jika membership habis → muncul notifikasi “Gabung ulang untuk mengakses dokumen”. |

---

### 🧱 **2.3. Sistem Log Aktivitas Download (Verifikasi User)**

| Fitur                | Deskripsi                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Auto-Log             | Setiap kali user menekan tombol download, sistem mencatat aktivitas ke database.                                 |
| Data yang Dicatat    | ID user, ID dokumen, level membership, tanggal & jam download, IP address, device info, status (success/failed). |
| Admin Log View       | Admin bisa lihat siapa yang download, file apa, kapan, dari mana.                                                |
| Export Log           | Data log bisa di-export ke Excel / CSV.                                                                          |
| Detail Log           | Klik “Detail” untuk lihat semua data aktivitas user.                                                             |
| Manual Verification  | Admin bisa centang “verified” jika user melakukan konfirmasi manual (via WA/email).                              |
| Duplicate Prevention | Jika user download file sama berulang kali, tetap tercatat tapi tidak menggandakan hitungan download global.     |

---

## 🧰 **3. Struktur Database (Sederhana)**

### 🗃️ **Table: `documents`**

| Field       | Type         | Description              |
| ----------- | ------------ | ------------------------ |
| id          | bigint       | ID unik                  |
| title       | varchar(255) | Judul dokumen            |
| description | text         | Deskripsi dokumen        |
| category    | varchar(100) | Kategori dokumen         |
| file_url    | text         | Lokasi file              |
| visibility  | varchar(50)  | Minimal level membership |
| uploader_id | bigint       | ID admin                 |
| upload_date | datetime     | Tanggal upload otomatis  |
| views       | int          | Total view               |
| downloads   | int          | Total download           |
| active      | boolean      | Status aktif/tidak       |

---

### 🗃️ **Table: `document_download_logs`**

| Field            | Type                           | Description                          |
| ---------------- | ------------------------------ | ------------------------------------ |
| id               | bigint                         | ID unik log                          |
| user_id          | bigint                         | ID user                              |
| document_id      | bigint                         | ID dokumen                           |
| membership_level | varchar(50)                    | Level membership aktif saat download |
| download_date    | datetime                       | Waktu download                       |
| ip_address       | varchar(50)                    | Alamat IP user                       |
| device_info      | varchar(255)                   | Browser/device                       |
| status           | enum(success, failed, pending) | Status download                      |
| admin_verified   | boolean                        | Centang verifikasi manual            |
| notes            | text                           | Catatan (opsional)                   |

---

## 🖥️ **4. Tampilan UI/UX (Deskripsi Konseptual)**

### 🧑‍💼 **Halaman Admin — Manajemen Dokumen**

* Menu: “Dokumen Membership”
* Tombol: ➕ Tambah Dokumen, ✏️ Edit, ❌ Hapus, 📤 Export Log
* Kolom tabel:

  * Judul
  * Kategori
  * Level Akses
  * Upload Date
  * View
  * Download
  * Status
* Sidebar Filter: berdasarkan level membership, tanggal, kategori

---

### 👤 **Halaman User — Dokumen Saya**

* Menampilkan list dokumen sesuai membership user.
* Tombol download aktif hanya untuk dokumen yang sesuai level membership.
* Kolom informasi:

  * Judul dokumen
  * Deskripsi singkat
  * Tanggal upload
  * Total dilihat & didownload
* Jika level tidak cukup:
  🔒 “Dokumen ini hanya untuk Platinum ke atas.”

---

### 🧾 **Halaman Admin — Log Aktivitas**

* Kolom tabel:

  * Nama User
  * Dokumen
  * Membership
  * Tanggal Download
  * IP & Device
  * Status
  * Aksi (Detail / Verifikasi)
* Export → Excel / CSV

---

## 🔔 **5. Notifikasi Otomatis**

### 📧 **Via Mailketing**

* “Dokumen baru telah ditambahkan untuk member Platinum.”
* “Kamu belum akses dokumen terbaru minggu ini.”

### 📱 **Via OneSignal / Pusher**

* Real-time push ketika ada dokumen baru.
* “📘 Dokumen baru ditambahkan: Panduan Ekspor ke Timur Tengah.”

---

## 🔒 **6. Keamanan File**

* Token unik per download (link expire otomatis).
* Watermark otomatis: nama user + email di footer PDF.
* Limit akses berdasarkan session login (tidak bisa share link ke orang lain).
* Validasi server-side (bukan client-side) untuk mencegah bypass.

---

## 🧩 **7. Integrasi Sistem**

| Sistem             | Fungsi                           |
| ------------------ | -------------------------------- |
| Membership         | Validasi user & level membership |
| Mailketing         | Kirim notifikasi email           |
| OneSignal / Pusher | Push notifikasi dokumen baru     |
| Starsender         | Notifikasi WhatsApp              |
| Storage (S3/Cloud) | Simpan file dokumen              |
| Log Manager        | Catat aktivitas download         |

---

## 📈 **8. KPI & Sukses Implementasi**

✅ Semua dokumen hanya bisa diakses user aktif
✅ Admin dapat melihat log download lengkap
✅ Tidak ada user non-member yang bisa akses file
✅ Email & push notif berjalan otomatis
✅ Sistem audit bisa ekspor data kapan saja

-


# 🧾 **Product Requirement Document (PRD) — Banner & Iklan v.1**

## 📌 **1. Tujuan Fitur**

Fitur ini dirancang untuk:

1. Menampilkan **banner pengumuman dan iklan dinamis** di berbagai halaman komunitas.
2. Memberikan ruang promosi untuk **event, produk, membership, atau afiliasi**.
3. Menjadi **alat monetisasi internal** (misalnya banner sponsor atau upgrade premium).
4. Mengirimkan **notifikasi otomatis** saat ada promo/pengumuman penting.

---

## 🧩 **2. Lokasi Penayangan Banner**

| Lokasi                        | Format                              | Deskripsi                                           | Interaksi                            |
| ----------------------------- | ----------------------------------- | --------------------------------------------------- | ------------------------------------ |
| **Dashboard Member**          | Carousel utama                      | Menampilkan promo, pengumuman, atau banner sponsor. | Klik → redirect ke link/banner modal |
| **Feed Komunitas**            | Inline banner (di antara postingan) | Muncul setelah setiap 4–5 postingan.                | Klik → buka halaman promo            |
| **Grup Komunitas**            | Banner horizontal di atas feed grup | Digunakan untuk event, webinar, atau kursus grup.   | Klik → detail event                  |
| **Profil Member / Affiliate** | Card kecil di bawah bio             | Promosi personal atau produk affiliate.             | Klik → ke produk terkait             |
| **Halaman Produk / Event**    | CTA banner                          | Ajakan ke kelas atau membership.                    | Klik → redirect ke checkout          |

---

## ⚙️ **3. Fitur Utama**

### 👑 **Untuk Admin**

* **CRUD Banner:** Tambah, edit, hapus banner.
* **Input Data Banner:**

  * Judul, deskripsi singkat.
  * Gambar atau video banner.
  * CTA Button text (contoh: *“Gabung Sekarang”*).
  * Link tujuan (internal atau eksternal).
  * Target Role → (Admin / Member / Affiliate / Mentor / Guest).
  * Target Lokasi Banner → (Dashboard, Feed, Grup, Profil).
  * Waktu aktif (start–end date).
  * Mode tampilan: `Static / Carousel / Popup / Mini Floating`.
* **Banner Scheduling:**

  * Pilih jam aktif (misal 07:00–22:00).
  * Limit tampil per user (misal 1x/hari).
  * Urutan prioritas (priority 1–5).
* **Statistik Banner:**

  * Total view.
  * Total klik.
  * CTR (Click Through Rate).
  * Filter waktu (hari, minggu, bulan).
  * Export laporan (Excel/CSV).

---

### 👤 **Untuk User (Member, Mentor, Affiliate)**

* Melihat banner sesuai peran & paket membership.
* Klik banner akan membuka:

  * Halaman internal (produk, event, kelas).
  * Link eksternal (misal website partner/sponsor).
* Banner dapat di-dismiss manual.
* Mode carousel otomatis bergulir setiap 5 detik.
* Banner yang sudah dilihat tidak akan muncul lagi sampai periode refresh (contoh: 1x/hari).

---

## 🧠 **4. Fitur Tambahan (Smart Features)**

### 🎯 **Smart Targeting**

* Banner muncul berdasarkan:

  * Role user.
  * Aktivitas terakhir (misal belum upgrade membership).
  * Lokasi (negara).
  * Kategori minat (kelas, event, produk yang sering dikunjungi).

> Contoh: User belum membeli membership → tampil banner “Upgrade Premium Sekarang”.

---

### 🎨 **Dynamic Design Options**

* **Static Banner:** Gambar biasa dengan CTA.
* **Carousel Banner:** Beberapa banner bergulir otomatis.
* **Popup Banner:** Muncul 1x ketika login pertama hari itu.
* **Floating Banner:** Kecil di pojok kanan bawah.
* **Text Banner Mode:** Untuk pengumuman singkat tanpa gambar (lebih ringan).

---

### 🔔 **Integrasi Notifikasi & Analitik**

* **Notifikasi:**

  * Banner penting (maintenance, event) bisa auto muncul di notifikasi OneSignal/Pusher.
  * Notifikasi email juga bisa aktif via Mailketing (optional).
* **Analytics Dashboard:**

  * Data view dan klik tersimpan otomatis di tabel `banner_views` dan `banner_clicks`.
  * Bisa ditampilkan dalam grafik (harian/mingguan).

---

## 💰 **5. Monetisasi Banner**

| Jenis Banner     | Siapa yang Buat   | Tujuan                            | Potensi Keuntungan                         |
| ---------------- | ----------------- | --------------------------------- | ------------------------------------------ |
| Banner Internal  | Admin             | Promosi produk internal / event   | Engagement & upgrade membership            |
| Banner Affiliate | Affiliate         | Promosi link / bio mereka         | Konversi & komisi                          |
| Banner Sponsor   | Partner eksternal | Iklan produk ekspor / marketplace | Pendapatan langsung (CPC / CPM / flat fee) |

---

## 🧩 **6. Database Struktur (Ringkas)**

### 🗂️ **Tabel `banners`**

| Field       | Type               | Keterangan                    |
| ----------- | ------------------ | ----------------------------- |
| id          | INT                | ID unik banner                |
| title       | VARCHAR            | Judul banner                  |
| description | TEXT               | Deskripsi singkat             |
| image_url   | VARCHAR            | Link gambar/banner            |
| video_url   | VARCHAR (optional) | Jika format video             |
| link_url    | VARCHAR            | Tujuan klik banner            |
| target_role | JSON               | Role yang bisa lihat          |
| placement   | ENUM               | dashboard, feed, grup, profil |
| start_date  | DATETIME           | Waktu mulai tampil            |
| end_date    | DATETIME           | Waktu berakhir                |
| view_limit  | INT                | Maksimum tayang per user      |
| priority    | INT                | Urutan tampil                 |
| created_by  | INT                | ID admin pembuat              |
| created_at  | DATETIME           | Waktu pembuatan               |
| updated_at  | DATETIME           | Update terakhir               |

### 🧾 **Tabel `banner_views`**

| Field     | Type     | Keterangan          |
| --------- | -------- | ------------------- |
| id        | INT      | ID unik             |
| banner_id | INT      | Relasi ke `banners` |
| user_id   | INT      | Siapa yang lihat    |
| viewed_at | DATETIME | Waktu lihat         |

### 🧾 **Tabel `banner_clicks`**

| Field      | Type     | Keterangan          |
| ---------- | -------- | ------------------- |
| id         | INT      | ID unik             |
| banner_id  | INT      | Relasi ke `banners` |
| user_id    | INT      | Siapa yang klik     |
| clicked_at | DATETIME | Waktu klik          |

---

## 🧮 **7. Logika Tampilan (Frontend)**

* Ambil data banner dari API `/api/banners?role=member&placement=dashboard`.
* Filter banner aktif berdasarkan tanggal & role.
* Urutkan berdasarkan `priority`.
* Tampilkan sebagai carousel otomatis (5 detik per slide).
* Simpan view di `banner_views` (on visible).
* Simpan klik di `banner_clicks` (on click event).
* Jika banner sudah pernah tampil hari ini → jangan tampilkan lagi.

---

## 🔒 **8. Akses Role**

| Role                  | Akses Banner              | Aksi                         |
| --------------------- | ------------------------- | ---------------------------- |
| **Admin**             | Semua banner              | CRUD, statistik, export data |
| **Affiliate**         | Banner umum & personal    | View & track klik affiliate  |
| **Mentor**            | Banner event / kursus     | View                         |
| **Member Premium**    | Semua banner aktif        | View & klik                  |
| **Member Free**       | Banner free/promo upgrade | View                         |
| **Guest (Non-login)** | Banner umum/sponsor       | View                         |

---

## 🧩 **9. Integrasi Ekosistem**

* **Mailketing** → untuk broadcast pengumuman penting via email.
* **OneSignal / Pusher** → untuk push notification real-time banner baru.
* **Affiliate System** → klik banner affiliate ikut tercatat sebagai referral.
* **Membership** → banner bisa dikunci berdasarkan paket (contoh: hanya untuk lifetime).

---

## 🚀 **10. Roadmap Pengembangan**

| Versi | Fitur Tambahan                          | Keterangan                     |
| ----- | --------------------------------------- | ------------------------------ |
| v1.0  | Banner dasar, CRUD, statistik view/klik | MVP pertama                    |
| v1.1  | Smart Targeting & Scheduling            | Berdasarkan role dan aktivitas |
| v1.2  | Banner Sponsor / Affiliate              | Monetisasi & tracking cookies  |
| v1.3  | Notifikasi OneSignal + Mailketing       | Real-time notif promo          |
| v1.4  | Popup + Floating Banner                 | Interaktif seperti Gojek/Grab  |

---

## ✅ **Kesimpulan**

Fitur **Banner & Iklan v.1** ini:

* Memberi fleksibilitas admin mengatur promosi & pengumuman.
* Meningkatkan keterlibatan user (engagement + upgrade).
* Bisa jadi **sumber pendapatan tambahan** lewat sponsor atau slot berbayar.
* Integrasi penuh dengan ekosistem (Mailketing, OneSignal, Affiliate, Membership).

---
Baik. Di bawah ini adalah **BRD Version 1 — AFFILIATE BOOSTER SUITE**, ditulis **dalam format ringkas, rapi, menyeluruh, tanpa sub-bab teknis panjang**, tetapi **semua fitur yang kita bahas sudah masuk 100%**.

Ini adalah dokumen **Business Requirement Document (BRD)** resmi versi 1.

---

# 🟩 **BRD V1 — AFFILIATE BOOSTER SUITE**

**Ekosistem promosi & follow-up untuk affiliate Ekspor Yuk**

**📊 PROGRESS TRACKER:**
- Phase 1: Template Center ✅ 100% COMPLETE
- Phase 2: Template Integration ✅ 100% COMPLETE  
- Phase 3: Automation Builder ✅ 100% COMPLETE
- Phase 4: Bio Affiliate ✅ 100% COMPLETE (2 Des 2025)
- Phase 5: Optin Form Builder ✅ 100% COMPLETE (2 Des 2025)
- Phase 6: Mini CRM ✅ 100% COMPLETE (2 Des 2025)
- Phase 7: Broadcast Email ✅ 100% COMPLETE (3 Des 2025)
- Phase 8: Scheduled Email & Automation ✅ 100% COMPLETE (3 Des 2025) ← BARU SELESAI
- Phase 9: Credit System ✅ 100% COMPLETE
- Phase 10: Execution Engine ✅ 100% COMPLETE

**Overall Progress: 100% (10/10 phases complete) 🎉 FULLY COMPLETE**

---

## **1. Purpose & Goal**

Affiliate Booster Suite adalah platform terintegrasi khusus untuk mendukung aktivitas promosi affiliate Ekspor Yuk, mulai dari membangun halaman Bio, menangkap lead, follow-up, sampai closing membership dan produk digital Ekspor Yuk.

Sistem ini memberikan:

* **Alat promosi** (BIO Page, tombol CTA internal, Optin Form)
* **Pengumpul lead otomatis**
* **Mini CRM bawaan**
* **Broadcast email berbasis kredit**
* **Penjadwalan & automation**
* **Template lengkap dari admin**
* **Tracking aktivitas & segmentasi lead**

Tujuan utama: membuat affiliate bisa bekerja **tanpa kebingungan**, seragam, profesional, dan menghasilkan penjualan secara stabil.

---

## **2. Core Philosophy**

1. Semua trafik affiliate **masuk ke ekosistem **, tidak bisa keluar ke website lain.
2. Semua template dan copywriting **disediakan oleh admin**, agar kualitas tetap stabil.
3. Email marketing untuk affiliate dibuat **mudah, otomatis, dan berbasis kredit**.
4. Lead tidak boleh hilang—setiap klik, form, atau aktivitas langsung tersimpan.
5. Affiliate cukup fokus **promosi**; sistem akan mengerjakan follow-up otomatis.

---

## **3. Main Components (Rangkuman Fitur Inti)**

---

# **A. BIO AFFILIATE (Link-in-Bio Internal)** ✅ COMPLETE

**Status:** ✅ 100% Implemented (2 Desember 2025)  
**Documentation:** `/nextjs-eksporyuk/AFFILIATE_BOOSTER_SUITE_PHASE_4_COMPLETE.md`

Halaman mini-web khusus affiliate yang tidak boleh memasukkan link eksternal kecuali *satu link Grup WhatsApp*.

**Fitur yang Sudah Implemented:**

* ✅ **5 Template Profesional** (Modern, Minimal, Bold, Elegant, Creative)
* ✅ **Bio Page Builder** dengan Live Preview
* ✅ **Custom Branding** (Colors, Fonts, Avatar, Cover Image)
* ✅ **Multiple CTA Buttons** dengan tipe:
  * Membership → Redirect ke `/membership/[slug]?ref=affiliateCode`
  * Product → Redirect ke `/products/[slug]?ref=affiliateCode`
  * Course → Redirect ke `/courses/[slug]?ref=affiliateCode`
  * Optin Form → Open modal form
  * Custom URL → Open link di new tab
* ✅ **WhatsApp Integration**:
  * Personal contact button (wa.me)
  * Join group button
* ✅ **Social Media Icons** (Facebook, Instagram, Twitter, TikTok, YouTube)
* ✅ **Drag & Drop Reorder** CTA buttons
* ✅ **Click Tracking** otomatis untuk setiap CTA
* ✅ **View Counter** untuk bio page
* ✅ **Public Bio URL**: `/bio/[username]`
* ✅ **SEO Optimized** dengan dynamic metadata
* ✅ **Mobile Responsive** semua template
* ✅ **Statistics Dashboard** (views, clicks, CTA count)

**Database Schema:**
- `AffiliateBioPage` (template, colors, fonts, social links, view count)
- `AffiliateBioCTA` (buttons with click tracking)

**API Endpoints:**
- GET/POST `/api/affiliate/bio` (Create/Update bio)
- POST/PUT/DELETE `/api/affiliate/bio/cta` (Manage CTA buttons)
- GET `/api/public/bio/[username]` (Public view)
- POST `/api/public/bio/cta/[id]/click` (Track clicks)

**Menu Location:** Sidebar → Booster Suite → Bio Page

Semua tombol mengarah ke halaman internal Ekspor Yuk dengan tracking affiliate otomatis via `?ref=affiliateCode`.

---

# **B. OPTIN FORM (Lead Magnet & Redirect WA)** ✅ COMPLETE

**Status:** ✅ 100% Implemented (Januari 2025)  
**Documentation:** `/nextjs-eksporyuk/AFFILIATE_BOOSTER_SUITE_PHASE_5_COMPLETE.md`

Affiliate dapat membuat form sederhana untuk mengumpulkan lead dengan builder lengkap.

**Fitur yang Sudah Implemented:**

* ✅ **Form Builder Dashboard** dengan 4-tab configuration:
  * Basic Tab: Form name, headline, description
  * Fields Tab: Toggle collect name/email/phone
  * Design Tab: Colors, countdown timer, benefits, FAQs
  * Action Tab: Success message, URL redirect, WhatsApp redirect
* ✅ **Public Form View** dengan design modern:
  * Hero banner dengan gradient custom colors
  * Animated badge & pulsing dot
  * Countdown timer (optional, auto-update)
  * Benefits section dengan checkmarks
  * FAQ section dengan accordion
  * Mobile-responsive (stack layout)
* ✅ **Lead Capture System**:
  * Collect Name (toggle)
  * Collect Email (toggle dengan format validation)
  * Collect WhatsApp (toggle dengan format hint)
* ✅ **Post-Submit Actions**:
  * Show success message
  * Redirect to custom URL
  * Redirect to WhatsApp (wa.me link)
* ✅ **Design Customization**:
  * Primary & secondary colors (color picker)
  * Banner badge text
  * Countdown timer dengan end date
  * Custom benefits list (JSON array)
  * Custom FAQ list (JSON array)
* ✅ **Automation Integration**:
  * Trigger AFTER_OPTIN automation
  * Lead masuk ke automation sequences
  * Email follow-up otomatis (H+1, pending, welcome)
* ✅ **Database Integration**:
  * Lead tersimpan ke `AffiliateLead` model
  * optinFormId linked
  * source = "optin"
  * status = "new"
* ✅ **Tracking & Analytics**:
  * Submission count per form
  * Lead count per form
  * Click tracking untuk Bio CTA
* ✅ **Form Management**:
  * Create new form
  * Edit existing form
  * Delete form
  * Copy form link
  * Copy embed code (iframe)
  * Active/inactive toggle
* ✅ **Public URL**: `/optin/[slug]` atau `/optin/[id]`
* ✅ **API Endpoints**:
  * GET/POST `/api/affiliate/optin-forms` (List & Create)
  * GET/PUT/DELETE `/api/affiliate/optin-forms/[id]` (Single operations)
  * POST `/api/affiliate/optin-forms/[id]/submit` (Public submission - NO AUTH)
  * GET `/api/public/optin-forms/[id]` (Public data - NO AUTH)
* ✅ **Security & Validation**:
  * Input validation (required fields, email format)
  * Only active forms accessible
  * XSS prevention
  * SQL injection prevention via Prisma

**Integration dengan Phase Lain:**
- ✅ Phase 3 (Automation): Trigger AFTER_OPTIN works
- ✅ Phase 4 (Bio): CTA button type "optin" integrated
- ✅ Phase 9 (Credits): Email automation deducts credits
- ✅ Phase 10 (Execution): Cron job executes automation
- ⏳ Phase 6 (CRM): Lead data prepared for management

**Components:**
- `CountdownTimer.tsx` (100+ lines) - Auto-updating countdown with custom colors
- `ResponsivePageWrapper` - Used for consistent layout

**Services:**
- `mailketingService.ts` (200+ lines) - Email sending for automation & broadcast
- `email.ts` (100+ lines) - Transactional email templates

**Menu Location:** Sidebar → Booster Suite → Optin Forms

Optin Form dapat dipasang di Bio (via CTA button), di-share sebagai link, atau di-embed di website eksternal via iframe.

---

# **C. MINI CRM (Lead Management)** ✅ **100% COMPLETE**

**Status:** Production Ready (2 Des 2025)

Semua lead affiliate disimpan dan bisa difilter berdasarkan:

* ✅ Status: New, Contacted, Qualified, Converted, Inactive
* ✅ Sumber: Optin Form, Manual, Import
* ✅ Tag: Custom tags (warm, hot, buyer, dll)
* ✅ Aktivitas: Email opens, link clicks, automation logs, broadcast logs
* ✅ Tanggal: Date range filter (start date - end date)
* ✅ Search: Nama, email, phone, WhatsApp

**Fitur Lengkap:**
- ✅ Lead list dengan pagination (20 leads per halaman)
- ✅ Multi-filter system (status, source, tag, search, date range)
- ✅ Statistics dashboard (total by status: New, Contacted, Qualified, Converted, Inactive)
- ✅ Manual lead creation (add lead form dengan validasi)
- ✅ Edit lead (update nama, kontak, status, notes)
- ✅ Delete lead (dengan konfirmasi dialog)
- ✅ Tag management (add/remove tags per lead)
- ✅ Lead detail view (nama, email, phone, WhatsApp, status, source, notes, tags)
- ✅ Export to CSV (dengan filter yang aktif)
- ✅ Integration dengan Phase 5 (optin form auto-capture)
- ✅ Integration dengan Phase 3/10 (automation tracking)
- ✅ Integration dengan Phase 7/8 (broadcast targeting - ready)
- ✅ Mobile responsive dengan ResponsivePageWrapper
- ✅ Sidebar menu "Leads (CRM)" di dashboard affiliate
- ✅ Security: Hanya tampilkan leads milik affiliate yang login
- ✅ Activity tracking: lastContactedAt auto-update saat status berubah

**Database Schema:**
```prisma
model AffiliateLead {
  id              String              @id @default(cuid())
  affiliateId     String
  optinFormId     String?             // Link to optin form
  name            String
  email           String?
  phone           String?
  whatsapp        String?
  status          String              @default("new")
  source          String              @default("optin")
  notes           String?
  lastContactedAt DateTime?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  // Relations
  affiliate       AffiliateProfile
  optinForm       AffiliateOptinForm?
  tags            AffiliateLeadTag[]
  broadcastLogs   AffiliateBroadcastLog[]
  automationJobs  AffiliateAutomationJob[]
  automationLogs  AffiliateAutomationLog[]
}

model AffiliateLeadTag {
  id        String        @id @default(cuid())
  leadId    String
  tag       String
  createdAt DateTime      @default(now())
  lead      AffiliateLead @relation(...)
  
  @@unique([leadId, tag])
}
```

**API Endpoints:**
- ✅ GET /api/affiliate/leads - List & filter leads
- ✅ POST /api/affiliate/leads - Create lead manually
- ✅ GET /api/affiliate/leads/[id] - Get single lead
- ✅ PUT /api/affiliate/leads/[id] - Update lead
- ✅ DELETE /api/affiliate/leads/[id] - Delete lead
- ✅ POST /api/affiliate/leads/[id]/tags - Add tag
- ✅ DELETE /api/affiliate/leads/[id]/tags - Remove tag

**Frontend:**
- ✅ Page: /affiliate/leads (780+ lines)
- ✅ Components: Stats cards, filter bar, lead table, modals, dialogs
- ✅ Features: CRUD operations, tag management, export CSV, search, filters

Mini CRM memudahkan affiliate melihat siapa yang harus difollow-up, tanpa dashboard rumit.

---

# **D. BROADCAST EMAIL BERBAYAR (PAKAI KREDIT)** ✅ **100% COMPLETE**

**Status:** ✅ Production Ready (3 Des 2025)

Affiliate dapat mengirim email massal ke lead mereka dengan sistem kredit. Setiap email = 1 kredit.

**Fitur yang Sudah Implemented:**

* ✅ **Campaign Builder** dengan 3-tab interface:
  * Content Tab: Name, subject, body editor, template selector
  * Target Tab: Lead segment filtering (status, source, tags)
  * Schedule Tab: Optional scheduling (untuk Phase 8)
* ✅ **Template Integration:** Gunakan email templates dari Phase 1
* ✅ **Lead Targeting:** Filter leads dari Phase 6 (status, source, tags)
* ✅ **Variable Replacement:** {{name}}, {{first_name}}, {{email}}, {{phone}}
* ✅ **Credit Billing:** Auto-deduct 1 credit per email
* ✅ **Email Tracking:**
  * Open tracking via invisible pixel
  * Click tracking via link rewriting
  * Per-recipient delivery logs
* ✅ **Analytics Dashboard:**
  * Total recipients, sent, delivered
  * Open rate, click rate, failure rate
  * Detailed logs per recipient
  * Export logs to CSV
* ✅ **Mailketing Integration:** Send via Mailketing API with fallback
* ✅ **Background Processing:** Async email sending with queue

**Database Schema:**
```prisma
model AffiliateBroadcast {
  id                  String
  affiliateId         String
  name                String                  // Campaign name
  subject             String                  // Email subject
  body                String                  // HTML body
  templateId          String?                 // Link to Phase 1 template
  status              String                  // DRAFT, SENDING, SENT, SCHEDULED
  targetSegment       Json?                   // Lead filters
  totalRecipients     Int
  sentCount           Int
  deliveredCount      Int
  openedCount         Int
  clickedCount        Int
  failedCount         Int
  creditUsed          Int
  isScheduled         Boolean
  scheduledAt         DateTime?
  sentAt              DateTime?
  completedAt         DateTime?
  
  // Relations
  affiliate           AffiliateProfile
  template            AffiliateEmailTemplate?
  logs                AffiliateBroadcastLog[]
}

model AffiliateBroadcastLog {
  id              String
  broadcastId     String
  leadId          String
  status          String              // PENDING, SENT, DELIVERED, OPENED, CLICKED, FAILED
  sentAt          DateTime?
  deliveredAt     DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  failedAt        DateTime?
  errorMessage    String?
  
  // Relations
  broadcast       AffiliateBroadcast
  lead            AffiliateLead
}
```

**API Endpoints:**
- ✅ GET /api/affiliate/broadcast - List all campaigns
- ✅ POST /api/affiliate/broadcast - Create new campaign
- ✅ GET /api/affiliate/broadcast/[id] - Get single campaign with logs
- ✅ PUT /api/affiliate/broadcast/[id] - Update campaign (DRAFT only)
- ✅ DELETE /api/affiliate/broadcast/[id] - Delete campaign (DRAFT only)
- ✅ POST /api/affiliate/broadcast/[id]/send - Send campaign (deduct credits)
- ✅ GET /api/affiliate/broadcast/[id]/stats - Get detailed analytics
- ✅ GET /api/track/open - Track email opens via pixel
- ✅ GET /api/track/click - Track link clicks and redirect

**Frontend:**
- ✅ Page: /affiliate/broadcast (844 lines) - List, create, edit campaigns
- ✅ Page: /affiliate/broadcast/[id] (450 lines) - Detail analytics & logs
- ✅ Components: Create modal, stats cards, logs table, CSV export
- ✅ Features: Draft saving, send confirmation, real-time stats, filtering
- ✅ Mobile responsive dengan ResponsivePageWrapper

**Email Service:**
- ✅ Mailketing API integration (`src/lib/services/mailketingService.ts` - 250+ lines)
- ✅ Tracking pixel insertion (1x1 transparent GIF)
- ✅ Link rewriting for click tracking
- ✅ Variable replacement engine
- ✅ Async sending with background job processing
- ✅ Error handling and retry logic

**Integration:**
- ✅ Phase 1: Email templates ready for selection
- ✅ Phase 6: Lead filtering & targeting working
- ✅ Phase 9: Credit billing & deduction working
- ✅ Security: Auth, ownership validation, input sanitization
- ✅ Sidebar menu "Broadcast Email" active

**Flow Process:**
1. Affiliate creates campaign (draft)
2. Select email template from Phase 1 (optional)
3. Filter target leads from Phase 6
4. Preview recipient count & credit cost
5. Send → System validates credits
6. Credits deducted (transaction logged)
7. Emails sent via Mailketing (async)
8. Opens & clicks tracked real-time
9. View analytics & recipient logs

Broadcast email memungkinkan affiliate mengirim promo, follow-up, dan nurturing sequence ke leads mereka dengan tracking lengkap.

---

# **E. SCHEDULED EMAIL & AUTOMATION (Penjadwalan & Recurring)** ✅ **100% COMPLETE (3 Des 2025)**

**Status:** ✅ Production Ready  
**Documentation:** `/nextjs-eksporyuk/PHASE_8_SCHEDULED_EMAIL_COMPLETE.md`

Affiliate dapat menjadwalkan broadcast untuk waktu tertentu dan mengatur pengiriman otomatis berulang (recurring).

**Fitur yang Sudah Implemented:**

**1. Scheduled Broadcasts:**
- ✅ **DateTime Picker** untuk set waktu pengiriman spesifik
- ✅ **Future Validation** - waktu harus di masa depan
- ✅ **Auto Status Change** - DRAFT → SCHEDULED saat dijadwalkan
- ✅ **Cancel Schedule** - batalkan jadwal dan kembali ke DRAFT
- ✅ **SCHEDULED Badge** dengan purple theme & clock icon
- ✅ **Timeline Display** menampilkan waktu terjadwal

**2. Recurring Broadcasts:**
- ✅ **Frequency Options:**
  - Daily (Harian) - setiap N hari
  - Weekly (Mingguan) - setiap N minggu
  - Monthly (Bulanan) - setiap N bulan
- ✅ **Interval Control** - set 1-30 untuk interval pengulangan
- ✅ **Day of Week Selector** - pilih hari tertentu (untuk weekly)
- ✅ **Time of Day** - set jam pengiriman spesifik (HH:mm)
- ✅ **End Date** - optional, set kapan recurring berhenti
- ✅ **Auto-Create Next Occurrence** - sistem otomatis buat jadwal berikutnya setelah terkirim

**3. Cron Job Automation:**
- ✅ **Endpoint:** GET `/api/cron/scheduled-broadcasts?token=SECRET`
- ✅ **Token Security** - CRON_SECRET_TOKEN untuk authorization
- ✅ **Hourly Processing** - process broadcasts dimana `scheduledAt <= NOW()`
- ✅ **Credit Validation** - check credits before sending
- ✅ **Background Sending** - async email processing via mailketingService
- ✅ **Next Occurrence Logic** - calculate & create next scheduled broadcast
- ✅ **Error Handling** - mark as FAILED if insufficient credits

**4. Schedule Management APIs:**
- ✅ POST `/api/affiliate/broadcast/[id]/schedule` - Schedule broadcast
- ✅ DELETE `/api/affiliate/broadcast/[id]/schedule` - Cancel schedule
- ✅ Enhanced POST `/api/affiliate/broadcast` - Create with scheduling

**Database Schema Updates:**
```prisma
model AffiliateBroadcast {
  // ... existing fields ...
  
  recurringConfig     Json?      // NEW FIELD for recurring patterns
  
  // Example structure:
  // {
  //   enabled: true,
  //   frequency: "DAILY" | "WEEKLY" | "MONTHLY",
  //   interval: 1,              // Every N days/weeks/months
  //   timeOfDay: "09:00",       // HH:mm format
  //   endDate: "2025-12-31",    // Optional
  //   daysOfWeek: [1,3,5]       // For weekly (0=Sun, 6=Sat)
  // }
}
```

**Frontend Enhancements:**
- ✅ **Recurring UI Section** di tab "Target & Jadwal":
  - Checkbox enable recurring
  - Dropdown frequency selector
  - Number input interval
  - Time picker
  - Days of week selector (7 buttons: Min-Sab)
  - Date picker for end date
  - Warning about credit deduction per occurrence
- ✅ **Cancel Schedule Button** untuk SCHEDULED broadcasts (orange theme)
- ✅ **Enhanced Form State** dengan recurring object
- ✅ **Toast Notifications** untuk schedule actions

**Cron Configuration:**

**Vercel:**
```json
{
  "crons": [{
    "path": "/api/cron/scheduled-broadcasts?token=YOUR_SECRET",
    "schedule": "0 * * * *"
  }]
}
```

**cPanel:**
```bash
0 * * * * curl -X GET "https://eksporyuk.com/api/cron/scheduled-broadcasts?token=YOUR_SECRET"
```

**Integration:**
- ✅ **Phase 7:** All broadcast features remain intact
- ✅ **Mailketing Service:** Used for sending scheduled emails
- ✅ **Credit System:** Deducted at send time, not schedule time
- ✅ **Tracking System:** Opens & clicks tracked for scheduled emails
- ✅ **Template Integration:** Templates available for scheduled broadcasts

**Recurring Flow:**
1. Affiliate creates broadcast with recurring enabled
2. Set frequency (daily/weekly/monthly), interval, time
3. Optional: Select days of week, set end date
4. Save → Status = SCHEDULED
5. Cron job runs hourly
6. When scheduledAt reached → Send emails
7. Calculate next occurrence time
8. Create new scheduled broadcast
9. Repeat until end date (if set)

**Example Use Cases:**
- **Daily Newsletter** - Send every morning at 9am
- **Weekly Webinar Reminder** - Every Monday & Wednesday at 8pm
- **Monthly Promo** - First day of month at 10am
- **One-time Launch** - Specific date & time without recurring
- **End Date Control** - Stop after 3 months of weekly emails

**Security:**
- ✅ Token authentication on cron endpoint
- ✅ Session validation on schedule APIs
- ✅ Ownership verification (broadcast belongs to affiliate)
- ✅ Credit validation before scheduling and sending
- ✅ Future date validation
- ✅ DRAFT-only scheduling restriction

**Code Statistics:**
- Backend: ~545 lines (2 new API files)
- Frontend: ~200 lines (recurring UI)
- Database: 1 field (recurringConfig)
- Total: **~955 lines of new/modified code**

**Testing:**
- ✅ Build: 0 errors
- ✅ All routes compiled successfully
- ✅ Manual testing checklist complete
- ✅ cURL examples provided

Phase 8 memberikan kekuatan full automation kepada affiliate untuk menjalankan email marketing campaigns secara autopilot dengan penjadwalan dan recurring yang fleksibel.

---

# **F. TEMPLATE CENTER (Admin Template Library)** ✅ **100% COMPLETE**

**Status:** ✅ Implemented & Operational  
**Documentation:** `/nextjs-eksporyuk/AFFILIATE_BOOSTER_SUITE_TEMPLATE_CENTER.md`

Agar affiliate tidak bingung, admin menyediakan semua template:

### Template Email:

* Reminder pembayaran
* After Zoom
* Promo membership
* Upsell ebook
* Upsell jasa website
* Welcome sequence
* Daily education
* Launch / promo / urgency

### Template CTA Bio:

* “Daftar Webinar”
* “Ambil Ebook Gratis”
* “Mulai Belajar Ekspor”
* “Join Membership Premium”

Affiliate cukup klik → template otomatis muncul di editor.

---

# **G. KREDIT SYSTEM (Top-Up & Pemakaian)** ✅ **100% COMPLETE**

**Status:** ✅ Fully Implemented  
**Pages:**
- Affiliate: `/affiliate/credits` - Balance, top-up, transaction history
- Admin: `/admin/affiliate/credits` - Manage credits, manual add/deduct

Setiap pengiriman email membutuhkan kredit.

Paket kredit (contoh):

* 50rb → 70 kredit
* 100rb → 150 kredit
* 250rb → 400 kredit
* 500rb → 900 kredit
* 1 juta → 2.000 kredit

Affiliate bisa top-up dan admin bisa menambah kredit secara manual.

Kredit dipotong saat:

* Broadcast
* Scheduled email
* Automation

---

# **H. AUTOMATION SEQUENCE** ✅ **100% COMPLETE**

**Status:** ✅ Fully Functional  
**Page:** `/affiliate/automation` - Create, manage, activate automation sequences  
**Features:** Trigger setup, delay configuration, email steps, drag-drop builder

Admin menyediakan automation default yang bisa langsung dipakai affiliate tanpa setting apa pun:

* **Zoom Follow-Up**

  * H+0: replay & CTA
  * H+1: edukasi buyer
  * H+2: kesalahan pemula
  * H+3: batas waktu promo

* **Pending Payment Follow-Up**

  * 30 menit
  * 2 jam
  * H+1
  * H+2
  * H+3 (last call)

* **Welcome Lead Sequence**

  * Email 1: Welcome
  * Email 2: Edukasi dasar buyer
  * Email 3: Cara mulai ekspor

* **Ebook / Lead Magnet Sequence**

  * Link download
  * Edukasi lanjutan
  * CTA membership

Affiliate tinggal memilih → otomatis aktif.

---

# **I. BROADCAST HISTORY & ANALYTICS** ✅ **100% COMPLETE**

**Status:** ✅ Integrated in Broadcast System  
**Page:** `/affiliate/broadcast` - Full history, stats, and analytics dashboard  
**Tracking:** Open rates, click rates, credit usage, timeline view

Affiliate bisa melihat:

* Jumlah email terkirim
* Kredit terpakai
* Open rate
* Click rate
* Status email
* Template yang digunakan

Tracking klik dari Bio juga tampil di dashboard.

---

# **J. ADMIN PANEL (Fitur Khusus Admin)** ✅ **100% COMPLETE**

**Status:** ✅ Fully Operational  
**Admin Pages:**
- `/admin/affiliate/templates` - Email & CTA template management
- `/admin/affiliate/credits` - Credit management for all affiliates
- `/admin/affiliates/challenges` - Challenge & leaderboard setup
- `/admin/affiliates/payouts` - Payout approval & management
- `/admin/affiliates` - Affiliate statistics & performance tracking

Admin memiliki kemampuan untuk:

* Membuat & publish template email
* Membuat template CTA Bio
* Mengatur automation sequence
* Menambah / mengurangi kredit affiliate
* Menyetujui pembelian kredit
* Melihat statistik global (email, open rate, kredit)
* Melihat performa affiliate

---

## **4. Business Impact**

Affiliate Booster Suite memberikan keuntungan besar:

### Untuk Affiliate:

* Tidak perlu mikir copywriting
* Funnel sudah jadi, tinggal pakai
* Lead terkumpul otomatis
* Follow-up otomatis
* Broadcast mudah → hanya klik dan kirim

### Untuk Ekspor Yuk:

* Semua trafik affiliate masuk ke sistem internal
* Konversi membership naik signifikan
* Kredit menjadi sumber revenue stabil
* Customer journey tertata rapi
* Ekosistem makin besar dan kuat

---

## **5. Deliverables (Output yang dihasilkan sistem)**

* Bio Page affiliate
* Optin Form builder
* Mini CRM dashboard
* Template Center
* Broadcast & Scheduling system
* Kredit system
* Automation engine
* Tracking & analytics

---

## **6. Ruang Lingkup BRD V1**

Fokus BRD versi ini adalah merangkum keseluruhan fitur inti secara bisnis, mencakup:

1. Bio Affiliate
2. Lead Capture & Optin
3. Lead Management
4. Broadcast Email
5. Scheduled Email
6. Template Center
7. System Kredit
8. Automation Sequences
9. Admin Panel
10. Tracking & reporting

(Detail teknis disiapkan di PRD terpisah.)

---

# **END OF BRD V1 — AFFILIATE BOOSTER SUITE**


Baik, saya buatkan **PRD Perbaikan Fitur Kelas** (bukan membuat modul baru), sesuai permintaan:

✔ Fitur Kelas **sudah ada**, tetapi **belum berfungsi**
✔ PRD ini hanya mencakup **perbaikan**, **penyesuaian**, **penyempurnaan**, dan **integrasi**
✔ Mengikuti **aturan kerja** yang kamu berikan
✔ Tidak menghapus fitur lama kecuali tidak ada fungsinya
✔ Bahasa Indonesia
✔ Menggunakan tab (bukan popup)
✔ Menggunakan ResponsivePageWrapper
✔ Integrasi penuh dengan role, membership, database

Berikut PRD-nya 👇

---

# 🟩 **PRD Perbaikan Fitur Kelas – Ekspor Yuk Platform**

**Versi:** 1.1 (Perbaikan Fitur Yang Sudah Ada)
**Tujuan:** Mengaktifkan semua fungsi kelas agar berjalan sesuai role, pricing, membership, dan publikasi.

---

# 📌 **1. Ruang Lingkup PRD Perbaikan**

Dokumen ini hanya berisi:

* Evaluasi fitur kelas yang sudah ada
* Perbaikan fungsi yang belum berjalan
* Penyempurnaan logic akses kelas
* Optimalisasi UI sesuai aturan kerja
* Integrasi ke membership & role affiliate
* Penataan ulang setting kelas agar konsisten

**Tidak membuat fitur baru**, kecuali diperlukan agar fitur berjalan sempurna.

---

# 📌 **2. Masalah Umum Pada Modul Kelas Saat Ini (Diketahui)**

Berdasarkan permintaan:

1. Role akses belum bekerja (affiliate/member)
2. Status kelas (draft/publish/private) belum berfungsi
3. Kelas berbayar belum terhubung ke sistem membership
4. Kelas affiliate muncul di kelas umum
5. Kelas member tidak membatasi akses non-member
6. Tidak ada toggle tampil publik / non-publik
7. UI belum memakai tab & ResponsivePageWrapper
8. Security akses belum diterapkan (semua orang bisa akses jika tahu URL)
9. Tidak terhubung ke database secara benar atau belum lengkap
10. Tidak ada validasi — risiko error tinggi

PRD ini memperbaiki semua poin tersebut.

---

# 🟩 **3. Perbaikan Fitur Kelas (Wajib Implementasi)**

---

# ⭐ **A. Perbaikan Akses Role Kelas (AFFILIATE / MEMBER / UMUM)**

Fungsi akses harus bekerja 100%.

### **1. Kelas Member**

Perbaikan:

* Hanya member aktif yang dapat akses kelas
* Non-member melihat pesan:
  **“Kelas ini hanya untuk Member Premium. Silakan upgrade membership.”**
* Member tidak perlu bayar walaupun kelas punya harga
* Member dapat akses secara otomatis via middleware

---

### **2. Kelas Affiliate**

Perbaikan:

* Hanya role affiliate yang bisa akses
* Tidak tampil di halaman kelas publik
* Tidak terlihat oleh non-affiliate
* Jika non-affiliate buka URL:

**“Anda tidak memiliki izin untuk mengakses kelas ini.”**

---

### **3. Kelas Umum**

Perbaikan:

* Tampil untuk semua user
* Jika kelas gratis → langsung akses
* Jika kelas berbayar → tampil tombol beli

---

# ⭐ **B. Perbaikan Status Kelas (Publish / Draft / Private)**

Perbaikan fungsional:

### **Draft**

* Tidak tampil ke publik
* Tidak bisa diakses user
* Hanya admin bisa melihat

### **Publish**

* Tampil ke user yang sesuai role
* Muncul di daftar kelas sesuai pengaturan tampil publik
* Konten harus dapat diakses

### **Private**

* Tidak tampil ke publik
* Hanya user role tertentu yang dapat melihat (member/affiliate)
* Tetap tercatat dan aktif di DB

**Pastikan state ini 100% aktif di FE, BE, dan DB.**

---

# ⭐ **C. Perbaikan Integrasi Membership & Harga Kelas**

Jika kelas ada harga, perbaikan berikut wajib berlaku:

### **Jika user adalah MEMBER AKTIF:**

* Akses selalu gratis
* Harga kelas hilang otomatis
* Tombol beli diganti dengan:
  **“Akses melalui Membership Anda.”**

### **Jika user bukan member:**

* User melihat harga
* Bisa beli kelas secara individual

### **Jika kelas gratis:**

* Akses sesuai role tanpa pembelian

---

# ⭐ **D. Penambahan Setting: “Tampilkan di Publik”**

Perbaikan:

* Admin bisa toggle “Tampilkan untuk Publik”
* Jika OFF → hanya internal (affiliate/member)
* Jika ON → muncul di halaman kelas umum
* Kelas affiliate **tidak boleh tampil publik walaupun toggle ON**
* Kelas member **hanya tampil publik sebagai preview**, tetapi konten terkunci

---

# ⭐ **E. Perbaikan UI/UX Sesuai Aturan Kerja**

Perbaikan wajib:

* Semua halaman kelas harus memakai **ResponsivePageWrapper**
* Tidak boleh ada popup → ganti dengan **tab form**
* Tab untuk edit kelas:

  * Informasi Kelas
  * Materi Kelas
  * Pengaturan Akses
  * Pengaturan Harga
  * Status & Publikasi
* Pastikan desain ringan, bersih, dan aman

---

# ⭐ **F. Perbaikan Sistem Security Akses (IMPORTANT)**

Middleware wajib aktif pada setiap kelas:

1. **authCheck** → pastikan login
2. **roleCheck** → validasi affiliate/member/publik
3. **membershipCheck** → validasi membership aktif
4. **priceCheck** → jika berbayar, pastikan sudah beli
5. **statusCheck** → tidak boleh akses kelas draft
6. **publicVisibilityCheck** → tampil publik atau tidak

URL kelas **tidak boleh** bisa diakses hanya dengan link tanpa hak akses.

---

# ⭐ **G. Perbaikan Database (Sync Existing + Tambahan Minimal)**

Pastikan tabel yang ada diperbaiki / dilengkapi:

### Table: `classes`

Perbaikan kolom wajib aktif:

* roleAccess (enum: member, affiliate, public)
* price (number / null)
* membershipIncluded (boolean)
* isPublic (boolean)
* status (draft, publish, private)

### Table: `class_access`

Perbaikan logic:

* Jika membership aktif → row otomatis terbaca
* Jika beli kelas → row tercatat
* Jika affiliate dan kelas affiliate → row otomatis terbaca

**Tidak hapus data lama tanpa konfirmasi.**

---

# ⭐ **H. Sidebar Menu (Perbaikan, Bukan Tambahan Baru)**

Pastikan menu tidak duplikat, tetapi diperbaiki:

### Admin:

* **Kelas**

  * Semua Kelas
  * Tambah Kelas

### Member:

* **Kelas Saya**

### Affiliate:

* **Kelas Affiliate**

Jika menu sudah ada → jangan duplikasi, hanya perbaiki routing dan logic tampil.

---

# ⭐ **I. Perbaikan Routing & Logic Tampilan Kelas**

### Admin

* Dapat melihat semua kelas
* Dapat edit semua kelas

### Member

* Lihat hanya kelas member & kelas umum
* Lihat kelas berbayar yang sudah dibeli

### Affiliate

* Lihat kelas affiliate & kelas umum

### Publik

* Lihat kelas umum yang ditandai tampil publik
* Tidak boleh lihat konten sebelum login jika kelas berbayar

---

# 📌 **4. Alur Sistem (Flow)**

---

## **A. Admin Mengedit Kelas**

```
Dashboard Admin → Kelas → Edit → Tab Form
→ Perbaiki Informasi & Role → Simpan
```

---

## **B. User Akses Kelas**

1. Sistem cek status kelas
2. Sistem cek role user
3. Sistem cek membership aktif (jika role = member)
4. Sistem cek akses pembelian (jika kelas berbayar)
5. Sistem cek publik visibility
6. Jika semua sesuai → tampilkan konten

---

## **C. User Melihat Daftar Kelas**

* Publik hanya lihat kelas umum yang ON
* Non-member lihat preview kelas member
* Affiliate lihat kelas affiliate otomatis

---

# 📌 **5. Checklist Developer (WAJIB)**

### Akses Role

✔ Member hanya akses kelas member
✔ Affiliate hanya akses kelas affiliate
✔ Publik hanya lihat kelas umum

### Harga & Membership

✔ Member tidak bayar kelas berharga
✔ Pembelian kelas bekerja
✔ Harga hilang ketika akses via membership

### UI / UX

✔ Gunakan ResponsivePageWrapper
✔ Gunakan tab, bukan popup
✔ Semua form & field bersih

### Database

✔ Pastikan kolom wajib aktif
✔ Tidak duplikasi tabel
✔ Semua relasi kelas → user berjalan

### Security

✔ Semua akses pakai middleware
✔ Tidak ada URL yang bisa diakses tanpa izin

---

# 📌 **6. Kesimpulan PRD Perbaikan**

Modul kelas yang sudah ada harus:

* Diaktifkan fungsinya
* Diperbaiki logic role
* Diperbaiki logic membership + harga
* Disempurnakan status publish
* Diproteksi dengan middleware
* Dibuat ringan & bersih tampilannya
* Menggunakan tab form + ResponsivePageWrapper
* Terintegrasi penuh dengan database dan role lainnya

**Tidak menambah fitur baru kecuali untuk membuat modul kelas berfungsi sempurna.**

---

Siap. Berikut **PRD PERBAIKAN (REFINEMENT) HALAMAN BRANDING**
khusus untuk halaman yang **SUDAH ADA** di:

> **`/admin/settings/branding`**

Dokumen ini **BUKAN membuat fitur baru**, tapi **mengaktifkan, merapikan, dan menyempurnakan** agar branding benar-benar berfungsi sesuai kebutuhan sistem & bisnis kamu.

---

# 🟦 **PRD PERBAIKAN – BRANDING SETTINGS V.1**

**Halaman:** `/admin/settings/branding`
**Versi:** 1.1 (Refinement Existing Feature)
**Status:** Improvement & Activation
**Scope:** Admin only

---

## 1. TUJUAN PERBAIKAN

Halaman **Branding Settings** sudah ada, tetapi perlu diperbaiki agar:

1. Branding **benar-benar diterapkan realtime** ke seluruh website
2. Logo **berbeda berdasarkan role** (affiliate vs non-affiliate)
3. Warna, teks, dan style **konsisten di semua halaman & role**
4. Notifikasi realtime **selalu aktif & terlihat**
5. Tidak ada setting “pajangan” yang tidak berdampak ke UI

---

## 2. KONDISI SAAT INI (ASUMSI MASALAH)

Masalah umum yang biasanya terjadi dan **HARUS diperbaiki**:

* Logo di-setting tapi **tidak berubah di semua role**
* Perubahan warna **tidak konsisten** (hanya sebagian halaman)
* Tidak ada **preview realtime**
* Branding **belum terikat ke role affiliate**
* Setting tersimpan tapi **tidak dipakai oleh FE**
* Notifikasi tidak selalu muncul / badge tidak update
* Tidak ada validasi kontras warna (teks sulit dibaca)

PRD ini menyelesaikan semua itu.

---

## 3. PRINSIP PERBAIKAN (WAJIB)

Mengikuti aturan kerja kamu:

* ❌ Tidak hapus fitur existing
* ✅ Aktifkan fungsi yang belum jalan
* ✅ Sinkron FE + BE + DB
* ❌ Tidak buat menu baru
* ❌ Tidak popup (kecuali notifikasi)
* ✅ ResponsivePageWrapper
* ✅ Aman, ringan, clean
* ✅ Bahasa Indonesia

---

## 4. STRUKTUR HALAMAN (TETAP / DIPERBAIKI)

URL tetap:
`/admin/settings/branding`

Gunakan **TAB (bukan popup)**:

1. **Logo & Identitas**
2. **Warna & Tema**
3. **Typography & Teks**
4. **Komponen UI**
5. **Notifikasi Realtime**

Jika tab sudah ada → **perbaiki fungsinya**, bukan tambah tab baru.

---

## 5. DETAIL PERBAIKAN PER TAB

---

### 🟦 TAB 1 — LOGO & IDENTITAS (PERBAIKAN WAJIB)

#### A. Logo berdasarkan role

| Role          | Logo                      |
| ------------- | ------------------------- |
| Admin         | Logo Utama                |
| User Free     | Logo Utama                |
| User Premium  | Logo Utama                |
| Supplier      | Logo Utama                |
| **Affiliate** | **Logo Affiliate (beda)** |

#### Perbaikan yang WAJIB:

* Logo affiliate **benar-benar berbeda**
* Sidebar kiri membaca logo dari DB berdasarkan role
* Tidak hardcode logo di FE
* Logo update **realtime** (refresh halaman OK, tanpa restart server)

#### Field yang harus aktif:

* Logo Utama
* Logo Affiliate
* Favicon

---

### 🟦 TAB 2 — WARNA & TEMA (GLOBAL THEME ENGINE)

#### Warna WAJIB:

* Primary: `#2047FC`
* Secondary: `#ffc30d`
* Netral: putih & hitam

#### Perbaikan wajib:

* Semua komponen UI **mengambil warna dari config branding**
* Tidak ada warna hardcode di component
* Sidebar, header, button, badge, card, table **sinkron**
* Warna disimpan di DB & dipakai global

#### Validasi:

* Jika teks tidak terbaca → tampilkan warning
* Tidak boleh simpan warna ekstrim tanpa kontras

---

### 🟦 TAB 3 — TYPOGRAPHY & TEKS BRAND

#### Field yang harus benar-benar berfungsi:

* Nama Platform
* Nama Pendek
* Tagline
* Ukuran Heading
* Ukuran Text body

#### Perbaikan:

* Nama platform tampil di:

  * Title browser
  * Header
  * Footer
* Tagline muncul konsisten
* Tidak hanya tersimpan, tapi **dipakai FE**

---

### 🟦 TAB 4 — KOMPONEN UI (STYLE SYSTEM)

#### Komponen yang dikontrol:

* Button Primary
* Button Secondary
* Sidebar Active
* Sidebar Background
* Card Background
* Border Radius
* Hover State

#### Perbaikan:

* Semua halaman pakai style ini
* Tidak ada style ganda
* Tidak conflict antar role

---

### 🟦 TAB 5 — NOTIFIKASI REALTIME (SANGAT PENTING)

#### Integrasi WAJIB aktif:

* Pusher → realtime UI
* OneSignal → push notif
* Mailketing → email notif

#### Perbaikan fungsional:

1. **Icon notifikasi kanan atas selalu tampil**
2. Badge realtime (angka merah)
3. Popup muncul **hanya saat notif baru**
4. Popup bisa ditutup
5. Notifikasi masuk tanpa reload halaman
6. Semua role menerima notif sesuai haknya

❗ Popup **HANYA BOLEH untuk notifikasi**

---

## 6. PERBAIKAN BACKEND (WAJIB)

### A. API Branding

* 1 endpoint global branding
* Semua role fetch dari endpoint ini
* Cache boleh, tapi invalidated saat update

### B. Database

Pastikan field berikut **dipakai**, bukan cuma disimpan:

* logo_main
* logo_affiliate
* primary_color
* secondary_color
* brand_name
* tagline
* typography_json
* component_style_json

---

## 7. SECURITY & PERFORMANCE

* Upload logo hanya admin
* Validasi file (size & type)
* CDN untuk logo
* Tidak expose path file
* Branding tidak bisa diubah via FE request selain admin

---

## 8. USER FLOW (REAL)

### Admin

```
Admin → /admin/settings/branding
→ Edit logo / warna
→ Simpan
→ Semua halaman langsung berubah
```

### User

```
User login
→ Sistem cek role
→ Ambil branding
→ Logo & tema sesuai role
```

### Notifikasi

```
Event terjadi
→ Pusher trigger
→ Badge update
→ Popup tampil
→ OneSignal + Email terkirim
```

---

## 9. CHECKLIST DEV (FINAL)

✔ Tidak buat halaman baru
✔ Tidak hapus fitur lama
✔ Logo affiliate berbeda & aktif
✔ Warna konsisten global
✔ Tidak ada hardcode warna
✔ Branding dipakai FE
✔ ResponsivePageWrapper
✔ Popup hanya notif
✔ Semua role tested
✔ Tidak ada error
✔ UI ringan & bersih

---

## 10. KESIMPULAN

Halaman **/admin/settings/branding**:

* Sudah ada → **wajib difungsikan penuh**
* Menjadi **satu-satunya sumber branding**
* Mengontrol logo, warna, teks, UI, dan notifikasi
* Realtime, konsisten, aman
* Siap production



---

## 📊 DATA MIGRASI SEJOLI → NEXT.JS ✅ COMPLETE

**Status**: ✅ **100% COMPLETE** (19 Desember 2025)  
**Documentation**: `/nextjs-eksporyuk/SEJOLI_IMPORT_COMPLETE.md`

### IMPORT SUMMARY
✅ **Users**: 19,016 imported  
✅ **Transactions**: 19,252 imported (SUCCESS: 12,827 | PENDING: 42 | FAILED: 6,383)  
✅ **Memberships**: 10,124 created  
✅ **Affiliate Profiles**: 124 created  
✅ **Affiliate Conversions**: 3,742 with commission tracking  
✅ **Total Revenue**: Rp 4.130.776.001  
✅ **Total Commission**: Rp 971.545.000

### STRUKTUR DATA SEJOLI
Data yang tersedia dari export Sejoli (`sejolisa-full-18000users-1765279985617.json`):

✅ **Produk** - Ada di `order.product_id` (contoh: 179, 13401, 3840, dll)
✅ **Harga** - Ada di `order.grand_total` per transaksi  
✅ **User pembeli** - Ada di `order.user_id`
✅ **Affiliate** - Ada di `order.affiliate_id` dan bisa di-lookup ke tabel `affiliates` untuk dapat nama & email
✅ **Status transaksi** - Ada di `order.status` (completed, cancelled, refunded, payment-confirm, on-hold)

### KOMISI SISTEM ✅ VERIFIED
✅ **Komisi sudah tersimpan di**:
- **Database**: `AffiliateConversion.commissionAmount` (✅ verified accurate)
- **File**: `flat-commission-final.json` (total per affiliate - 124 affiliates, Rp 971.545.000 total)
- **Mapping**: `product-membership-mapping.js` (komisi per product_id)
- **Verification**: All commission calculations verified against product mapping

✅ **Setiap produk beda-beda komisi**:
- Product 179 → Rp 250.000
- Product 13401 → Rp 325.000 (highest)
- Product 3840 → Rp 300.000
- Product 8683 → Rp 300.000
- Product 8684 → Rp 250.000
- dll (total 54 produk dengan komisi Rp 0 - Rp 325.000)

### TOP 10 AFFILIATES (Verified)
1. **Sutisna**: Rp 209.395.000 (539 conversions)
2. **Rahmat Al Fianto**: Rp 109.435.000 (415 conversions)
3. **Asep Abdurrahman Wahid**: Rp 103.285.000 (443 conversions)
4. **Hamid Baidowi**: Rp 93.510.000 (374 conversions)
5. **Yoga Andrian**: Rp 90.385.000 (342 conversions)
6. **NgobrolinEkspor**: Rp 82.055.000 (329 conversions)
7. **eko wibowo**: Rp 49.260.000 (197 conversions)
8. **Muhamad safrizal**: Rp 36.995.000 (148 conversions)
9. **PintarEkspor**: Rp 31.225.000 (125 conversions)
10. **Fadlul Rahmat**: Rp 23.720.000 (95 conversions)

### KATEGORI PRODUK & MEMBERSHIP MAPPING

#### 📦 LIFETIME MEMBERSHIP (15 produk) → User dapat membership LIFETIME
**Product IDs**: 28, 93, 179, 1529, 3840, 4684, 6068, 6810, 11207, 13401, 15234, 16956, 17920, 19296, 20852
**Komisi**: Rp 0 - Rp 325.000 (tergantung produk)

#### 📅 12 BULAN MEMBERSHIP (2 produk) → User dapat membership 12 BULAN
**Product IDs**: 8683, 13399
**Komisi**: Rp 250.000 - Rp 300.000

#### 📅 6 BULAN MEMBERSHIP (2 produk) → User dapat membership 6 BULAN
**Product IDs**: 8684, 13400
**Komisi**: Rp 200.000 - Rp 250.000

#### 🔄 RENEWAL (3 produk) → Perpanjangan membership existing
**Product IDs**: 8910, 8914, 8915
**Komisi**: Rp 0 (no commission)

#### 🎤 EVENT/WEBINAR/ZOOMINAR (19 produk) → User GRATIS/FREE di web baru
**Product IDs**: 397, 488, 12994, 13039, 13045, 16130, 16860, 16963, 17227, 17322, 17767, 18358, 18528, 18705, 18893, 19042, 20130, 20336, 21476
**Komisi**: Rp 0 - Rp 100.000
**Catatan**: User yang beli event/webinar tetap bisa akses platform tapi TIDAK dapat membership premium.

#### 🛠️ TOOL/APLIKASI (4 produk) → Tidak dapat membership
**Product IDs**: 2910, 3764, 4220, 8686
**Komisi**: Rp 0 - Rp 85.000

#### 💼 JASA (6 produk) → Tidak dapat membership
**Product IDs**: 5928, 5932, 5935, 16581, 16587, 16592
**Komisi**: Rp 0 - Rp 150.000

#### 🆓 GRATIS (1 produk) → Tidak dapat membership
**Product ID**: 300 (Kelas Ekspor Gratis)

#### 🎯 LAINNYA (1 produk)
**Product ID**: 16826 (Paket Umroh 1 Bulan + Cari Buyer Ekspor)

### STATISTIK DATA ✅ FINAL
- **Total Users**: 19,016 (imported)
- **Total Orders**: 19,252 (imported)
- **Completed Orders**: 12,827 (SUCCESS status)
- **Total Affiliates**: 124 (active affiliates with profiles)
- **Orders dengan Affiliate**: 3,742 (SUCCESS with commission)
- **Affiliates dengan Komisi**: 124 affiliates
- **Total Commission Paid**: Rp 971.545.000 (verified)
- **Total Revenue**: Rp 4.130.776.001

### COMMISSION DISTRIBUTION
- **0 (Free Events)**: 0 conversions
- **1-100k**: 643 conversions
- **100-200k**: 205 conversions  
- **200-300k**: 1,850 conversions
- **300k+**: 1,044 conversions

### FILE MAPPING & HELPER
- **Product Mapping**: `/scripts/migration/product-membership-mapping.js`
- **Commission Data**: `/scripts/migration/flat-commission-final.json`
- **Sejoli Export**: `/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json`
- **Commission Helper**: `/src/lib/sejoli-commission.ts` - `getCommissionBySejolProductId(productId)`
- **Import Scripts**: 
  - `sejoli-api-import.js` (main import - 481 lines)
  - `import-affiliates-and-conversions.js` (affiliate import - 450+ lines)
  - `verify-sejoli-commissions.js` (verification - 250+ lines)

📊 DATA YANG SAYA KETAHUI LENGKAP:
1. PRODUK & KATEGORI (54 produk total)
15 produk → Lifetime Membership (komisi Rp 0 - Rp 325.000)
2 produk → 12 Bulan Membership (komisi Rp 250.000 - Rp 300.000)
2 produk → 6 Bulan Membership (komisi Rp 200.000 - Rp 250.000)
19 produk → Event/Webinar (user jadi FREE, komisi Rp 0 - Rp 100.000)
3 produk → Renewal (komisi Rp 0)
6 produk → Jasa (komisi Rp 0 - Rp 150.000)
4 produk → Tools/Aplikasi (komisi Rp 0 - Rp 85.000)
1 produk → Gratis
1 produk → Lainnya
1 produk → Paket Umroh
2. DATA TRANSAKSI SEJOLI
Total Orders: 18,584
Completed Orders: 12,539
Total Revenue: Rp 3.950.660.373
Orders dengan Affiliate: 11,291
3. DATA AFFILIATE & KOMISI
Total Affiliates di Sejoli: 12,585
Affiliates yang dapat komisi: 97 orang
Total Komisi Dibayar: Rp 1.232.435.000
4. CONTOH KOMISI PER PRODUK
Product 13401 → Rp 325.000 (komisi tertinggi)
Product 179 → Rp 250.000
Product 3840 → Rp 300.000
Product 8683 → Rp 300.000 (12 bulan)
Product 8684 → Rp 250.000 (6 bulan)
5. FILE YANG SUDAH ADA
✅ product-membership-mapping.js - Mapping 54 produk
✅ flat-commission-final.json - Total komisi 97 affiliates
✅ sejolisa-full-18000users-1765279985617.json - Export lengkap
✅ Database AffiliateConversion.commissionAmount - Data sudah benar
6. SISTEM KOMISI SUDAH FIXED
✅ API /admin/transactions sudah pakai database saja
✅ Frontend menampilkan affiliateConversion.commissionAmount yang benar
✅ Tidak lagi pakai perhitungan 30% yang salah

WEBINAR 35K - Ada 4 product berbeda:

Product 19042: Komisi 50k ✓
Product 21476: Komisi 50k ✓
Product 18528: Komisi 20k ← 
Product 20130: Komisi 50k ✓
KELAS 899K - Ada 4 product berbeda:

Product 8683: Komisi 300k
Product 17920: Komisi 250k ← Ini lifetime promo, bukan 12 bulan
Product 13399: Komisi 250k ← 
Product 20852: Komisi 280k


---

# 🟦 **PRD – Support Ticket System**

**Nama Modul:** Support Ticket
**Versi:** 1.0
**Status:** New Feature (terintegrasi penuh dengan sistem existing)
**Scope:** Admin, Support, Affiliate, Member, User Free, Supplier

---

## 1. TUJUAN BISNIS

Support Ticket System dibuat untuk:

1. Menjadi **satu-satunya jalur resmi bantuan** pengguna
2. Mengurangi support via chat pribadi (WA, DM)
3. Memberikan **tracking & histori masalah user**
4. Memastikan SLA support terkontrol
5. Memudahkan admin & tim support mengelola permintaan
6. Meningkatkan kepercayaan & profesionalisme platform

---

## 2. PRINSIP UTAMA (WAJIB)

1. Semua support **melalui tiket**, bukan chat bebas
2. Setiap tiket **punya status & histori jelas**
3. Akses tiket **berdasarkan role**
4. Support tidak boleh bocor antar user
5. Terintegrasi dengan **notifikasi realtime**
6. Tidak menggunakan popup (kecuali notif)
7. Ringan, aman, dan scalable

---

## 3. ROLE & AKSES

### 🟦 User (Free / Member / Affiliate / Supplier)

* Buat tiket
* Melihat tiket milik sendiri
* Membalas tiket
* Upload lampiran
* Menutup tiket (close)

### 🟦 Admin

* Melihat semua tiket
* Assign tiket ke staff support
* Mengubah status & prioritas
* Memberi balasan
* Menutup / reopen tiket
* Melihat statistik support

### 🟦 Support Staff (opsional role)

* Melihat tiket yang di-assign
* Membalas tiket
* Update status

---

## 4. STRUKTUR MENU (TANPA DUPLIKAT)

### Sidebar User

**Bantuan → Tiket Support**

### Sidebar Admin

**Support → Tiket**

(Jika menu sudah ada → perbaiki routing & logic, jangan duplikat)

---

## 5. FITUR UTAMA SUPPORT TICKET

---

### ⭐ 5.1 Pembuatan Tiket

User dapat membuat tiket dengan form TAB (bukan popup):

#### Field wajib:

* Judul tiket
* Kategori masalah
* Deskripsi masalah
* Lampiran (opsional)

#### Kategori contoh:

* Akun & Login
* Membership & Pembayaran
* Kelas
* Affiliate 
* Iklan & Tracking
* Bug Sistem
* Lainnya

Setelah submit:

* Tiket dibuat
* Status = **Open**
* Notifikasi realtime ke admin/support

---

### ⭐ 5.2 Status Tiket (WAJIB AKTIF)

| Status       | Deskripsi             |
| ------------ | --------------------- |
| Open         | Tiket baru            |
| In Progress  | Sedang ditangani      |
| Waiting User | Menunggu balasan user |
| Resolved     | Masalah selesai       |
| Closed       | Tiket ditutup         |

* Status harus sinkron FE + BE + DB
* Tidak boleh status menggantung

---

### ⭐ 5.3 Prioritas Tiket

Admin/support dapat set prioritas:

* Low
* Medium
* High
* Urgent

Prioritas mempengaruhi:

* Urutan tampilan
* SLA
* Notifikasi

---

### ⭐ 5.4 Thread Percakapan Tiket

Setiap tiket memiliki **timeline chat**:

* Pesan user
* Balasan admin/support
* Timestamp
* Lampiran file
* Sistem message (status berubah)

Semua percakapan **tersimpan permanen**.

---

### ⭐ 5.5 Lampiran File

* User & admin bisa upload:

  * Gambar
  * PDF
  * Dokumen
* Validasi:

  * Max size
  * Type file
* File disimpan aman (tidak expose path)

---

### ⭐ 5.6 Assign & Eskalasi (Admin)

Admin dapat:

* Assign tiket ke staff support
* Reassign tiket
* Eskalasi prioritas

---

### ⭐ 5.7 Notifikasi Realtime (WAJIB)

Integrasi dengan sistem notifikasi existing:

* 🔔 Badge di kanan atas
* Popup saat:

  * Tiket baru dibuat
  * Ada balasan baru
  * Status berubah

Channel:

* In-app (Pusher)
* Email (Mailketing)
* Push (OneSignal)

---

### ⭐ 5.8 Hak Akses & Keamanan

* User hanya bisa melihat tiket miliknya
* Affiliate tidak bisa lihat tiket affiliate lain
* Admin bisa lihat semua
* URL tiket tidak bisa diakses tanpa hak

---

### ⭐ 5.9 Penutupan Tiket

* User bisa klik **Tutup Tiket**
* Admin bisa force close
* Tiket closed:

  * Tidak bisa dibalas
  * Tetap bisa dibaca (read-only)

---

## 6. INTEGRASI DENGAN SISTEM EXISTING

Tiket bisa dikaitkan dengan:

* User ID
* Role
* Membership ID
* Affiliate ID
* Order / Invoice ID (jika relevan)
* Kelas (jika terkait kelas)

Tujuan: support lebih cepat & tepat.

---

## 7. UI / UX REQUIREMENT

* Menggunakan **ResponsivePageWrapper**
* Tidak ada popup untuk form (pakai tab/page)
* Tampilan clean & ringan
* Bahasa Indonesia
* Indikator status jelas (warna & label)
* Search & filter tiket

---

## 8. FILTER & SEARCH (ADMIN)

Admin dapat filter:

* Status
* Prioritas
* Role user
* Kategori
* Tanggal
* Assigned staff

---

## 9. DATABASE (HIGH LEVEL)

### Table: `support_tickets`

* id
* user_id
* role
* title
* category
* priority
* status
* assigned_to
* created_at
* updated_at

### Table: `support_ticket_messages`

* id
* ticket_id
* sender_id
* sender_role
* message
* attachment
* created_at

---

## 10. FLOW UTAMA

### User

```
Dashboard → Tiket Support → Buat Tiket
→ Admin menerima notif
→ Support membalas
→ User balas
→ Status resolved
→ Close
```

### Admin

```
Dashboard → Support → Tiket
→ Assign
→ Update status
→ Reply
→ Close
```

---

## 11. METRIC & REPORT (ADMIN)

* Total tiket
* Open vs Closed
* Rata-rata response time
* Tiket per kategori
* Tiket per role
* SLA compliance

---

## 12. CHECKLIST DEVELOPER (WAJIB)

✔ Tidak duplikasi menu
✔ Semua role diuji
✔ Status & priority aktif
✔ Notifikasi realtime jalan
✔ Tidak ada tiket bocor
✔ Upload file aman
✔ Tidak popup
✔ Responsive
✔ Error handling lengkap

---

## 13. IDE PENGEMBANGAN LANJUTAN (OPSIONAL)

* Auto-reply template
* SLA timer
* Rating kepuasan
* Internal note (admin only)
* Knowledge base terhubung tiket
* AI suggestion (future)

---

## 14. KESIMPULAN

Support Ticket System ini:

* Wajib jadi pusat bantuan resmi
* Terintegrasi penuh dengan sistem kamu
* Aman & profesional
* Mudah dipakai user
* Mudah dikelola admin
* Siap di-scale



# 📘 **PRD – Supplier Registration, Onboarding & Profile System**

**Nama Modul:** Supplier Ecosystem
**Versi:** 1.2 (Final – Approved)
**Status:** Aktif (Buyer & E-commerce = Core Only)
**Layout:** ResponsivePageWrapper
**UI:** Bahasa Indonesia
**Form:** Tab / Page (❌ No popup)

---

## 1. TUJUAN SISTEM

Membangun sistem supplier yang:

* Tidak langsung aktif tanpa seleksi
* Mudah diakses (login cepat)
* Data rapi & terstruktur
* Bisa dinilai mentor
* Disetujui admin
* Siap dikembangkan ke komunitas, buyer, dan e-commerce

---

## 2. PRINSIP UTAMA (WAJIB)

1. **Daftar ≠ Onboarding**
2. Login awal **hanya autentikasi (Google)**
3. Profil & assessment **setelah login**
4. Supplier = **1 role sistem**
5. Produsen / Pabrik / Trader = **tipe supplier**
6. Mentor review → Admin approval
7. Supplier tidak bisa kontak siapa pun
8. Interaksi terbuka hanya lewat **Membership Komunitas**
9. Semua data supplier **terkunci bertahap**

---

## 3. ROLE & AKSES

### Role Sistem:

* `ROLE_SUPPLIER`
* `ROLE_MENTOR`
* `ROLE_ADMIN`
* `ROLE_AFFILIATE`
* `ROLE_MEMBER` FREE & PREMIUM

Supplier **bukan otomatis member komunitas**.

---

## 4. FLOW BESAR SISTEM (END-TO-END)

```
Landing / Affiliate Link
↓
Login / Register (Google)
↓
User dibuat + ROLE_SUPPLIER
↓
Status: Draft
↓
Redirect Wajib ke Onboarding
↓
Isi Profil Supplier
↓
Isi Assessment
↓
Submit
↓
Mentor Review
↓
Mentor Rekomendasikan
↓
Admin Setujui
↓
Supplier Aktif (Terbatas)
```

---

## 5. TAHAP 1 – REGISTRASI (LOGIN SAJA)

### Tujuan

Mempermudah entry, meningkatkan conversion.

### Yang terjadi:

* Login Google
* Sistem membuat:

  * User
  * Role = Supplier
  * Status = Draft

### Yang BELUM terjadi:

* Isi data usaha
* Isi assessment
* Tampil sebagai supplier

📌 **Supplier tidak boleh akses fitur lain sebelum onboarding selesai.**

---

## 6. TAHAP 2 – ONBOARDING SUPPLIER (WAJIB)

Setelah login pertama:

* Sistem **paksa redirect** ke halaman onboarding
* Tidak bisa lompat ke dashboard lain

---

## 7. STEP ONBOARDING 1 – PILIH TIPE SUPPLIER

### Field:

**Jenis Usaha Anda** *(radio / card)*

Pilihan:

* Produsen
* Pabrik / Manufaktur
* Trader / Exporter
* Supplier / Aggregator

📌 Disimpan sebagai:

```text
supplier_type
```

📌 Tidak bisa diubah tanpa admin.

---

## 8. STEP ONBOARDING 2 – ISI PROFIL SUPPLIER (DETAIL)

### Prinsip Profil:

* Identitas & data usaha
* Bukan penilaian
* Bisa diedit sampai mentor rekomendasi

---

### 🔹 TAB 1 — IDENTITAS USAHA (WAJIB)

Gunakan struktur **PT / CV / UD** yang sudah ada.

| Field                          | Wajib        |
| ------------------------------ | ------------ |
| Nama Usaha / Perusahaan        | ✅            |
| Bentuk Usaha (PT, CV, UD, dll) | ✅            |
| Tipe Supplier                  | 🔒 Read-only |
| Bidang Usaha                   | ✅            |
| Produk Utama                   | ✅            |
| Tahun Berdiri                  | ⬜            |

---

### 🔹 TAB 2 — ALAMAT & LOKASI

| Field                       | Wajib |
| --------------------------- | ----- |
| Alamat Lengkap              | ✅     |
| Provinsi                    | ✅     |
| Kota / Kabupaten            | ✅     |
| Kecamatan                   | ⬜     |
| Kode Pos                    | ⬜     |
| Lokasi Produksi (jika beda) | ⬜     |

📌 Dipakai untuk:

* Filter komunitas
* Future buyer matching

---

### 🔹 TAB 3 — KONTAK PERUSAHAAN

| Field          | Wajib |
| -------------- | ----- |
| Nama PIC       | ✅     |
| Jabatan PIC    | ⬜     |
| Nomor WhatsApp | ✅     |
| Email Bisnis   | ✅     |
| Website        | ⬜     |
| Sosial Media   | ⬜     |

📌 Kontak **tidak tampil publik langsung**.

---

### 🔹 TAB 4 — LEGALITAS USAHA (OPSIONAL)

| Field                | Wajib |
| -------------------- | ----- |
| NIB                  | ⬜     |
| NPWP                 | ⬜     |
| SIUP / IUI           | ⬜     |
| Sertifikasi (upload) | ⬜     |

📌 Bisa dilengkapi bertahap.

---

### 🔹 TAB 5 — PROFIL SINGKAT (BIO SUPPLIER)

| Field                   | Wajib |
| ----------------------- | ----- |
| Deskripsi Singkat Usaha | ✅     |
| Keunggulan Produk       | ⬜     |
| Unique Value            | ⬜     |

📌 Digunakan untuk **Bio Supplier Page**.

---

## 9. ATURAN EDIT PROFIL

| Status Supplier       | Edit Profil     |
| --------------------- | --------------- |
| Draft                 | ✅ Bebas         |
| Onboarding            | ✅ Bebas         |
| Waiting Review        | ⚠️ Terbatas     |
| Recommended by Mentor | ❌ Dikunci       |
| Verified              | ⚠️ Dengan audit |
| Verified + Membership | ✅ (audit log)   |

---

## 10. STEP ONBOARDING 3 – ASSESSMENT (RINGKAS)

Assessment **dipisah dari profil**
(Detail assessment ada di PRD terpisah, tapi flow-nya di sini)

* Format ABC / range
* Dinamis sesuai tipe supplier
* Pertanyaan bisa ditambah mentor
* Supplier **tidak lihat skor**

---

## 11. SUBMIT ONBOARDING

Saat klik **Submit**:

* Status → `Waiting Review`
* Profil & assessment dikunci
* Masuk antrian mentor

---

## 12. REVIEW MENTOR (RINGKAS)

Mentor:

* Melihat profil + assessment
* Memberi catatan
* Klik **Verifikasi & Rekomendasikan**

Status → `Recommended by Mentor`

---

## 13. APPROVAL ADMIN

Admin:

* Review data + catatan mentor
* Menentukan status final:

  * Verified
  * Limited
  * Suspended

---

## 14. OUTPUT AKHIR

Supplier yang lolos:

* Masuk Dashboard Supplier
* Bisa tambah produk
* Bisa punya Bio Supplier
* Bisa join Membership Komunitas

---

## 15. DATABASE (RINGKAS)

### `suppliers`

* user_id
* supplier_type
* status
* profile_json

### `supplier_profiles`

* supplier_id
* identitas
* alamat
* kontak
* legalitas
* bio

---

## 16. KESIMPULAN FINAL

✔ Daftar = login saja
✔ Onboarding = isi profil + assessment
✔ Profil = data usaha (pakai PT/CV/UD)
✔ Mentor review
✔ Admin approval
✔ Sistem rapi & scalable


