'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Play, 
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface GroupCoursesProps {
  groupId: string
}

export default function GroupCourses({ groupId }: GroupCoursesProps) {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [groupId])

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/courses`)
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Fetch courses error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Belum ada kursus tersedia</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">
                  {course.title}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  oleh {course.mentor?.name}
                </p>
              </div>
              {course.isEnrolled && course.userProgress === 100 && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Selesai
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {course.description}
              </p>
            )}

            {/* Course Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {course._count.modules} Modul
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {course._count.enrollments} Siswa
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {course.duration || 'Fleksibel'}
              </span>
            </div>

            {/* Progress Bar (if enrolled) */}
            {course.isEnrolled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progres Anda</span>
                  <span className="font-semibold text-blue-600">
                    {course.userProgress}%
                  </span>
                </div>
                <Progress value={course.userProgress} className="h-2" />
              </div>
            )}

            {/* Action Button */}
            <Link href={`/courses/${course.id}`}>
              <Button className="w-full">
                {course.isEnrolled ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {course.userProgress > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Lihat Detail Kursus
                  </>
                )}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
