const fs = require('fs');

function inspectSejoliStructure() {
  try {
    console.log('🔍 INSPECTING SEJOLI DATA STRUCTURE');
    
    const sejoliPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
    const sejoliData = JSON.parse(fs.readFileSync(sejoliPath, 'utf8'));
    
    console.log(`📊 Total orders: ${sejoliData.orders.length}`);
    console.log(`📊 Total users: ${sejoliData.users.length}`);
    
    // Inspect first order structure
    const firstOrder = sejoliData.orders[0];
    console.log('\n🔍 FIRST ORDER STRUCTURE:');
    console.log('Keys:', Object.keys(firstOrder));
    console.log('Sample order:', JSON.stringify(firstOrder, null, 2).substring(0, 500) + '...');
    
    // Check for email fields
    console.log('\n📧 EMAIL RELATED FIELDS:');
    const emailFields = Object.keys(firstOrder).filter(key => 
      key.toLowerCase().includes('email') || 
      key.toLowerCase().includes('user') ||
      key.toLowerCase().includes('customer')
    );
    console.log('Email-related fields:', emailFields);
    
    for (const field of emailFields) {
      console.log(`${field}: ${firstOrder[field]}`);
    }
    
    // Check first user structure  
    const firstUser = sejoliData.users[0];
    console.log('\n👤 FIRST USER STRUCTURE:');
    console.log('Keys:', Object.keys(firstUser));
    console.log('Sample user:', JSON.stringify(firstUser, null, 2).substring(0, 300) + '...');
    
    // Check if orders have user_id that links to users
    console.log('\n🔗 ORDER-USER RELATIONSHIP:');
    console.log('Order user_id:', firstOrder.user_id);
    console.log('Order customer_id:', firstOrder.customer_id);
    
    // Find corresponding user
    const correspondingUser = sejoliData.users.find(u => u.id === firstOrder.user_id);
    if (correspondingUser) {
      console.log('Found corresponding user:', correspondingUser.email || correspondingUser.user_email);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

inspectSejoliStructure();