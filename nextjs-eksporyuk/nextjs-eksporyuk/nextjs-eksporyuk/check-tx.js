const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkTransactionStatus() {
  const tx = await prisma.transaction.findUnique({
    where: { id: "txn_1767338644481_azkga3n4sc" }
  });

  if (!tx) {
    console.log("❌ Transaction not found");
    return;
  }

  console.log("🔍 Transaction Details:");
  console.log("   ID:", tx.id);
  console.log("   Invoice:", tx.invoiceNumber);
  console.log("   Status:", tx.status);
  console.log("   Payment Proof URL:", tx.paymentProofUrl || "None");
  console.log("   Payment Proof Submitted:", tx.paymentProofSubmittedAt || "None");
  console.log("   Payment URL:", tx.paymentUrl || "None");
  console.log("   Created:", tx.createdAt.toISOString());
  console.log("   Updated:", tx.updatedAt.toISOString());

  console.log("\n📝 Analysis:");
  if (tx.status === "PENDING" && !tx.paymentProofUrl) {
    console.log("✅ Status correct: Transaction is PENDING and no payment proof uploaded yet");
    console.log("🎯 User should see \"Bayar\" button to upload payment proof");
  } else if (tx.status === "PENDING_CONFIRMATION") {
    console.log("✅ Status correct: Payment proof uploaded, waiting for admin confirmation");
    console.log("🎯 User should see \"Menunggu Konfirmasi\" status");
  } else if (tx.status === "PAID" || tx.status === "COMPLETED") {
    console.log("✅ Status correct: Payment completed");
    console.log("🎯 User should see completion date");
  } else {
    console.log("⚠️  Unexpected status combination");
  }

  await prisma.$disconnect();
}

checkTransactionStatus().catch(console.error);
