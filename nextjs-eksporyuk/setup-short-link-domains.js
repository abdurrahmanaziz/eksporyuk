const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupShortLinkDomains() {
  console.log('\n🚀 Setting up Short Link Domains...\n')
  
  try {
    // Check if domains already exist
    const existingDomains = await prisma.shortLinkDomain.findMany()
    
    if (existingDomains.length > 0) {
      console.log(`✓ ${existingDomains.length} domains already exist`)
      existingDomains.forEach(d => {
        console.log(`  - ${d.displayName}: ${d.domain} ${d.isDefault ? '(DEFAULT)' : ''}`)
      })
      return
    }
    
    console.log('📦 Creating default short link domains...\n')
    
    const domains = [
      {
        domain: 'link.eksporyuk.com',
        displayName: 'Link EksporYuk',
        isActive: true,
        isDefault: true,
        isVerified: true,
        dnsType: 'CNAME',
        dnsTarget: 'eksporyuk.com',
        dnsInstructions: `Setup CNAME record:
Type: CNAME
Name: link (or link.eksporyuk.com)
Value: eksporyuk.com
TTL: 3600 (or Auto)

After setup, DNS propagation may take 24-48 hours.`
      },
      {
        domain: 'go.eksporyuk.com',
        displayName: 'Go EksporYuk',
        isActive: true,
        isDefault: false,
        isVerified: false,
        dnsType: 'CNAME',
        dnsTarget: 'eksporyuk.com',
        dnsInstructions: `Setup CNAME record:
Type: CNAME
Name: go (or go.eksporyuk.com)
Value: eksporyuk.com
TTL: 3600 (or Auto)`
      },
      {
        domain: 'eks.link',
        displayName: 'EKS Link',
        isActive: false,
        isDefault: false,
        isVerified: false,
        dnsType: 'A',
        dnsTarget: 'Your server IP',
        dnsInstructions: `Setup A record:
Type: A
Name: @ (or eks.link)
Value: Your server IP address
TTL: 3600 (or Auto)

Note: You need to own this domain and configure DNS.`
      }
    ]
    
    for (const domainData of domains) {
      const created = await prisma.shortLinkDomain.create({
        data: domainData
      })
      console.log(`✅ Created: ${created.displayName} (${created.domain})`)
    }
    
    console.log('\n✨ Short link domains setup completed!\n')
    
    // Show summary
    const allDomains = await prisma.shortLinkDomain.findMany({
      orderBy: { isDefault: 'desc' }
    })
    
    console.log('📋 Summary:')
    console.log('=' .repeat(70))
    allDomains.forEach(domain => {
      console.log(`\n🌐 ${domain.displayName}`)
      console.log(`   Domain: ${domain.domain}`)
      console.log(`   Status: ${domain.isActive ? '✓ Active' : '✗ Inactive'}`)
      console.log(`   Verified: ${domain.isVerified ? '✓ Yes' : '⚠ No'}`)
      console.log(`   Default: ${domain.isDefault ? 'Yes' : 'No'}`)
      if (domain.dnsType) {
        console.log(`   DNS: ${domain.dnsType} → ${domain.dnsTarget}`)
      }
    })
    console.log('\n' + '='.repeat(70))
    
    console.log('\n📖 Next Steps:')
    console.log('1. Go to Admin Panel → Short Link Domains')
    console.log('2. Configure DNS for your domains')
    console.log('3. Mark domains as verified after DNS propagation')
    console.log('4. Affiliates can now create short links!\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupShortLinkDomains()
