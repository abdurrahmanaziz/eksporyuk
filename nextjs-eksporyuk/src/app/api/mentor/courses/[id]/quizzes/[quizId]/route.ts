import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// Helper function to check course ownership for mentor
async function checkCourseAccess(userId: string, userRole: string, courseId: string) {
  if (userRole === 'ADMIN') return { allowed: true }
  
  const mentorProfile = await prisma.mentor.findUnique({
    where: { userId }
  })
  
  if (!mentorProfile) return { allowed: false }
  
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { mentorId: true }
  })
  
  if (!course) return { allowed: false }
  
  return { allowed: course.mentorId === mentorProfile.id }
}

// GET single quiz
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, quizId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only view your own course quizzes' }, { status: 403 })
      }
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!quiz || quiz.courseId !== courseId) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

// PUT update quiz
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, quizId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only edit your own course quizzes' }, { status: 403 })
      }
    }
    
    const body = await req.json()
    const { 
      title, 
      description, 
      passingScore, 
      timeLimit, 
      maxAttempts,
      shuffleQuestions,
      shuffleAnswers,
      showResults,
      isActive
    } = body

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.courseId !== courseId) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        title: title !== undefined ? title : quiz.title,
        description: description !== undefined ? description : quiz.description,
        passingScore: passingScore !== undefined ? passingScore : quiz.passingScore,
        timeLimit: timeLimit !== undefined ? timeLimit : quiz.timeLimit,
        maxAttempts: maxAttempts !== undefined ? maxAttempts : quiz.maxAttempts,
        shuffleQuestions: shuffleQuestions !== undefined ? shuffleQuestions : quiz.shuffleQuestions,
        shuffleAnswers: shuffleAnswers !== undefined ? shuffleAnswers : quiz.shuffleAnswers,
        showResults: showResults !== undefined ? showResults : quiz.showResults,
        isActive: isActive !== undefined ? isActive : quiz.isActive
      }
    })

    return NextResponse.json({
      message: 'Quiz updated successfully',
      quiz: updatedQuiz
    })
  } catch (error) {
    console.error('Update quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    )
  }
}

// DELETE quiz
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MENTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: courseId, quizId } = await params
    
    // Check access for mentor
    if (user.role === 'MENTOR') {
      const access = await checkCourseAccess(session.user.id, user.role, courseId)
      if (!access.allowed) {
        return NextResponse.json({ error: 'You can only delete your own course quizzes' }, { status: 403 })
      }
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz || quiz.courseId !== courseId) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Delete quiz (will cascade delete questions and attempts)
    await prisma.quiz.delete({
      where: { id: quizId }
    })

    return NextResponse.json({
      message: 'Quiz deleted successfully'
    })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    )
  }
}
