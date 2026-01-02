import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.error('❌ Admin user tidak ditemukan. Pastikan ada user dengan role ADMIN.');
      return;
    }

    console.log(`✅ Admin user ditemukan: ${adminUser.email}`);

    // Create event as Product
    const eventDate = new Date('2025-01-29');
    const title = 'Webinar Ekspor 29 Januari 2025';
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const event = await prisma.product.create({
      data: {
        id: randomUUID(),
        name: title,
        slug: slug,
        description: 'Webinar eksklusif tentang strategi ekspor untuk pemula dan profesional',
        price: 0,
        creatorId: adminUser.id,
        productType: 'EVENT',
        eventDate: eventDate,
        eventEndDate: eventDate,
        eventDuration: 120, // 2 hours
        maxParticipants: 500,
        eventVisibility: 'PUBLIC',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Event berhasil dibuat:');
    console.log(`   - ID: ${event.id}`);
    console.log(`   - Nama: ${event.name}`);
    console.log(`   - Slug: ${event.slug}`);
    console.log(`   - Tanggal: ${event.eventDate?.toLocaleDateString('id-ID')}`);
    console.log(`   - Durasi: ${event.eventDuration} menit`);
    console.log(`   - URL Admin: /admin/events/${event.id}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
