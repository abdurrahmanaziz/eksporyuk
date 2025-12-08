console.log('=== DEBUG COURSE GRATIS FUNCTIONALITY ===\n')

// Test specific course gratis
const testCourse = {
  slug: 'dasar-dasar-ekspor-untuk-pemula',
  expectedPrice: 0,
  name: 'Dasar-dasar Ekspor untuk Pemula'
}

console.log('🧪 Testing Course:', testCourse.name)
console.log('📱 URL Salespage:', `http://localhost:3000/course/${testCourse.slug}`)
console.log('💳 URL Checkout:', `http://localhost:3000/checkout/course/${testCourse.slug}`)
console.log('')

// Check what errors might be happening
console.log('🔍 Potential Issues to Check:')
console.log('')

console.log('1. 📊 Database Schema Check:')
console.log('   - CourseEnrollment table exists?')
console.log('   - Fields: id, courseId, userId, progress, completed, transactionId')
console.log('   - NO isActive field (removed from update)')
console.log('')

console.log('2. 🔧 API Endpoint Check:')
console.log('   - POST /api/checkout')
console.log('   - Supports paymentMethod: "free"')
console.log('   - Handles courseId parameter')
console.log('   - Returns success for free courses')
console.log('')

console.log('3. 🎯 NextAuth Session Check:')
console.log('   - useSession() returns valid session?')
console.log('   - session?.user exists?')
console.log('   - Auto-fill form fields working?')
console.log('')

console.log('4. 🚀 Course Data Check:')
console.log('   - Course exists in database?')
console.log('   - course.price === 0?')
console.log('   - course.slug matches URL?')
console.log('')

console.log('🛠️ Steps to Debug:')
console.log('1. Open browser dev tools (F12)')
console.log('2. Go to: http://localhost:3000/course/dasar-dasar-ekspor-untuk-pemula')
console.log('3. Check console for errors')
console.log('4. Check Network tab for API calls')
console.log('5. Try clicking "Daftar Gratis" button')
console.log('6. Monitor what happens')
console.log('')

console.log('🔍 Expected Flow:')
console.log('WITHOUT LOGIN:')
console.log('  Click "Login & Daftar Gratis" → Redirect to checkout page')
console.log('  Fill form → Submit → API call with paymentMethod: "free"')
console.log('  → Enrollment created → Redirect to dashboard')
console.log('')

console.log('WITH LOGIN:')
console.log('  Click "Daftar Gratis Sekarang" → Direct API call')
console.log('  → Auto enrollment → Redirect to dashboard')
console.log('')

console.log('📝 Check API Response:')
console.log('Should return:')
console.log('{')
console.log('  "success": true,')
console.log('  "transactionId": "...",')
console.log('  "amount": 0,')
console.log('  "status": "SUCCESS",')
console.log('  "type": "free_enrollment",')
console.log('  "message": "Pendaftaran kursus gratis berhasil!"')
console.log('}')
console.log('')

console.log('⚠️  Common Issues:')
console.log('1. Session not loaded yet (status: "loading")')
console.log('2. Course data not fetched properly')
console.log('3. API authentication issues')
console.log('4. Database connection problems')
console.log('5. Incorrect API payload structure')
console.log('')

console.log('Ready for manual testing! 🚀')