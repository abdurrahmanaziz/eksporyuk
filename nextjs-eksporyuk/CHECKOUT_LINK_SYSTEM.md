# Sistem Checkout Link

## Fitur
Setiap membership, product, dan course memiliki link checkout unik dengan slug masing-masing.

## Struktur URL
- **Format**: `/checkout/{checkoutSlug}`
- **Contoh**: 
  - `/checkout/beli-paket-lifetime`
  - `/checkout/beli-paket-starter-export`
  - `/checkout/beli-dasar-dasar-ekspor-untuk-pemula`

## Auto-Generate Slug
Saat membuat/edit item baru, sistem akan otomatis generate:
- **slug**: untuk URL salespage/detail (contoh: `paket-lifetime`)
- **checkoutSlug**: untuk URL checkout (contoh: `beli-paket-lifetime`)

Format checkoutSlug: `beli-{nama-item-dalam-slug}`

## Database Schema
Setiap model memiliki field baru:
```prisma
model Membership {
  slug          String? @unique  // untuk salespage
  checkoutSlug  String? @unique  // untuk checkout
  // ...
}

model Product {
  slug          String? @unique
  checkoutSlug  String? @unique
  // ...
}

model Course {
  slug          String? @unique
  checkoutSlug  String? @unique
  // ...
}
```

## Admin Interface
Di halaman admin membership, setiap paket menampilkan:
- **Sales Page**: Link ke salespage (jika ada)
- **Link Checkout**: Link ke checkout page dengan format `/checkout/{checkoutSlug}`

## Checkout Page Features
- Menampilkan detail item (nama, harga, fitur, durasi untuk membership)
- Form login/register untuk user baru
- Form informasi pembeli (nama, email, WhatsApp)
- Pilihan metode pembayaran (Bank Transfer, E-Wallet, QRIS)
- Input kode kupon dengan validasi
- Ringkasan harga dan total pembayaran
- Integrasi dengan Xendit untuk payment gateway

## API Endpoints

### GET /api/checkout/[slug]
Mengambil data item berdasarkan checkoutSlug
- Mencari di Membership, Product, atau Course
- Return item details dengan type

### POST /api/checkout/process
Memproses checkout dan membuat transaksi
- Validasi user session
- Validasi coupon (opsional)
- Create transaction record
- Generate Xendit invoice
- Return payment URL

## Cara Penggunaan

### 1. Generate Checkout Slug untuk Data Existing
```bash
node generate-checkout-slugs.js
```

### 2. Menambah Item Baru
Saat menambah membership/product/course baru di admin, checkoutSlug akan auto-generate dari nama item.

### 3. Copy Link Checkout
Di halaman admin, klik link checkout atau copy URL untuk dibagikan ke customer.

### 4. Customer Flow
1. Customer buka link checkout: `/checkout/beli-paket-lifetime`
2. Melihat detail paket dan harga
3. Login/Register (jika belum)
4. Isi form data diri
5. Pilih metode pembayaran
6. (Opsional) Pakai kode kupon
7. Klik "Bayar Sekarang"
8. Redirect ke Xendit payment page

## Notes
- Semua checkoutSlug harus unique
- Jika ada duplikat, sistem akan append ID di belakang
- Field checkoutSlug bersifat opsional (nullable) tapi sangat disarankan untuk diisi
- Link checkout bisa dibagikan via WhatsApp, email, atau media sosial
