const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== ANALISIS MEMBER_FREE SOURCES ===');

  // 1) Ambil semua user FREE
  const freeUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_FREE' },
    select: { id: true }
  });
  const freeUserIds = freeUsers.map(u => u.id);
  console.log('Total MEMBER_FREE:', freeUserIds.length);

  // Early exit
  if (freeUserIds.length === 0) return;

  // 2) Transaksi sukses untuk user FREE
  const trx = await prisma.transaction.findMany({
    where: { status: 'SUCCESS', userId: { in: freeUserIds } },
    select: { id: true, userId: true, amount: true, productId: true }
  });

  const productIds = [...new Set(trx.map(t => t.productId).filter(Boolean))];
  const products = productIds.length ? await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, productType: true }
  }) : [];
  const productMap = new Map(products.map(p => [p.id, p]));

  // 3) Membership untuk user FREE (untuk cek expired/downgrade)
  const memberships = await prisma.userMembership.findMany({
    where: { userId: { in: freeUserIds } },
    select: { userId: true, status: true }
  });
  const hasExpiredOrCancelled = new Set(
    memberships
      .filter(m => m.status === 'EXPIRED' || m.status === 'CANCELLED')
      .map(m => m.userId)
  );

  const hasAnyMembership = new Set(memberships.map(m => m.userId));

  // 4) Kelompokkan user FREE berdasarkan transaksi
  const freeSet = new Set(freeUserIds);
  const usersWithTrx = new Set(trx.map(t => t.userId));
  const usersNoTrx = [...freeSet].filter(id => !usersWithTrx.has(id));

  // Users FREE dengan transaksi amount 0 saja
  const byUser = new Map();
  for (const t of trx) {
    const list = byUser.get(t.userId) || [];
    list.push(t);
    byUser.set(t.userId, list);
  }

  let zeroOnly = 0;
  let eventOnly = 0;
  let membershipEver = 0; // pernah punya membership record
  let otherPaidOnly = 0; // bayar selain event/membership (ebook, template, dsb)

  // Event nominal heuristik
  const eventNominals = new Set([35000, 50000, 75000, 99000, 100000, 150000]);

  for (const id of usersWithTrx) {
    const list = byUser.get(id) || [];
    const amounts = list.map(l => Number(l.amount || 0));
    const allZero = amounts.every(a => a === 0);
    if (allZero) {
      zeroOnly++;
      continue;
    }

    // Non-zero transactions, check product types
    const nonZero = list.filter(l => Number(l.amount || 0) > 0);

    let hasEvent = false;
    let hasMembershipProduct = false;
    let hasOtherPaid = false;

    for (const t of nonZero) {
      const p = t.productId ? productMap.get(t.productId) : null;
      if (p) {
        if (p.productType === 'EVENT') hasEvent = true;
        else if (p.productType === 'MEMBERSHIP') hasMembershipProduct = true;
        else hasOtherPaid = true;
      } else {
        // jika product tidak ditemukan, fallback heuristik by amount
        if (eventNominals.has(Number(t.amount))) hasEvent = true; else hasOtherPaid = true;
      }
    }

    if (hasMembershipProduct || hasAnyMembership.has(id)) {
      membershipEver++;
      continue;
    }

    if (hasEvent && !hasMembershipProduct && !hasAnyMembership.has(id)) {
      eventOnly++;
      continue;
    }

    if (hasOtherPaid) {
      otherPaidOnly++;
      continue;
    }
  }

  // 5) Output ringkas
  console.log('\n=== RINGKASAN MEMBER_FREE ===');
  console.log('Total MEMBER_FREE:', freeUserIds.length);
  console.log('• Tanpa transaksi sama sekali:', usersNoTrx.length);
  console.log('• Hanya transaksi Rp 0:', zeroOnly);
  console.log('• Hanya beli Event/Webinar:', eventOnly);
  console.log('• Pernah punya membership (expired/downgrade):', membershipEver);
  console.log('• Beli produk lain non-membership/non-event (ebook/template/dll):', otherPaidOnly);

  // 6) Validasi jumlah pengguna yang masuk kategori di atas + sisa
  const categorized = usersNoTrx.length + zeroOnly + eventOnly + membershipEver + otherPaidOnly;
  const remainder = freeUserIds.length - categorized;
  console.log('• Sisa (kategori campur/ambigu):', remainder);

  // 7) Bonus: top nominal untuk user FREE
  const amountGroups = {};
  for (const t of trx) {
    const amt = Number(t.amount || 0);
    amountGroups[amt] = amountGroups[amt] || { count: 0, users: new Set() };
    amountGroups[amt].count++;
    amountGroups[amt].users.add(t.userId);
  }
  const top = Object.entries(amountGroups).sort((a,b)=>b[1].count-a[1].count).slice(0,10);
  console.log('\nTop nominal transaksi (FREE users):');
  for (const [amt, data] of top) {
    const n = Number(amt);
    let label = '';
    if (n === 0) label = ' ← Rp0 (free/bonus)';
    if (n === 35000) label = ' ← Webinar';
    if (n === 699000) label = ' ← 6 Bulan';
    if (n === 899000) label = ' ← 12 Bulan';
    if (n === 999000) label = ' ← Lifetime';
    console.log(`  Rp ${n.toLocaleString('id-ID')}: ${data.count} trx (${data.users.size} users)${label}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
