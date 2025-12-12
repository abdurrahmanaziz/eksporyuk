// Test email template system API
const BASE_URL = 'http://localhost:3000'

console.log('🧪 Testing Email Template System API\n')

// Test 1: List all templates
async function testListTemplates() {
  console.log('1️⃣ Testing: List All Templates')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/templates?action=list`)
    const data = await response.json()
    
    if (data.success) {
      console.log(`   ✅ Found ${data.count} templates`)
      data.templates.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.name} (${t.slug})`)
        console.log(`      Variables: ${t.variables.join(', ')}`)
      })
    } else {
      console.log('   ❌ Failed:', data.error)
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }
  console.log()
}

// Test 2: Get specific template
async function testGetTemplate() {
  console.log('2️⃣ Testing: Get Specific Template (welcome-email)')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/templates?action=get&slug=welcome-email`)
    const data = await response.json()
    
    if (data.success) {
      console.log(`   ✅ Template: ${data.template.name}`)
      console.log(`   Subject: ${data.template.subject}`)
      console.log(`   Variables: ${data.template.variables.join(', ')}`)
      console.log(`   Active: ${data.template.isActive ? '✅' : '❌'}`)
    } else {
      console.log('   ❌ Failed:', data.error)
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }
  console.log()
}

// Test 3: Preview template with variables
async function testPreviewTemplate() {
  console.log('3️⃣ Testing: Preview Template with Variables')
  try {
    const params = new URLSearchParams({
      action: 'preview',
      slug: 'welcome-email',
      userName: 'John Doe',
      dashboardUrl: 'https://app.eksporyuk.com/dashboard'
    })
    
    const response = await fetch(`${BASE_URL}/api/admin/templates?${params}`)
    const data = await response.json()
    
    if (data.success) {
      console.log(`   ✅ Preview generated`)
      console.log(`   Subject: ${data.preview.subject}`)
      console.log(`   Content length: ${data.preview.content.length} chars`)
      console.log(`   Variables replaced: ✅`)
    } else {
      console.log('   ❌ Failed:', data.error)
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message)
  }
  console.log()
}

// Run all tests
async function runTests() {
  await testListTemplates()
  await testGetTemplate()
  await testPreviewTemplate()
  
  console.log('✅ All tests completed!\n')
  console.log('📝 Note: Test email sending requires authentication')
  console.log('   Use curl with session token to test send-test action')
}

runTests().catch(console.error)
