/**
 * Security Fixes Implementation
 * Addresses XSS, URL validation, and input sanitization issues
 */

import { PrismaClient } from '@prisma/client'
import validator from 'validator'
import DOMPurify from 'isomorphic-dompurify'

const prisma = new PrismaClient()

// URL validation function
function isValidUrl(url) {
  try {
    const urlObj = new URL(url)
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:']
    if (dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
      return false
    }
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false
    }
    
    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)) {
        return false
      }
    }
    
    return true
  } catch {
    return false
  }
}

// Input sanitization function
function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  // Remove XSS payloads
  let sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  })
  
  // Additional sanitization
  sanitized = validator.escape(sanitized)
  
  return sanitized
}

// Rate limiting helper
class RateLimiter {
  constructor() {
    this.requests = new Map()
  }
  
  isAllowed(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [])
    }
    
    const userRequests = this.requests.get(identifier)
    
    // Remove old requests
    const validRequests = userRequests.filter(time => time > windowStart)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }
}

const rateLimiter = new RateLimiter()

async function implementSecurityFixes() {
  console.log('🔧 IMPLEMENTING SECURITY FIXES\n')
  
  try {
    console.log('1. Implementing URL validation...')
    
    // Get all affiliate links and validate URLs
    const affiliateLinks = await prisma.affiliateLink.findMany()
    let fixedUrls = 0
    
    for (const link of affiliateLinks) {
      if (!isValidUrl(link.fullUrl)) {
        console.log(`   ⚠️  Invalid URL detected: ${link.fullUrl}`)
        
        // You could either delete or update these links
        // For safety, we'll mark them as inactive instead
        await prisma.affiliateLink.update({
          where: { id: link.id },
          data: { 
            isActive: false,
            // Add a note about security issue
            notes: 'Deactivated due to security validation failure'
          }
        })
        fixedUrls++
      }
    }
    
    console.log(`   ✅ Fixed ${fixedUrls} URLs with security issues`)
    
    console.log('2. Implementing input sanitization...')
    
    // Sanitize existing data
    let sanitizedRecords = 0
    for (const link of affiliateLinks) {
      const originalCode = link.code
      const sanitizedCode = sanitizeInput(link.code)
      
      if (originalCode !== sanitizedCode) {
        await prisma.affiliateLink.update({
          where: { id: link.id },
          data: { code: sanitizedCode }
        })
        sanitizedRecords++
      }
    }
    
    console.log(`   ✅ Sanitized ${sanitizedRecords} records`)
    
    console.log('3. Testing security improvements...')
    
    // Test XSS protection
    const xssTestPayload = "<script>alert('xss')</script>"
    const sanitizedXss = sanitizeInput(xssTestPayload)
    
    if (sanitizedXss === xssTestPayload) {
      console.log('   ❌ XSS sanitization failed')
    } else {
      console.log('   ✅ XSS sanitization working')
    }
    
    // Test URL validation
    const maliciousUrl = "javascript:alert('xss')"
    const urlValid = isValidUrl(maliciousUrl)
    
    if (urlValid) {
      console.log('   ❌ URL validation failed')
    } else {
      console.log('   ✅ URL validation working')
    }
    
    // Test rate limiting
    const testUser = 'test-user'
    let rateLimitWorking = true
    
    for (let i = 0; i < 15; i++) {
      if (!rateLimiter.isAllowed(testUser, 10, 60000)) {
        rateLimitWorking = true
        break
      }
      if (i === 14) rateLimitWorking = false
    }
    
    if (rateLimitWorking) {
      console.log('   ✅ Rate limiting working')
    } else {
      console.log('   ❌ Rate limiting failed')
    }
    
    console.log('\n4. Security fixes summary:')
    console.log(`   - URLs validated and secured: ${fixedUrls}`)
    console.log(`   - Records sanitized: ${sanitizedRecords}`)
    console.log('   - XSS protection: ✅ Implemented')
    console.log('   - URL validation: ✅ Implemented')
    console.log('   - Rate limiting: ✅ Implemented')
    
  } catch (error) {
    console.error('❌ Security fixes failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Export functions for use in API routes
export { isValidUrl, sanitizeInput, RateLimiter }

implementSecurityFixes()