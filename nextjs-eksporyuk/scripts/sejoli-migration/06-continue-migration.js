/**
 * Continue Migration - Import Remaining Users
 * Skips duplicates based on email
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const EXPORT_DIR = path.join(__dirname, 'exports');
const BATCH_SIZE = 100;

function mapUserRole(wpRoles) {
  if (!wpRoles) return 'MEMBER_FREE';
  
  try {
    const roles = JSON.parse(wpRoles);
    const roleKeys = Object.keys(roles);
    
    if (roleKeys.includes('administrator')) return 'ADMIN';
    if (roleKeys.includes('mentor') || roleKeys.includes('teacher')) return 'MENTOR';
    if (roleKeys.includes('affiliate')) return 'AFFILIATE';
    if (roleKeys.includes('subscriber') || roleKeys.includes('member')) return 'MEMBER_PREMIUM';
  } catch (e) {
    // Invalid JSON, check string
    if (wpRoles.includes('administrator')) return 'ADMIN';
    if (wpRoles.includes('affiliate')) return 'AFFILIATE';
  }
  
  return 'MEMBER_FREE';
}

function generateUsername(email, displayName, sejoliId) {
  if (displayName && displayName !== email && displayName.length > 2) {
    const clean = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length >= 3) return clean;
  }
  const emailPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return emailPart || `user${sejoliId}`;
}

async function continueMigration() {
  console.log('🔄 CONTINUING USER MIGRATION');
  console.log('============================\n');

  try {
    // Load data
    const users = JSON.parse(
      await fs.readFile(path.join(EXPORT_DIR, 'sejoli_users.json'), 'utf-8')
    );
    
    const userMeta = JSON.parse(
      await fs.readFile(path.join(EXPORT_DIR, 'sejoli_usermeta.json'), 'utf-8')
    );

    // Build meta lookup
    const metaByUser = {};
    userMeta.forEach(meta => {
      if (!metaByUser[meta.user_id]) metaByUser[meta.user_id] = {};
      metaByUser[meta.user_id][meta.meta_key] = meta.meta_value;
    });

    console.log(`📊 Total Sejoli users: ${users.length}`);
    
    // Get existing emails
    const existingUsers = await prisma.user.findMany({
      select: { email: true }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email));
    
    console.log(`📊 Already imported: ${existingEmails.size}`);
    
    // Filter out existing
    const usersToImport = users.filter(u => !existingEmails.has(u.user_email));
    
    console.log(`📊 Remaining to import: ${usersToImport.length}\n`);

    if (usersToImport.length === 0) {
      console.log('✅ All users already imported!\n');
      return;
    }

    // Import in batches
    let imported = 0;
    let failed = 0;
    const hashedPassword = await bcrypt.hash('EksporyukMigration2025!', 10);

    for (let i = 0; i < usersToImport.length; i += BATCH_SIZE) {
      const batch = usersToImport.slice(i, i + BATCH_SIZE);
      
      console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, usersToImport.length)} of ${usersToImport.length})`);
      
      for (const sejoliUser of batch) {
        try {
          const meta = metaByUser[sejoliUser.ID] || {};
          const role = mapUserRole(meta.wp_capabilities);
          
          // Try to generate unique username
          let username = generateUsername(sejoliUser.user_email, sejoliUser.display_name, sejoliUser.ID);
          
          // Check if username exists
          const existingUsername = await prisma.user.findUnique({
            where: { username }
          });
          
          if (existingUsername) {
            username = `${username}${sejoliUser.ID}`;
          }

          // Create user
          const newUser = await prisma.user.create({
            data: {
              email: sejoliUser.user_email,
              username: username,
              password: hashedPassword,
              name: sejoliUser.display_name || username,
              role: role,
              emailVerified: true,
              whatsapp: meta.billing_phone || null,
              createdAt: new Date(sejoliUser.user_registered),
            }
          });

          // Create wallet
          await prisma.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0,
              balancePending: 0,
            }
          });

          // Create profile if needed
          if (role === 'AFFILIATE') {
            const affiliateCode = `MIGR${String(newUser.id).padStart(6, '0')}`;
            await prisma.affiliateProfile.create({
              data: {
                userId: newUser.id,
                affiliateCode: affiliateCode,
                shortLink: `https://eksporyuk.com/go/${username}`,
                commissionRate: 30,
                totalEarnings: 0,
                totalReferrals: 0,
              }
            });
          } else if (role === 'MENTOR') {
            await prisma.mentorProfile.create({
              data: {
                userId: newUser.id,
                bio: '',
                expertise: 'Export Business',
                totalStudents: 0,
                totalCourses: 0,
              }
            });
          }

          imported++;
          if (imported % 10 === 0) {
            process.stdout.write(`  ✅ ${imported}/${usersToImport.length}\r`);
          }

        } catch (error) {
          failed++;
          console.log(`  ❌ ${sejoliUser.user_email}: ${error.message}`);
        }
      }
      
      console.log(`  ✅ Batch complete: ${imported} imported, ${failed} failed`);
    }

    console.log(`\n\n🎉 MIGRATION COMPLETE!`);
    console.log('=======================');
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total in database: ${existingEmails.size + imported}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

continueMigration().catch(console.error);
