import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ResponsivePageWrapper from '@/components/layout/ResponsivePageWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function MentorCourseStudentsPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Get course with students
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!course) {
    redirect('/mentor/courses')
  }

  // Check permission - mentor must own the course, admin can access any
  if (course.mentorId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/mentor/courses')
  }

  // Get progress data separately
  const progressData = await prisma.userCourseProgress.findMany({
    where: {
      courseId: course.id
    }
  })

  // Map progress to enrollments
  const progressMap = new Map(progressData.map(p => [p.userId, p]))

  // Calculate student stats
  const students = course.enrollments.map(enrollment => {
    const progress = progressMap.get(enrollment.userId)
    
    let status: 'completed' | 'active' | 'inactive' = 'inactive'
    if (progress?.isCompleted) {
      status = 'completed'
    } else if (progress?.hasAccess) {
      const daysSinceAccess = progress.lastAccessedAt
        ? Math.floor((Date.now() - new Date(progress.lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999
      status = daysSinceAccess <= 7 ? 'active' : 'inactive'
    }

    return {
      ...enrollment,
      status,
      progress: progress?.progress || 0,
      lastAccessed: progress?.lastAccessedAt,
      hasAccess: progress?.hasAccess || false
    }
  })

  const activeStudents = students.filter(s => s.status === 'active').length
  const completedStudents = students.filter(s => s.status === 'completed').length
  const inactiveStudents = students.filter(s => s.status === 'inactive').length

  return (
    <ResponsivePageWrapper>
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/mentor/courses">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-gray-600 mt-1">Student Progress & Enrollment</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{students.length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
            <div className="text-sm text-gray-600">Active (7 days)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{completedStudents}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{inactiveStudents}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No students enrolled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Student</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Progress</th>
                    <th className="text-left py-3 px-2">Last Accessed</th>
                    <th className="text-left py-3 px-2">Enrolled</th>
                    <th className="text-right py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{student.user.name}</div>
                            <div className="text-sm text-gray-600">{student.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={
                            student.status === 'completed'
                              ? 'default'
                              : student.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            student.status === 'completed'
                              ? 'bg-blue-500'
                              : student.status === 'active'
                              ? 'bg-green-500'
                              : ''
                          }
                        >
                          {student.status === 'completed'
                            ? 'Completed'
                            : student.status === 'active'
                            ? 'Active'
                            : 'Inactive'}
                        </Badge>
                        {!student.hasAccess && (
                          <Badge variant="destructive" className="ml-2">No Access</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {student.lastAccessed
                          ? new Date(student.lastAccessed).toLocaleDateString('id-ID')
                          : 'Never'}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {new Date(student.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link href={`/mentor/courses/${course.id}/students/${student.userId}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ResponsivePageWrapper>
  )
}
