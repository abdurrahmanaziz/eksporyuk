// SUPER SIMPLE API ROUTE - Copy this to src/app/api/test-learn/route.ts to test
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test API called')
    
    // 1. Test session
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('❌ No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ Session OK:', session.user?.email)
    
    // 2. Test prisma connection
    const course = await prisma.course.findFirst({
      where: { slug: 'kelas-eksporyuk' }
    })
    
    if (!course) {
      console.log('❌ Course not found')
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    console.log('✅ Course found:', course.title)
    
    // 3. Get modules
    const modules = await prisma.courseModule.findMany({
      where: { courseId: course.id }
    })
    console.log('✅ Modules:', modules.length)
    
    // 4. Get lesson count
    let totalLessons = 0
    for (const mod of modules) {
      const lessons = await prisma.courseLesson.findMany({
        where: { moduleId: mod.id }
      })
      totalLessons += lessons.length
    }
    console.log('✅ Total lessons:', totalLessons)
    
    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug
      },
      modulesCount: modules.length,
      lessonsCount: totalLessons,
      user: session.user?.email
    })
    
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
