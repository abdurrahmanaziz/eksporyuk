const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSampleGroup() {
  try {
    console.log('🔍 Mencari users...')
    
    // Ambil beberapa users untuk dijadikan anggota grup
    const users = await prisma.user.findMany({ 
      take: 5,
      where: {
        isActive: true
      }
    })
    
    if (users.length < 2) {
      console.log('❌ Butuh minimal 2 user untuk membuat grup')
      return
    }
    
    console.log(`📋 Ditemukan ${users.length} users:`)
    users.forEach((u, i) => console.log(`   ${i+1}. ${u.name} (${u.email})`))
    
    // Buat grup chat
    console.log('\n🏗️ Membuat grup chat...')
    
    const group = await prisma.chatRoom.create({
      data: {
        name: 'Komunitas Ekspor Indonesia 🇮🇩',
        type: 'GROUP',
        avatar: null, // Bisa ditambahkan nanti
        participants: {
          create: users.map((user) => ({
            userId: user.id,
            joinedAt: new Date()
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log(`\n✅ Grup berhasil dibuat!`)
    console.log(`   ID: ${group.id}`)
    console.log(`   Nama: ${group.name}`)
    console.log(`   Anggota: ${group.participants.length} orang`)
    
    // Tambahkan pesan selamat datang
    console.log('\n💬 Menambahkan pesan selamat datang...')
    
    const adminUser = users[0]
    
    const welcomeMessages = [
      {
        roomId: group.id,
        senderId: adminUser.id,
        content: '👋 Selamat datang di Komunitas Ekspor Indonesia!',
        type: 'text'
      },
      {
        roomId: group.id,
        senderId: adminUser.id,
        content: '📋 Peraturan grup:\n\n1. Saling menghormati sesama member\n2. Dilarang spam dan iklan tanpa izin\n3. Share pengalaman dan ilmu ekspor\n4. Jaga kerahasiaan data bisnis member lain\n5. Have fun dan sukses bersama! 🚀',
        type: 'text'
      },
      {
        roomId: group.id,
        senderId: adminUser.id,
        content: '💡 Silakan perkenalkan diri dan bisnis ekspor kalian!',
        type: 'text'
      }
    ]
    
    for (const msg of welcomeMessages) {
      await prisma.message.create({
        data: msg
      })
    }
    
    // Update lastMessage di room
    await prisma.chatRoom.update({
      where: { id: group.id },
      data: {
        lastMessageAt: new Date()
      }
    })
    
    console.log(`   ✅ ${welcomeMessages.length} pesan ditambahkan`)
    
    console.log('\n🎉 Selesai! Grup siap digunakan.')
    console.log(`\n📱 Buka: http://localhost:3000/chat?room=${group.id}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleGroup()
