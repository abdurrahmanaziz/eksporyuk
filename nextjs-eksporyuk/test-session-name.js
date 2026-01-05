// Test script untuk mengecek apakah session sudah menggunakan nama terbaru
const { getServerSession } = require('next-auth/next')

console.log("Script test session dibuat...")
console.log("Untuk test session, user perlu login ulang untuk mendapatkan token baru")
console.log("Atau website perlu restart untuk memuat auth-options.ts yang baru")