const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Fixing optin forms JSON fields...')
  
  const forms = await prisma.affiliateOptinForm.findMany()
  console.log(`Found ${forms.length} forms`)
  
  for (const form of forms) {
    await prisma.affiliateOptinForm.update({
      where: { id: form.id },
      data: {
        benefits: form.benefits || [],
        faqs: form.faqs || []
      }
    })
    console.log(`✅ Fixed: ${form.formName}`)
  }
  
  console.log('✨ All forms fixed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
