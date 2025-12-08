const fs = require('fs')
const path = require('path')

// Read the schema file
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma')
let schemaContent = fs.readFileSync(schemaPath, 'utf8')

// Define enum default value fixes
const enumFixes = [
  { from: '@default("PENDING")', to: '@default(PENDING)' },
  { from: '@default("CHECKOUT")', to: '@default(CHECKOUT)' },
  { from: '@default("PERCENTAGE")', to: '@default(PERCENTAGE)' },
  { from: '@default("AFTER_PURCHASE")', to: '@default(AFTER_PURCHASE)' },
  { from: '@default("DIGITAL")', to: '@default(DIGITAL)' },
  { from: '@default("DRAFT")', to: '@default(DRAFT)' },
  { from: '@default("PUBLIC")', to: '@default(PUBLIC)' },
  { from: '@default("FREE")', to: '@default(FREE)' },
  { from: '@default("MEMBER")', to: '@default(MEMBER)' },
  { from: '@default("POST")', to: '@default(POST)' },
  { from: '@default("APPROVED")', to: '@default(APPROVED)' },
  { from: '@default("LIKE")', to: '@default(LIKE)' },
  { from: '@default("DIRECT")', to: '@default(DIRECT)' },
  { from: '@default("SUCCESS")', to: '@default(SUCCESS)' },
  { from: '@default("MULTIPLE_CHOICE")', to: '@default(MULTIPLE_CHOICE)' },
  { from: '@default("SUBMITTED")', to: '@default(SUBMITTED)' },
  { from: '@default("PARTICIPATION")', to: '@default(PARTICIPATION)' },
  { from: '@default("DASHBOARD")', to: '@default(DASHBOARD)' },
  { from: '@default("CAROUSEL")', to: '@default(CAROUSEL)' }
]

// Apply fixes
let fixedContent = schemaContent
enumFixes.forEach(fix => {
  const regex = new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  fixedContent = fixedContent.replace(regex, fix.to)
})

// Write back to file
fs.writeFileSync(schemaPath, fixedContent)

console.log('✅ Fixed all enum default values in schema.prisma')
console.log(`Applied ${enumFixes.length} enum fixes`)