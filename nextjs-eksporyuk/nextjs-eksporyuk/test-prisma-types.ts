import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// Test 1: CouponWhereInput should have affiliateId
async function testWhereInput() {
  const where: Prisma.CouponWhereInput = {
    affiliateId: 'test-affiliate-id',
    code: 'TEST-CODE',
  }
  
  const result = await prisma.coupon.findMany({ where })
  console.log('✅ CouponWhereInput accepts affiliateId')
}

// Test 2: CouponWhereUniqueInput should have code
async function testWhereUniqueInput() {
  const where: Prisma.CouponWhereUniqueInput = {
    code: 'TEST-CODE',
  }
  
  const result = await prisma.coupon.findUnique({ where })
  console.log('✅ CouponWhereUniqueInput accepts code')
}

// Test 3: CouponCreateInput should have affiliateId
async function testCreateInput() {
  const data: Prisma.CouponCreateInput = {
    code: 'NEW-CODE',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    affiliateId: 'test-affiliate',
    generatedBy: 'admin-id',
  }
  
  console.log('✅ CouponCreateInput accepts affiliateId and generatedBy')
}

console.log('All Prisma type tests passed! ✅')
