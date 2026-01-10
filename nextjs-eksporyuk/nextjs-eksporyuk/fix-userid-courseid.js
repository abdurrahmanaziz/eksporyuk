const fs = require('fs');
const path = require('path');

// Files that need fixing
const files = [
  'src/app/api/user/membership/courses/route.ts',
  'src/app/api/courses/[slug]/progress/route.ts',
  'src/app/api/courses/[slug]/enroll-free/route.ts',
  'src/app/api/quizzes/attempts/[id]/submit/route.ts',
  'src/app/api/course-reviews-by-id/[courseId]/route.ts',
  'src/app/api/progress/lesson/route.ts',
  'src/app/api/progress/quizzes/[id]/complete/route.ts',
  'src/app/api/progress/lessons/[id]/complete/route.ts',
  'src/app/api/affiliate/training/enroll/route.ts',
  'src/app/api/progress/route.ts',
  'src/app/api/certificates/route.ts',
  'src/app/api/groups/[slug]/courses/route.ts',
  'src/app/api/groups/[slug]/members/route.ts',
  'src/app/api/admin/enrollments/route.ts',
  'src/app/api/admin/certificates/issue/route.ts',
  'src/app/api/admin/groups/[slug]/courses/route.ts',
  'src/app/api/quiz/[quizId]/start/route.ts',
  'src/app/api/quiz/[quizId]/submit/route.ts',
  'src/app/api/student/certificates/[courseId]/route.ts',
  'src/app/api/student/courses/[slug]/route.ts',
  'src/app/api/student/enrollments/route.ts',
  'src/app/api/student/courses/[slug]/lessons/[lessonId]/access/route.ts',
  'src/app/api/student/courses/[slug]/lessons/[lessonId]/complete/route.ts',
  'src/app/api/enrollment/auto-enroll/route.ts',
  'src/app/api/discussions/[id]/replies/route.ts',
  'src/app/api/learn/[slug]/progress/route.ts'
];

let fixedCount = 0;
let totalReplacements = 0;

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Pattern 1: findUnique with userId_courseId (most common)
    content = content.replace(
      /(\w+\.(?:courseEnrollment|userCourseProgress|courseConsent))\.findUnique\(\{\s*where:\s*\{\s*userId_courseId:\s*\{([^}]+)\}\s*\}/gs,
      (match, model, params) => {
        const paramLines = params.split('\n').map(line => line.trim()).filter(Boolean);
        const formattedParams = paramLines.map(line => `        ${line}`).join('\n');
        return `${model}.findFirst({\n      where: {\n${formattedParams}\n      }`;
      }
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const count = (originalContent.match(/userId_courseId/g) || []).length;
      totalReplacements += count;
      fixedCount++;
      console.log(`✅ Fixed ${count} instances in ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Fixed ${totalReplacements} instances in ${fixedCount} files`);
