const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fix() {
  const m = await p.membership.update({
    where: { slug: 'paket-lifetime' },
    data: {
      features: [
        'Akses penuh selamanya',
        'Materi ekspor lengkap',
        'Konsultasi mentor unlimited',
        'Grup WhatsApp eksklusif',
        'Update materi terbaru',
        'Bonus sertifikat',
        'Priority support',
        'Badge member lifetime',
        'Akses kelas website ekspor',
        'Grup support website ekspor'
      ]
    }
  });
  console.log('Lifetime features restored:', m.features);
  await p.$disconnect();
}
fix();
