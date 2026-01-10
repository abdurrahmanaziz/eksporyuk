const fs = require('fs');
const path = require('path');

const emailLocations = [
  'src/app/api/auth/register/route.ts',
  'src/lib/auth-options.ts',
  'src/lib/email-verification.ts',
  'src/lib/integrations/mailketing.ts',
  'src/app/api/webhooks/xendit/route.ts',
  'src/app/api/cron/upgrade-reminders/route.ts',
  'src/app/api/cron/event-reminders/route.ts',
  'src/app/api/cron/check-expiring-memberships/route.ts',
  'src/app/api/admin/transactions/[id]/confirm/route.ts',
  'src/app/api/admin/users/[id]/change-role/route.ts',
  'src/app/api/admin/affiliates/payouts/[id]/approve/route.ts',
];

const templates = [];

emailLocations.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const subjectMatches = content.match(/subject:\s*['"`](.*?)['"`]/gi);
    
    if (subjectMatches) {
      subjectMatches.forEach(match => {
        const subject = match.replace(/subject:\s*['"`]/i, '').replace(/['"`].*$/, '');
        templates.push({
          file: file.replace('src/', ''),
          subject: subject
        });
      });
    }
  } catch (e) {
    // File not found or error
  }
});

console.log('\n=== EMAIL TEMPLATES DITEMUKAN ===\n');
templates.forEach((t, i) => {
  console.log(`${i + 1}. ${t.subject}`);
  console.log(`   File: ${t.file}\n`);
});

console.log(`Total: ${templates.length} email templates\n`);
