const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSejoliMemberData() {
  let browser;
  
  try {
    console.log('=== CHECKING SEJOLI MEMBER DATA ===\n');
    
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for production
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Navigate to login page
    console.log('🌐 Navigating to login page...');
    await page.goto('https://member.eksporyuk.com/member-area/login', { 
      waitUntil: 'networkidle2' 
    });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="username"], input[name="log"]', { timeout: 10000 });
    
    console.log('🔐 Logging in...');
    
    // Try different possible selectors for username/email field
    const usernameSelectors = [
      'input[type="email"]',
      'input[name="username"]', 
      'input[name="log"]',
      'input[name="user_login"]',
      '#username',
      '#user_login'
    ];
    
    let usernameField = null;
    for (const selector of usernameSelectors) {
      try {
        usernameField = await page.$(selector);
        if (usernameField) {
          console.log(`Found username field: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (usernameField) {
      await page.type(usernameField, 'azizbiasa@gmail.com');
    } else {
      throw new Error('Username field not found');
    }
    
    // Try different possible selectors for password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[name="pwd"]',
      'input[name="user_pass"]',
      '#password',
      '#user_pass'
    ];
    
    let passwordField = null;
    for (const selector of passwordSelectors) {
      try {
        passwordField = await page.$(selector);
        if (passwordField) {
          console.log(`Found password field: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (passwordField) {
      await page.type(passwordField, 'Bismillah.2024');
    } else {
      throw new Error('Password field not found');
    }
    
    // Try to find and click login button
    const loginButtonSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'button:contains("Login")',
      'input[value*="Login"]',
      'input[value*="Masuk"]',
      '#wp-submit',
      '.login-button'
    ];
    
    let loginButton = null;
    for (const selector of loginButtonSelectors) {
      try {
        loginButton = await page.$(selector);
        if (loginButton) {
          console.log(`Found login button: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (loginButton) {
      await loginButton.click();
    } else {
      // Try pressing Enter as fallback
      await page.keyboard.press('Enter');
    }
    
    console.log('⏳ Waiting for login to complete...');
    
    // Wait for navigation after login
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
      console.log('Navigation timeout, checking current URL...');
    }
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check if login was successful
    if (currentUrl.includes('login') && !currentUrl.includes('dashboard')) {
      console.log('❌ Login may have failed, taking screenshot...');
      await page.screenshot({ path: 'login-error.png', fullPage: true });
      throw new Error('Login appears to have failed');
    }
    
    console.log('✅ Login successful!');
    
    // Navigate to affiliate/commission area
    console.log('📊 Looking for affiliate data...');
    
    // Try to find affiliate/commission links
    const affiliateLinks = [
      'a[href*="affiliate"]',
      'a[href*="commission"]', 
      'a[href*="komisi"]',
      'a:contains("Affiliate")',
      'a:contains("Commission")',
      'a:contains("Komisi")'
    ];
    
    for (const selector of affiliateLinks) {
      try {
        const link = await page.$(selector);
        if (link) {
          console.log(`Found affiliate link: ${selector}`);
          await link.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Look for affiliate data in the page
    console.log('🔍 Searching for affiliate commission data...');
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'sejoli-dashboard.png', fullPage: true });
    
    // Try to extract affiliate data
    const pageContent = await page.content();
    
    // Look for commission/earnings data
    const commissionRegex = /(?:commission|komisi|earnings|pendapatan)[^\d]*(\d+[\d,]*)/gi;
    const matches = pageContent.match(commissionRegex);
    
    if (matches) {
      console.log('💰 Found potential commission data:');
      matches.forEach(match => console.log(`- ${match}`));
    }
    
    // Try to find data tables
    const tables = await page.$$('table');
    console.log(`📋 Found ${tables.length} tables on the page`);
    
    for (let i = 0; i < Math.min(tables.length, 3); i++) {
      try {
        const tableContent = await page.evaluate(table => table.innerText, tables[i]);
        if (tableContent.toLowerCase().includes('commission') || 
            tableContent.toLowerCase().includes('komisi') ||
            tableContent.toLowerCase().includes('sutisna')) {
          console.log(`\n📊 Table ${i + 1} content:`);
          console.log(tableContent.substring(0, 500)); // First 500 chars
        }
      } catch (e) {
        continue;
      }
    }
    
    // Look for Sutisna specifically
    const sutisnaData = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const lines = text.split('\n');
      const sutisnaLines = lines.filter(line => 
        line.includes('sutisna') || 
        line.includes('azzka42') ||
        line.includes('icr7bck3')
      );
      return sutisnaLines;
    });
    
    if (sutisnaData.length > 0) {
      console.log('\n👤 Found Sutisna related data:');
      sutisnaData.forEach(line => console.log(`- ${line.trim()}`));
    }
    
    // Compare with our database
    console.log('\n=== COMPARING WITH DATABASE ===');
    
    const sutisnaUser = await prisma.user.findFirst({
      where: { email: 'azzka42@gmail.com' },
      include: { affiliateProfile: true }
    });
    
    if (sutisnaUser?.affiliateProfile) {
      console.log('💾 Database data for Sutisna:');
      console.log(`- Total Earnings: Rp ${sutisnaUser.affiliateProfile.totalEarnings.toLocaleString('id-ID')}`);
      console.log(`- Total Conversions: ${sutisnaUser.affiliateProfile.totalConversions}`);
      console.log(`- Affiliate Code: ${sutisnaUser.affiliateProfile.affiliateCode}`);
    }
    
    console.log('\n✅ Sejoli data extraction complete!');
    console.log('📸 Screenshots saved: login-error.png, sejoli-dashboard.png');
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser kept open for manual inspection...');
    console.log('Press Ctrl+C when done reviewing');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error checking Sejoli data:', error.message);
    
    if (browser) {
      // Take error screenshot
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ path: 'error-screenshot.png', fullPage: true });
          console.log('📸 Error screenshot saved: error-screenshot.png');
        }
      } catch (screenshotError) {
        console.log('Could not take error screenshot');
      }
    }
  } finally {
    await prisma.$disconnect();
    
    if (browser) {
      // Don't close browser automatically for manual inspection
      // await browser.close();
    }
  }
}

// Check if puppeteer is installed
async function checkDependencies() {
  try {
    require('puppeteer');
    return true;
  } catch (e) {
    console.log('❌ Puppeteer not installed. Installing...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install puppeteer', { stdio: 'inherit' });
      return true;
    } catch (installError) {
      console.log('❌ Failed to install puppeteer. Please run: npm install puppeteer');
      return false;
    }
  }
}

async function main() {
  const hasDepencies = await checkDependencies();
  if (hasDepencies) {
    await checkSejoliMemberData();
  }
}

main();