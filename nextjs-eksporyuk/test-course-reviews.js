const fs = require('fs');
const path = require('path');

console.log('🧪 Course Review & Rating System - Comprehensive Test\n');

let passed = 0;
let failed = 0;
let warnings = 0;

function log(message, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  console.log(`${icons[type]} ${message}`);
}

function section(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${title}`);
  console.log('='.repeat(60));
}

// Test 1: Check Prisma Schema
section('1. Database Schema Validation');
try {
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const tests = [
    { name: 'CourseReview model exists', pattern: /model CourseReview \{/ },
    { name: 'CourseReviewHelpful model exists', pattern: /model CourseReviewHelpful \{/ },
    { name: 'CourseReview has rating field', pattern: /rating\s+Int/ },
    { name: 'CourseReview has review field', pattern: /review\s+String/ },
    { name: 'CourseReview has isVerified field', pattern: /isVerified\s+Boolean/ },
    { name: 'CourseReview has isApproved field', pattern: /isApproved\s+Boolean/ },
    { name: 'CourseReview has helpfulCount field', pattern: /helpfulCount\s+Int/ },
    { name: 'CourseReview unique constraint exists', pattern: /@@unique\(\[userId, courseId\]\)/ },
    { name: 'CourseReview relations defined', pattern: /course\s+Course.*@relation\("CourseReviews"/ },
    { name: 'User has courseReviews relation', pattern: /courseReviews\s+CourseReview\[\].*@relation\("CourseReviews"\)/ },
    { name: 'Course has reviews relation', pattern: /reviews\s+CourseReview\[\].*@relation\("CourseReviews"\)/ }
  ];
  
  tests.forEach(test => {
    if (test.pattern.test(schema)) {
      log(test.name, 'success');
      passed++;
    } else {
      log(test.name, 'error');
      failed++;
    }
  });
} catch (error) {
  log('Failed to read schema file', 'error');
  failed++;
}

// Test 2: Check API Endpoints
section('2. API Endpoints Validation');
const apiTests = [
  { 
    name: 'Submit review endpoint (POST)', 
    path: 'src/app/api/courses/[id]/reviews/route.ts',
    pattern: /export async function POST/
  },
  { 
    name: 'Get reviews endpoint (GET)', 
    path: 'src/app/api/courses/[id]/reviews/route.ts',
    pattern: /export async function GET/
  },
  { 
    name: 'Helpful vote endpoint', 
    path: 'src/app/api/courses/reviews/[reviewId]/helpful/route.ts',
    pattern: /export async function POST/
  },
  { 
    name: 'Admin moderate endpoint (PUT)', 
    path: 'src/app/api/admin/course-reviews/[id]/route.ts',
    pattern: /export async function PUT/
  },
  { 
    name: 'Admin delete endpoint (DELETE)', 
    path: 'src/app/api/admin/course-reviews/[id]/route.ts',
    pattern: /export async function DELETE/
  },
  { 
    name: 'Admin list reviews endpoint', 
    path: 'src/app/api/admin/course-reviews/route.ts',
    pattern: /export async function GET/
  }
];

apiTests.forEach(test => {
  try {
    const filePath = path.join(process.cwd(), test.path);
    const content = fs.readFileSync(filePath, 'utf8');
    if (test.pattern.test(content)) {
      log(test.name, 'success');
      passed++;
    } else {
      log(test.name, 'error');
      failed++;
    }
  } catch (error) {
    log(`${test.name} - File not found`, 'error');
    failed++;
  }
});

// Test 3: Check Rating Calculation
section('3. Rating Calculation Logic');
try {
  const submitPath = path.join(process.cwd(), 'src/app/api/courses/[id]/reviews/route.ts');
  const submitContent = fs.readFileSync(submitPath, 'utf8');
  
  const ratingTests = [
    { name: 'updateCourseRating function exists', pattern: /async function updateCourseRating/ },
    { name: 'Aggregate rating calculation', pattern: /_avg:.*rating/ },
    { name: 'Course rating update', pattern: /course\.update.*rating/ },
    { name: 'Called after review submission', pattern: /await updateCourseRating\(/ }
  ];
  
  ratingTests.forEach(test => {
    if (test.pattern.test(submitContent)) {
      log(test.name, 'success');
      passed++;
    } else {
      log(test.name, 'error');
      failed++;
    }
  });
} catch (error) {
  log('Rating calculation check failed', 'error');
  failed++;
}

// Test 4: Check UI Components
section('4. UI Components Validation');
try {
  const uiPath = path.join(process.cwd(), 'src/app/(dashboard)/learn/[slug]/page.tsx');
  const uiContent = fs.readFileSync(uiPath, 'utf8');
  
  const uiTests = [
    { name: 'CourseReview type defined', pattern: /type CourseReview/ },
    { name: 'ReviewStats type defined', pattern: /type ReviewStats/ },
    { name: 'Reviews state', pattern: /useState<CourseReview\[\]>/ },
    { name: 'ReviewStats state', pattern: /useState<ReviewStats/ },
    { name: 'Submit review function', pattern: /handleSubmitReview/ },
    { name: 'Helpful vote function', pattern: /handleHelpfulVote/ },
    { name: 'Fetch reviews function', pattern: /fetchReviews/ },
    { name: 'Reviews tab', pattern: /<TabsTrigger value="reviews">/ },
    { name: 'Star rating selector', pattern: /Star.*fill-yellow-400/ },
    { name: 'Review form textarea', pattern: /reviewText/ },
    { name: 'Review list display', pattern: /reviews\.map.*review/ }
  ];
  
  uiTests.forEach(test => {
    if (test.pattern.test(uiContent)) {
      log(test.name, 'success');
      passed++;
    } else {
      log(test.name, 'error');
      failed++;
    }
  });
} catch (error) {
  log('UI component check failed', 'error');
  failed++;
}

// Test 5: Check Admin Page
section('5. Admin Page Validation');
try {
  const adminPath = path.join(process.cwd(), 'src/app/(dashboard)/admin/course-reviews/page.tsx');
  const adminContent = fs.readFileSync(adminPath, 'utf8');
  
  const adminTests = [
    { name: 'Admin page exists', pattern: /AdminCourseReviewsPage/ },
    { name: 'Reviews list', pattern: /reviews\.map/ },
    { name: 'Stats cards', pattern: /stats\.total.*stats\.approved.*stats\.pending/ },
    { name: 'Filter by status', pattern: /filterStatus/ },
    { name: 'Filter by rating', pattern: /filterRating/ },
    { name: 'Search functionality', pattern: /searchQuery/ },
    { name: 'Approve action', pattern: /handleModerate.*approve/ },
    { name: 'Reject action', pattern: /handleModerate.*reject/ },
    { name: 'Delete action', pattern: /handleDelete/ },
    { name: 'Pagination', pattern: /totalPages/ }
  ];
  
  adminTests.forEach(test => {
    if (test.pattern.test(adminContent)) {
      log(test.name, 'success');
      passed++;
    } else {
      log(test.name, 'error');
      failed++;
    }
  });
} catch (error) {
  log('Admin page check failed', 'error');
  failed++;
}

// Test 6: Check Sidebar Menu
section('6. Navigation Menu Validation');
try {
  const sidebarPath = path.join(process.cwd(), 'src/components/layout/DashboardSidebar.tsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  
  if (sidebarContent.includes("Reviews Kursus") && sidebarContent.includes("/admin/course-reviews")) {
    log('Course Reviews menu item added', 'success');
    passed++;
  } else {
    log('Course Reviews menu item not found', 'error');
    failed++;
  }
  
  if (sidebarContent.includes('Star') && sidebarContent.includes('lucide-react')) {
    log('Star icon imported', 'success');
    passed++;
  } else {
    log('Star icon not properly imported', 'warning');
    warnings++;
  }
} catch (error) {
  log('Sidebar check failed', 'error');
  failed++;
}

// Test 7: Check Security Features
section('7. Security & Validation');
try {
  const submitPath = path.join(process.cwd(), 'src/app/api/courses/[id]/reviews/route.ts');
  const submitContent = fs.readFileSync(submitPath, 'utf8');
  
  const securityTests = [
    { name: 'Auth check', pattern: /getServerSession/ },
    { name: 'Enrollment validation', pattern: /courseEnrollment.*findUnique/ },
    { name: 'Rating validation (1-5)', pattern: /rating < 1 \|\| rating > 5/ },
    { name: 'Review text validation', pattern: /review\.trim\(\)\.length < 10/ },
    { name: 'Duplicate review check', pattern: /existingReview/ },
    { name: 'Auto-verified on completion', pattern: /isVerified: enrollment\.completed/ },
    { name: 'Notification to mentor', pattern: /notification.*create.*PRODUCT_REVIEW/ },
    { name: 'Activity logging', pattern: /activityLog.*create.*COURSE_REVIEW/ }
  ];
  
  securityTests.forEach(test => {
    if (test.pattern.test(submitContent)) {
      log(test.name, 'success');
      passed++;
    } else {
      log(test.name, 'warning');
      warnings++;
    }
  });
} catch (error) {
  log('Security check failed', 'error');
  failed++;
}

// Test 8: Check Helpful Vote System
section('8. Helpful Vote System');
try {
  const helpfulPath = path.join(process.cwd(), 'src/app/api/courses/reviews/[reviewId]/helpful/route.ts');
  const helpfulContent = fs.readFileSync(helpfulPath, 'utf8');
  
  const helpfulTests = [
    { name: 'Helpful vote endpoint exists', pattern: /export async function POST/ },
    { name: 'Toggle vote functionality', pattern: /existingVote/ },
    { name: 'Increment helpful count', pattern: /helpfulCount.*increment/ },
    { name: 'Decrement helpful count', pattern: /helpfulCount.*decrement/ },
    { name: 'Unique vote constraint', pattern: /reviewId_userId/ }
  ];
  
  helpfulTests.forEach(test => {
    if (test.pattern.test(helpfulContent)) {
      log(test.name, 'success');
      passed++;
    } else {
      log(test.name, 'error');
      failed++;
    }
  });
} catch (error) {
  log('Helpful vote check failed', 'error');
  failed++;
}

// Final Summary
section('Final Summary');
console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`\n📊 Total Tests: ${passed + failed + warnings}`);

if (failed === 0) {
  console.log('\n🎉 All critical tests passed! Course Review & Rating System is ready!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Run: npx prisma db push (if not done)');
  console.log('   2. Test in browser: /learn/[course-slug]');
  console.log('   3. Test admin page: /admin/course-reviews');
  console.log('   4. Submit a test review');
  console.log('   5. Test helpful vote functionality');
  console.log('   6. Test admin moderation');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
}

console.log('\n' + '='.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
