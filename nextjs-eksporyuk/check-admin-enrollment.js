const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAdminEnrollment() {
  try {
    console.log('🔍 Memeriksa akses kursus untuk ADMIN...\n')

    // 1. Cari semua admin
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log(`📊 Ditemukan ${admins.length} admin:\n`)
    admins.forEach((admin, idx) => {
      console.log(`${idx + 1}. ${admin.name} (${admin.email})`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   ID: ${admin.id}\n`)
    })

    // 2. Cek enrollment untuk setiap admin
    console.log('\n📚 Mengecek enrollment kursus untuk setiap admin:\n')
    
    for (const admin of admins) {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          userId: admin.id
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true
            }
          }
        }
      })

      console.log(`\n👤 ${admin.name} (${admin.email}):`)
      if (enrollments.length === 0) {
        console.log('   ❌ TIDAK ADA kursus yang dienroll')
      } else {
        console.log(`   ✅ Terdenroll di ${enrollments.length} kursus:`)
        enrollments.forEach((enroll, idx) => {
          console.log(`   ${idx + 1}. ${enroll.course.title}`)
          console.log(`      Slug: ${enroll.course.slug}`)
          console.log(`      Price: Rp ${enroll.course.price.toLocaleString('id-ID')}`)
          console.log(`      Progress: ${enroll.progress}%`)
          console.log(`      Enrolled at: ${enroll.enrolledAt}`)
        })
      }
    }

    // 3. Cek semua kursus yang ada
    console.log('\n\n📖 Daftar semua kursus yang tersedia:\n')
    const allCourses = await prisma.course.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    allCourses.forEach((course, idx) => {
      console.log(`${idx + 1}. ${course.title}`)
      console.log(`   Slug: ${course.slug}`)
      console.log(`   Price: Rp ${course.price.toLocaleString('id-ID')} ${course.price === 0 ? '(GRATIS)' : ''}`)
      console.log(`   Total enrolled: ${course._count.enrollments} siswa\n`)
    })

    // 4. Rekomendasi
    console.log('\n\n💡 REKOMENDASI:')
    if (admins.length === 0) {
      console.log('❌ Tidak ada user dengan role ADMIN/SUPER_ADMIN')
      console.log('   Solusi: Jalankan create-admin.js untuk membuat admin')
    } else {
      for (const admin of admins) {
        const enrollments = await prisma.courseEnrollment.findMany({
          where: { userId: admin.id }
        })
        
        if (enrollments.length === 0) {
          console.log(`\n🔧 Admin "${admin.name}" belum terdenroll di kursus manapun`)
          console.log('   Solusi 1: Admin seharusnya bisa mengakses semua kursus tanpa enrollment')
          console.log('   Solusi 2: Tambahkan logika di dashboard untuk auto-grant akses admin ke semua kursus')
          console.log('   Solusi 3: Jalankan script untuk enroll admin ke semua kursus gratis')
        } else {
          console.log(`\n✅ Admin "${admin.name}" sudah terdenroll di ${enrollments.length} kursus`)
        }
      }
    }

    // 5. Cek logic akses di course learn page
    console.log('\n\n📄 Periksa file: src/app/courses/[id]/learn/page.tsx')
    console.log('   Pastikan ada logika: if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") { grant access }')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminEnrollment()
