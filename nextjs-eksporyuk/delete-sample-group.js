const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteSampleGroup() {
  try {
    console.log('🔍 Mencari grup "Komunitas Ekspor Indonesia"...')
    
    const group = await prisma.chatRoom.findFirst({
      where: {
        name: 'Komunitas Ekspor Indonesia 🇮🇩',
        type: 'GROUP'
      }
    })
    
    if (!group) {
      console.log('❌ Grup tidak ditemukan')
      return
    }
    
    console.log(`✅ Ditemukan grup: ${group.name} (ID: ${group.id})`)
    console.log('🗑️  Menghapus grup...')
    
    // Hapus grup (cascade akan hapus participants dan messages)
    await prisma.chatRoom.delete({
      where: { id: group.id }
    })
    
    console.log('✅ Grup berhasil dihapus!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteSampleGroup()
