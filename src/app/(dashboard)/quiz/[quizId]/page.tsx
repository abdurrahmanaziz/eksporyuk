import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import QuizInterface from '@/components/quiz/QuizInterface'
import { Card, CardContent } from '@/components/ui/card'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'

interface PageProps {
  params: {
    quizId: string
  }
}

export default async function QuizTakePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: true
            }
          }
        }
      }
    }
  })

  if (!quiz) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Quiz not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const course = quiz.lesson?.module?.course

  // Check enrollment
  if (course) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id
        }
      }
    })

    if (!enrollment) {
      redirect(`/courses/${course.slug}`)
    }
  }

  return (
    <ResponsivePageWrapper>
      <div className="container mx-auto py-8">
        <QuizInterface quizId={params.quizId} />
      </div>
    </ResponsivePageWrapper>
  )
}
