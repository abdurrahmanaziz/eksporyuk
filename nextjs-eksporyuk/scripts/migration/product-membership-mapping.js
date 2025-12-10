/**
 * MAPPING PRODUK WORDPRESS SEJOLI → MEMBERSHIP NEXT.JS
 * 
 * Format:
 * wpProductId: {
 *   name: "Nama produk di WordPress",
 *   membershipSlug: "slug membership di Next.js" atau null jika bukan membership
 *   duration: durasi dalam hari atau null untuk lifetime
 *   type: "membership" | "renewal" | "event" | "tool" | "other"
 *   commissionFlat: komisi flat dalam rupiah
 * }
 */

const PRODUCT_MEMBERSHIP_MAPPING = {
  // ===== MEMBERSHIP PRODUK - LIFETIME =====
  28: {
    name: "eksporyuk",
    membershipSlug: "lifetime",
    duration: null, // lifetime
    type: "membership",
    commissionFlat: 0
  },
  93: {
    name: "Eksporyuk Prelaunch",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 0
  },
  179: {
    name: "Kelas Eksporyuk",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 250000 // range 135k-250k, use max
  },
  300: {
    name: "Kelas Ekspor Gratis",
    membershipSlug: null, // gratis, tidak assign membership
    duration: null,
    type: "free",
    commissionFlat: 0
  },
  558: {
    name: "Kaos Eksporyuk",
    membershipSlug: null, // merchandise, bukan membership
    duration: null,
    type: "merchandise",
    commissionFlat: 0
  },
  1529: {
    name: "Kelas Donasi",
    membershipSlug: "lifetime", // donasi tapi dapat akses
    duration: null,
    type: "membership",
    commissionFlat: 0
  },
  3840: {
    name: "Bundling Kelas Ekspor + Aplikasi EYA",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 300000
  },
  4684: {
    name: "Ultah Ekspor Yuk",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 250000
  },
  6068: {
    name: "Kelas Bimbingan Ekspor Yuk",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 250000
  },
  6810: {
    name: "Promo Kemerdekaan",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 250000
  },
  11207: {
    name: "Promo Juli Happy 1-7 Juli 2024",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 300000 // range 200k-300k
  },
  13401: {
    name: "Paket Ekspor Yuk Lifetime",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 325000
  },
  15234: {
    name: "Promo Paket Lifetime THR 2025",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 210000
  },
  16956: {
    name: "Promo MEI Paket Lifetime 2025",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 210000
  },
  17920: {
    name: "Promo Lifetime Tahun Baru Islam 1447 Hijriah",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 250000
  },
  19296: {
    name: "Promo Merdeka Ke-80",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 225000
  },
  20852: {
    name: "Promo 10.10 2025",
    membershipSlug: "lifetime",
    duration: null,
    type: "membership",
    commissionFlat: 280000 // range 200k-280k
  },
  
  // ===== MEMBERSHIP PRODUK - 12 BULAN =====
  8683: {
    name: "Kelas Ekspor Yuk 12 Bulan",
    membershipSlug: "12-bulan",
    duration: 365,
    type: "membership",
    commissionFlat: 300000
  },
  13399: {
    name: "Paket Ekspor Yuk 12 Bulan",
    membershipSlug: "12-bulan",
    duration: 365,
    type: "membership",
    commissionFlat: 250000
  },
  
  // ===== MEMBERSHIP PRODUK - 6 BULAN =====
  8684: {
    name: "Kelas Ekspor Yuk 6 Bulan",
    membershipSlug: "6-bulan",
    duration: 180,
    type: "membership",
    commissionFlat: 250000
  },
  13400: {
    name: "Paket Ekspor Yuk 6 Bulan",
    membershipSlug: "6-bulan",
    duration: 180,
    type: "membership",
    commissionFlat: 200000
  },
  
  // ===== RENEWAL PRODUK (perpanjangan membership existing) =====
  8910: {
    name: "Re Kelas Ekspor Lifetime",
    membershipSlug: "lifetime",
    duration: null,
    type: "renewal",
    commissionFlat: 0 // no commission for renewal
  },
  8914: {
    name: "Re Kelas 6 Bulan Ekspor Yuk",
    membershipSlug: "6-bulan",
    duration: 180,
    type: "renewal",
    commissionFlat: 0
  },
  8915: {
    name: "Re Kelas 12 Bulan Ekspor Yuk",
    membershipSlug: "12-bulan",
    duration: 365,
    type: "renewal",
    commissionFlat: 0
  },
  
  // ===== EVENT/WEBINAR (tidak dapat membership) =====
  397: { name: "Webinar Juni 2022", membershipSlug: null, type: "event", commissionFlat: 0 },
  488: { name: "Webinar Juli 2022", membershipSlug: null, type: "event", commissionFlat: 0 },
  12994: { name: "Kopdar Akbar Ekspor Yuk Feb 2025", membershipSlug: null, type: "event", commissionFlat: 50000 },
  13039: { name: "Kopdar Akbar Ekspor Yuk Feb 2025 #2", membershipSlug: null, type: "event", commissionFlat: 50000 },
  13045: { name: "Pembelian Tiket Untuk 2 Peserta", membershipSlug: null, type: "event", commissionFlat: 50000 },
  16130: { name: "Zoom Ekspor 9 Mei 2025", membershipSlug: null, type: "event", commissionFlat: 0 },
  16860: { name: "Workshop Offline Sukabumi 14 Juni 2025", membershipSlug: null, type: "event", commissionFlat: 0 },
  16963: { name: "Zoom Ekspor 30 Mei 2025", membershipSlug: null, type: "event", commissionFlat: 0 },
  17227: { name: "Kopdar Semarang Jawa Tengah 10 Juni 2025", membershipSlug: null, type: "event", commissionFlat: 0 },
  17322: { name: "Zoom Ekspor 10 Juni 2025", membershipSlug: null, type: "event", commissionFlat: 0 },
  17767: { name: "Zoom Ekspor 27 Juni 2025", membershipSlug: null, type: "event", commissionFlat: 0 },
  18358: { name: "Zoom Ekspor 11 Juli 2025", membershipSlug: null, type: "event", commissionFlat: 0 },
  18528: { name: "Zoom Ekspor 30 Juli 2025", membershipSlug: null, type: "event", commissionFlat: 20000 },
  18705: { name: "Kopdar Depok 10 Agustus 2025", membershipSlug: null, type: "event", commissionFlat: 0 },
  18893: { name: "DP Trade Expo Indonesia", membershipSlug: null, type: "event", commissionFlat: 0 },
  19042: { name: "Webinar Ekspor 29 Agustus 2025", membershipSlug: null, type: "event", commissionFlat: 50000 },
  20130: { name: "Webinar Ekspor 30 Sept 2025", membershipSlug: null, type: "event", commissionFlat: 50000 },
  20336: { name: "Titip Barang TEI 2025", membershipSlug: null, type: "event", commissionFlat: 100000 },
  21476: { name: "Webinar Ekspor 28 Nov 2025", membershipSlug: null, type: "event", commissionFlat: 50000 },
  
  // ===== TOOL/APLIKASI (EYA - tidak dapat membership) =====
  2910: { name: "Aplikasi EYA", membershipSlug: null, type: "tool", commissionFlat: 0 },
  3764: { name: "Ekspor Yuk Automation", membershipSlug: null, type: "tool", commissionFlat: 75000 },
  4220: { name: "EYA DEKSTOP", membershipSlug: null, type: "tool", commissionFlat: 0 },
  8686: { name: "Ekspor Yuk Automation EYA", membershipSlug: null, type: "tool", commissionFlat: 85000 },
  
  // ===== JASA (tidak dapat membership) =====
  5928: { name: "Jasa Website Ekspor Hemat", membershipSlug: null, type: "service", commissionFlat: 0 },
  5932: { name: "Legalitas Ekspor", membershipSlug: null, type: "service", commissionFlat: 20000 },
  5935: { name: "Jasa Website Ekspor Bisnis", membershipSlug: null, type: "service", commissionFlat: 150000 },
  16581: { name: "Jasa Company Profile", membershipSlug: null, type: "service", commissionFlat: 0 },
  16587: { name: "Jasa Katalog Produk", membershipSlug: null, type: "service", commissionFlat: 30000 },
  16592: { name: "Bundling Katalog Produk dan Company Profil", membershipSlug: null, type: "service", commissionFlat: 0 },
  
  // ===== OTHER =====
  16826: { name: "Paket Umroh 1 Bulan + Cari Buyer Ekspor", membershipSlug: null, type: "other", commissionFlat: 0 },
};

// Helper functions
function getMembershipForProduct(wpProductId) {
  return PRODUCT_MEMBERSHIP_MAPPING[wpProductId] || null;
}

function isMembershipProduct(wpProductId) {
  const mapping = PRODUCT_MEMBERSHIP_MAPPING[wpProductId];
  return mapping && (mapping.type === 'membership' || mapping.type === 'renewal');
}

function getCommissionForProduct(wpProductId) {
  const mapping = PRODUCT_MEMBERSHIP_MAPPING[wpProductId];
  return mapping ? mapping.commissionFlat : 0;
}

// Membership slug to Next.js membership ID mapping (will be populated at runtime)
const MEMBERSHIP_SLUG_MAP = {
  'lifetime': null, // Will be populated with actual ID
  '12-bulan': null,
  '6-bulan': null,
  '3-bulan': null,
  '1-bulan': null,
};

module.exports = {
  PRODUCT_MEMBERSHIP_MAPPING,
  MEMBERSHIP_SLUG_MAP,
  getMembershipForProduct,
  isMembershipProduct,
  getCommissionForProduct
};
