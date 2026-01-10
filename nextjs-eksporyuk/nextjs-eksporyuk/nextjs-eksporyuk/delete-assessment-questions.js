/**
 * Delete all existing assessment questions before reseeding
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Deleting all existing assessment questions...')
  
  const result = await prisma.supplierAssessmentQuestion.deleteMany({})
  
  console.log(`✅ Deleted ${result.count} questions`)
  console.log('Now you can run: node seed-supplier-assessment.js')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
