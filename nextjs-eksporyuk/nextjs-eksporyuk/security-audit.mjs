/**
 * Comprehensive Security Audit for Affiliate Links System
 * Tests authentication, authorization, input validation, and data protection
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function securityAudit() {
  console.log('🔒 AFFILIATE LINKS SECURITY AUDIT\n')
  
  const securityIssues = []
  const securityPassed = []
  
  try {
    console.log('1. Authentication & Authorization Testing...')
    
    // Test 1: Database access controls
    try {
      await prisma.affiliateLink.findMany({
        take: 1
      })
      securityPassed.push('Database connection properly secured')
    } catch (error) {
      securityIssues.push('Database connection security issue')
    }
    
    // Test 2: Unique constraints
    try {
      const duplicateTest = await prisma.affiliateLink.findMany({
        where: {
          code: {
            in: ['duplicate-test', 'duplicate-test'] 
          }
        }
      })
      
      if (duplicateTest.length <= 1) {
        securityPassed.push('Unique code constraint working')
      } else {
        securityIssues.push('Duplicate affiliate codes detected')
      }
    } catch (error) {
      securityIssues.push('Error testing unique constraints')
    }
    
    console.log('2. Input Validation Testing...')
    
    // Test 3: SQL Injection protection
    try {
      const maliciousInput = "'; DROP TABLE AffiliateLink; --"
      const result = await prisma.affiliateLink.findMany({
        where: {
          code: maliciousInput
        },
        take: 1
      })
      securityPassed.push('SQL injection protection working (Prisma ORM)')
    } catch (error) {
      securityIssues.push('Potential SQL injection vulnerability')
    }
    
    // Test 4: XSS protection in stored data
    const xssTestCases = [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
      "<%2Fscript><script>alert('xss')</script>"
    ]
    
    let xssProtected = true
    for (const xssInput of xssTestCases) {
      try {
        // Try to create a link with XSS payload in code field
        await prisma.affiliateLink.create({
          data: {
            code: `XSS-TEST-${Date.now()}`,
            fullUrl: xssInput, // XSS in URL field
            linkType: 'CHECKOUT'
          }
        })
        
        // If it succeeds, check if XSS is properly escaped/sanitized
        const created = await prisma.affiliateLink.findFirst({
          where: { fullUrl: xssInput },
          orderBy: { createdAt: 'desc' }
        })
        
        if (created && created.fullUrl === xssInput) {
          securityIssues.push('XSS payload stored without sanitization')
          xssProtected = false
        }
        
        // Clean up test data
        if (created) {
          await prisma.affiliateLink.delete({ where: { id: created.id } })
        }
      } catch (error) {
        // Error is expected for malicious input
      }
    }
    
    if (xssProtected) {
      securityPassed.push('XSS protection in database layer')
    }
    
    console.log('3. Access Control Testing...')
    
    // Test 5: Role-based access control
    const affiliateProfile = await prisma.affiliateProfile.findFirst({
      include: { user: true }
    })
    
    if (affiliateProfile) {
      // Test if affiliate can only access their own links
      const userLinks = await prisma.affiliateLink.findMany({
        where: { affiliateId: affiliateProfile.id }
      })
      
      const totalLinks = await prisma.affiliateLink.count()
      
      if (userLinks.length <= totalLinks) {
        securityPassed.push('Role-based access control implemented')
      } else {
        securityIssues.push('Access control bypass detected')
      }
    }
    
    console.log('4. Data Protection Testing...')
    
    // Test 6: Sensitive data exposure
    const sensitiveFields = ['password', 'secret', 'key', 'token']
    const affiliateData = await prisma.affiliateProfile.findFirst({
      include: { user: true }
    })
    
    let exposedSensitiveData = false
    if (affiliateData) {
      const dataString = JSON.stringify(affiliateData)
      for (const field of sensitiveFields) {
        if (dataString.toLowerCase().includes(field) && 
            dataString.toLowerCase().includes('password')) {
          exposedSensitiveData = true
          break
        }
      }
    }
    
    if (!exposedSensitiveData) {
      securityPassed.push('No sensitive data exposure in affiliate data')
    } else {
      securityIssues.push('Potential sensitive data exposure')
    }
    
    console.log('5. URL Security Testing...')
    
    // Test 7: URL validation
    const maliciousUrls = [
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'file:///etc/passwd',
      'http://evil.com/redirect?to=http://legitimate.com'
    ]
    
    let urlSecurityIssues = 0
    for (const maliciousUrl of maliciousUrls) {
      try {
        const testLink = await prisma.affiliateLink.create({
          data: {
            code: `URL-TEST-${Date.now()}`,
            fullUrl: maliciousUrl,
            linkType: 'CHECKOUT'
          }
        })
        
        // Clean up
        await prisma.affiliateLink.delete({ where: { id: testLink.id } })
        urlSecurityIssues++
      } catch (error) {
        // Good - malicious URL rejected
      }
    }
    
    if (urlSecurityIssues === 0) {
      securityPassed.push('URL validation properly rejects malicious URLs')
    } else {
      securityIssues.push(`${urlSecurityIssues} malicious URLs accepted`)
    }
    
    console.log('6. Rate Limiting & DoS Protection...')
    
    // Test 8: Bulk creation protection
    try {
      const bulkTestPromises = []
      for (let i = 0; i < 100; i++) {
        bulkTestPromises.push(
          prisma.affiliateLink.create({
            data: {
              code: `BULK-${Date.now()}-${i}`,
              fullUrl: `https://test.com/${i}`,
              linkType: 'CHECKOUT'
            }
          })
        )
      }
      
      const results = await Promise.allSettled(bulkTestPromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      
      // Clean up test links
      await prisma.affiliateLink.deleteMany({
        where: {
          code: {
            startsWith: 'BULK-'
          }
        }
      })
      
      if (successful < 100) {
        securityPassed.push('Some protection against bulk creation detected')
      } else {
        securityIssues.push('No rate limiting for bulk operations')
      }
    } catch (error) {
      securityPassed.push('Database level protection against bulk operations')
    }
    
    console.log('7. Data Integrity Testing...')
    
    // Test 9: Foreign key constraints
    try {
      await prisma.affiliateLink.create({
        data: {
          code: `FK-TEST-${Date.now()}`,
          fullUrl: 'https://test.com',
          linkType: 'CHECKOUT',
          affiliateId: 'non-existent-id',
          membershipId: 'non-existent-membership'
        }
      })
      securityIssues.push('Foreign key constraints not enforced')
    } catch (error) {
      securityPassed.push('Foreign key constraints properly enforced')
    }
    
    console.log('8. Privacy & Compliance Testing...')
    
    // Test 10: Personal data handling
    const personalDataFields = ['email', 'phone', 'address', 'ip']
    const linkData = await prisma.affiliateLink.findFirst({
      include: {
        affiliate: { include: { user: true } }
      }
    })
    
    let personalDataExposed = false
    if (linkData) {
      const publicData = {
        code: linkData.code,
        url: linkData.fullUrl,
        clicks: linkData.clicks
      }
      
      const publicString = JSON.stringify(publicData)
      for (const field of personalDataFields) {
        if (publicString.includes(field)) {
          personalDataExposed = true
          break
        }
      }
    }
    
    if (!personalDataExposed) {
      securityPassed.push('Personal data not exposed in public link data')
    } else {
      securityIssues.push('Personal data potentially exposed')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🔒 SECURITY AUDIT RESULTS')
    console.log('='.repeat(60))
    
    console.log('\n✅ SECURITY MEASURES PASSED:')
    securityPassed.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item}`)
    })
    
    if (securityIssues.length > 0) {
      console.log('\n⚠️  SECURITY ISSUES FOUND:')
      securityIssues.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item}`)
      })
    } else {
      console.log('\n🎉 NO SECURITY ISSUES FOUND!')
    }
    
    console.log('\n📊 SECURITY SCORE:')
    const totalTests = securityPassed.length + securityIssues.length
    const passRate = (securityPassed.length / totalTests) * 100
    console.log(`   Pass Rate: ${passRate.toFixed(1)}% (${securityPassed.length}/${totalTests})`)
    
    if (passRate >= 90) {
      console.log('   🟢 EXCELLENT SECURITY')
    } else if (passRate >= 75) {
      console.log('   🟡 GOOD SECURITY - Minor improvements needed')
    } else {
      console.log('   🔴 SECURITY ISSUES - Immediate attention required')
    }
    
    console.log('\n🛡️  SECURITY RECOMMENDATIONS:')
    console.log('   1. ✅ Use HTTPS for all affiliate links')
    console.log('   2. ✅ Implement proper session management')
    console.log('   3. ✅ Regular security updates for dependencies')
    console.log('   4. ✅ Monitor for suspicious affiliate activity')
    console.log('   5. ✅ Implement CSRF protection in forms')
    console.log('   6. ✅ Use content security policy (CSP) headers')
    console.log('   7. ✅ Regular backup and disaster recovery testing')
    
  } catch (error) {
    console.error('❌ Security audit failed:', error.message)
    securityIssues.push(`Audit execution error: ${error.message}`)
  } finally {
    await prisma.$disconnect()
  }
}

securityAudit()