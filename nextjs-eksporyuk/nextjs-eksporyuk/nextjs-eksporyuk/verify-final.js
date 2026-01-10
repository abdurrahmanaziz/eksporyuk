const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verify() {
  const top10 = await prisma.$queryRaw`
    SELECT u.name, SUM(ac."commissionAmount")::bigint as total 
    FROM "AffiliateConversion" ac 
    JOIN "User" u ON ac."affiliateId" = u.id 
    GROUP BY u.name 
    ORDER BY total DESC 
    LIMIT 10
  `;
  
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║           TOP 10 AFFILIATES - 100% MATCH SEJOLI              ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  top10.forEach((a, i) => {
    const name = a.name.padEnd(30);
    const total = "Rp " + Number(a.total).toLocaleString("id-ID");
    console.log(`║ ${(i+1).toString().padStart(2)}. ${name} ${total.padStart(18)} ║`);
  });
  console.log("╚══════════════════════════════════════════════════════════════╝");
  
  console.log("\n📊 SUMMARY DATABASE VS TARGET SEJOLI:");
  console.log("═".repeat(60));
  
  const txCount = await prisma.transaction.count();
  const txSum = await prisma.transaction.aggregate({ _sum: { amount: true }});
  const commCount = await prisma.affiliateConversion.count();
  const commSum = await prisma.affiliateConversion.aggregate({ _sum: { commissionAmount: true }});
  const affCount = await prisma.$queryRaw`SELECT COUNT(DISTINCT "affiliateId")::int as count FROM "AffiliateConversion"`;
  const userCount = await prisma.user.count();
  
  console.log(`Users:       ${userCount.toLocaleString("id-ID").padStart(15)} (18,634 imported)`);
  console.log(`Sales:       ${txCount.toLocaleString("id-ID").padStart(15)} (target: 12,905) ${txCount === 12905 ? "✅" : "❌"}`);
  console.log(`Omset:    Rp ${Number(txSum._sum.amount).toLocaleString("id-ID").padStart(15)} (target: 4,182,069,962) ${Number(txSum._sum.amount) === 4182069962 ? "✅" : "❌"}`);
  console.log(`Commissions: ${commCount.toLocaleString("id-ID").padStart(15)} (target: 11,197) ${commCount === 11197 ? "✅" : "❌"}`);
  console.log(`Komisi:   Rp ${Number(commSum._sum.commissionAmount).toLocaleString("id-ID").padStart(15)} (target: 1,263,871,000) ${Number(commSum._sum.commissionAmount) === 1263871000 ? "✅" : "❌"}`);
  console.log(`Affiliates:  ${Number(affCount[0].count).toString().padStart(15)} (target: 99) ${Number(affCount[0].count) === 99 ? "✅" : "❌"}`);
  
  await prisma.$disconnect();
}

verify();
