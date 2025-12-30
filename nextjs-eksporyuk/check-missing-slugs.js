const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const mustHave = [
    'support-ticket-created',
    'support-ticket-admin-reply',
    'support-ticket-user-reply',
    'support-ticket-status-change',
    'support-ticket-resolved',
    'welcome-email-new-member',
    'affiliate-commission-notification',
    'payment-confirmation',
    'verify-email',
    'reset-password',
    'welcome-new-member'
  ]

  const rows = await prisma.brandedTemplate.findMany({ select: { slug: true, name: true, category: true } })
  const set = new Set(rows.map(r => r.slug))
  const missing = mustHave.filter(s => !set.has(s))

  console.log('Total templates:', rows.length)
  console.log('Missing slugs:', missing)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
