const fs = require('fs')
const path = require('path')

// Read the schema file
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma')
let schemaContent = fs.readFileSync(schemaPath, 'utf8')

// Define String default value fixes (these should be quoted)
const stringFixes = [
  { from: 'String      @default(PENDING)', to: 'String      @default("PENDING")' },
  { from: 'String       @default(PENDING)', to: 'String       @default("PENDING")' },
  { from: 'String                       @default(PENDING)', to: 'String                       @default("PENDING")' },
  { from: 'String         @default(DRAFT)', to: 'String         @default("DRAFT")' },
  { from: 'String            @default(PENDING)', to: 'String            @default("PENDING")' },
  { from: 'String                  @default(DRAFT)', to: 'String                  @default("DRAFT")' },
  { from: 'String             @default(PENDING)', to: 'String             @default("PENDING")' },
  { from: 'String   @default(PENDING)', to: 'String   @default("PENDING")' }
]

// Apply String fixes
let fixedContent = schemaContent
stringFixes.forEach(fix => {
  const regex = new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  fixedContent = fixedContent.replace(regex, fix.to)
})

// Write back to file
fs.writeFileSync(schemaPath, fixedContent)

console.log('✅ Fixed all String default values in schema.prisma')
console.log(`Applied ${stringFixes.length} string fixes`)