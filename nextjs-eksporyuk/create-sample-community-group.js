const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSampleCommunityGroup() {
  try {
    console.log('🔍 Mencari admin user...')
    
    // Cari admin user sebagai owner
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        isActive: true
      }
    })
    
    if (!adminUser) {
      console.log('❌ Admin user tidak ditemukan')
      return
    }
    
    console.log(`✅ Admin ditemukan: ${adminUser.name} (${adminUser.email})`)
    
    // Cari users lain untuk dijadikan member
    const otherUsers = await prisma.user.findMany({
      where: {
        id: { not: adminUser.id },
        isActive: true
      },
      take: 4
    })
    
    console.log(`📋 Ditemukan ${otherUsers.length} users lainnya`)
    
    // Buat slug dari nama grup
    const groupName = 'Komunitas Ekspor Indonesia 🇮🇩'
    const slug = 'komunitas-ekspor-indonesia'
    
    console.log('\n🏗️ Membuat grup komunitas...')
    
    const group = await prisma.group.create({
      data: {
        name: groupName,
        slug: slug,
        description: 'Grup diskusi untuk para eksportir Indonesia. Sharing pengalaman, tips ekspor, dan networking sesama eksportir! 🚀\n\nDi sini kita bisa:\n• Sharing pengalaman ekspor\n• Diskusi permasalahan ekspor\n• Networking dengan sesama eksportir\n• Update info pasar internasional\n• Tips dan trik ekspor',
        type: 'PUBLIC',
        ownerId: adminUser.id,
        avatar: null,
        coverImage: null,
        requireApproval: false,
        isActive: true,
        allowRichText: true,
        allowMedia: true,
        allowPolls: true,
        allowEvents: true,
        allowReactions: true,
        allowMentions: true,
        moderatesPosts: false,
        bannedWords: JSON.stringify(['spam', 'scam', 'penipuan', 'judi']),
        members: {
          create: [
            // Admin sebagai owner
            {
              userId: adminUser.id,
              role: 'ADMIN',
              joinedAt: new Date()
            },
            // Users lain sebagai member
            ...otherUsers.map(user => ({
              userId: user.id,
              role: 'MEMBER',
              joinedAt: new Date()
            }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`\n✅ Grup komunitas berhasil dibuat!`)
    console.log(`   ID: ${group.id}`)
    console.log(`   Nama: ${group.name}`)
    console.log(`   Slug: ${group.slug}`)
    console.log(`   Owner: ${group.owner.name}`)
    console.log(`   Total Anggota: ${group.members.length} orang`)
    console.log(`   Tipe: ${group.type}`)
    
    // Buat beberapa post selamat datang
    console.log('\n💬 Membuat post selamat datang...')
    
    const welcomePosts = [
      {
        authorId: adminUser.id,
        groupId: group.id,
        type: 'POST',
        content: `👋 Selamat datang di ${groupName}!

Terima kasih sudah bergabung di komunitas eksportir Indonesia. Di sini kita bisa saling berbagi pengalaman, tips, dan informasi seputar dunia ekspor.

Mari kita saling support dan berkembang bersama! 🚀`,
        isPinned: true
      },
      {
        authorId: adminUser.id,
        groupId: group.id,
        type: 'POST',
        content: `📋 PERATURAN GRUP

Untuk menjaga kenyamanan bersama, mohon patuhi peraturan berikut:

1️⃣ Saling menghormati sesama member
2️⃣ Dilarang spam dan iklan tanpa izin admin
3️⃣ Share pengalaman dan ilmu yang bermanfaat
4️⃣ Jaga kerahasiaan data bisnis member lain
5️⃣ Gunakan bahasa yang sopan dan profesional

Pelanggaran akan dikenakan teguran hingga removal dari grup.

Terima kasih! 🙏`,
        isPinned: true
      },
      {
        authorId: adminUser.id,
        groupId: group.id,
        type: 'POST',
        content: `💡 TIPS EKSPOR MINGGU INI

Buat kalian yang baru mulai ekspor, ini 5 hal penting yang harus dipersiapkan:

✅ Legalitas usaha (SIUP, NIB, dll)
✅ Riset pasar target negara tujuan
✅ Sertifikasi produk sesuai negara tujuan
✅ Sistem pembayaran internasional (L/C, TT, dll)
✅ Logistik dan shipping yang reliable

Ada yang mau nambahin? Share di comment ya! 👇`,
        isPinned: false
      }
    ]
    
    for (const postData of welcomePosts) {
      await prisma.post.create({
        data: postData
      })
    }
    
    console.log(`   ✅ ${welcomePosts.length} post berhasil dibuat`)
    
    console.log('\n🎉 Selesai! Grup komunitas siap digunakan.')
    console.log(`\n📱 Akses grup di:`)
    console.log(`   Admin Panel: http://localhost:3000/admin/groups`)
    console.log(`   Public View: http://localhost:3000/community/groups/${group.slug}`)
    console.log(`\n💡 Login sebagai admin untuk mengelola grup:`)
    console.log(`   Email: ${adminUser.email}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleCommunityGroup()
