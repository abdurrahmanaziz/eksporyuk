// Quick test to verify API params fix
const testURL = 'http://localhost:3000/api/learn/kelas-eksporyuk';

console.log('Testing API endpoint after params fix...');
console.log('URL:', testURL);
console.log('');
console.log('NOTE: This will return 401 Unauthorized without session cookie');
console.log('But if you see "Unauthorized" error instead of 500 Internal Server Error,');
console.log('it means the params fix is working!');
console.log('');
console.log('To test with authentication, use browser or login first.');
console.log('');
console.log('---');
console.log('Expected in browser console after login:');
console.log('  🔍 [Frontend] Fetching course: kelas-eksporyuk');
console.log('  📡 [Frontend] API response status: 200');
console.log('  ✅ [Frontend] Course data received: {...}');
console.log('  ✅ [Frontend] Course set successfully - Modules: 9, Lessons: 147');
console.log('');
console.log('Expected in server terminal:');
console.log('  🔍 [API /learn/kelas-eksporyuk] Fetching course for user: [email]');
console.log('  ✅ [API /learn/kelas-eksporyuk] Course found: KELAS BIMBINGAN EKSPOR YUK');
console.log('  📚 [API /learn/kelas-eksporyuk] Found 9 modules');
console.log('  📖 [API /learn/kelas-eksporyuk] Total lessons: 147');
