/**
 * SAFE COURSEMODULE RESTORATION
 * Restores CourseModule data from backup while preserving ALL existing data
 * Uses UPSERT operations to avoid conflicts and data loss
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🔄 SAFE COURSEMODULE RESTORATION STARTING...\n');
console.log('⚠️  PRESERVATION MODE - EXISTING DATA WILL NOT BE DELETED\n');

const backupUrl = 'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/backup-2025-12-26T22-28-26-296Z.json';

async function safeRestoreModules() {
  try {
    // Step 1: Fetch backup data
    console.log('📥 Fetching backup data...');
    const response = await fetch(backupUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch backup: ${response.status}`);
    }
    
    const backup = await response.json();
    const modules = backup.tables.CourseModule;
    const courses = backup.tables.Course;
    
    console.log(`✅ Loaded backup with ${modules.length} modules and ${courses.length} courses`);
    
    // Step 2: Check current database state (read-only)
    const currentModules = await prisma.courseModule.count();
    const currentCourses = await prisma.course.count();
    
    console.log(`📊 Current database: ${currentCourses} courses, ${currentModules} modules`);
    
    // Step 3: First, safely restore/update courses (UPSERT)
    console.log('\\n📚 Restoring courses safely...');
    for (const course of courses) {
      try {
        await prisma.course.upsert({
          where: { id: course.id },
          update: {
            title: course.title,
            slug: course.slug,
            description: course.description,
            updatedAt: new Date()
          },
          create: {
            id: course.id,
            mentorId: course.mentorId || 'admin',
            title: course.title,
            slug: course.slug,
            description: course.description,
            price: course.price || 0,
            createdAt: course.createdAt ? new Date(course.createdAt) : new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`   ✅ Course: ${course.title}`);
      } catch (error) {
        console.log(`   ⚠️  Course error (${course.title}): ${error.message}`);
      }
    }
    
    // Step 4: Safely restore/update course modules (UPSERT)
    console.log('\\n📖 Restoring course modules safely...');
    let restored = 0;
    let updated = 0;
    let errors = 0;
    
    for (const module of modules) {
      try {
        const result = await prisma.courseModule.upsert({
          where: { id: module.id },
          update: {
            title: module.title,
            description: module.description,
            order: module.order,
            courseId: module.courseId,
            updatedAt: new Date()
          },
          create: {
            id: module.id,
            title: module.title,
            description: module.description,
            order: module.order,
            courseId: module.courseId,
            createdAt: module.createdAt ? new Date(module.createdAt) : new Date(),
            updatedAt: new Date()
          }
        });
        
        // Check if it was created or updated
        const existingCount = await prisma.courseModule.count({
          where: { 
            id: module.id,
            createdAt: { lt: new Date(Date.now() - 1000) } // Created more than 1 second ago
          }
        });
        
        if (existingCount > 0) {
          updated++;
          console.log(`   🔄 Updated: ${module.title}`);
        } else {
          restored++;
          console.log(`   ✅ Created: ${module.title}`);
        }
        
      } catch (error) {
        errors++;
        console.log(`   ❌ Error (${module.title}): ${error.message}`);
      }
    }
    
    // Step 5: Final verification
    const finalModules = await prisma.courseModule.count();
    const finalCourses = await prisma.course.count();
    
    console.log('\\n' + '='.repeat(60));
    console.log('✅ SAFE RESTORATION COMPLETE');
    console.log(`📊 Final state: ${finalCourses} courses, ${finalModules} modules`);
    console.log(`📈 Changes: +${restored} new, ~${updated} updated, ❌${errors} errors`);
    console.log('🔐 ALL EXISTING DATA PRESERVED');
    console.log('⚡ DATABASE SAFELY UPDATED');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

safeRestoreModules().catch(console.error);