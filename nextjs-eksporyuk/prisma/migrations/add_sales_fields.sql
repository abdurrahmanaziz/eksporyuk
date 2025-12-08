-- AlterTable: Add missing fields to Transaction
-- Run this SQL migration manually or create new Prisma migration

-- Add customer fields to Transaction
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "customerWhatsapp" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "reference" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "originalAmount" DECIMAL(10,2);
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add membership fields
ALTER TABLE "UserMembership" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING';
ALTER TABLE "UserMembership" ADD COLUMN IF NOT EXISTS "activatedAt" TIMESTAMP;
ALTER TABLE "UserMembership" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10,2);

-- Add coupon expiry field
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_transaction_customer_email" ON "Transaction"("customerEmail");
CREATE INDEX IF NOT EXISTS "idx_transaction_reference" ON "Transaction"("reference");