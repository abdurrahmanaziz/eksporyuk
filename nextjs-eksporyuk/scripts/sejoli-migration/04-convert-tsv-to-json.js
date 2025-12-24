/**
 * Convert TSV exports to JSON
 * Parse exported TSV files and convert to JSON format
 */

const fs = require('fs').promises;
const path = require('path');

const EXPORT_DIR = path.join(__dirname, 'exports');

async function tsvToJson(filename, columns) {
  console.log(`Converting ${filename}...`);
  
  const content = await fs.readFile(path.join(EXPORT_DIR, filename), 'utf-8');
  const lines = content.trim().split('\n');
  
  const json = lines.map(line => {
    const values = line.split('\t');
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = values[i] || null;
    });
    return obj;
  });
  
  const jsonFile = filename.replace('.tsv', '.json');
  await fs.writeFile(
    path.join(EXPORT_DIR, jsonFile),
    JSON.stringify(json, null, 2)
  );
  
  console.log(`  ✅ ${jsonFile}: ${json.length} records\n`);
  return json;
}

async function convertAll() {
  console.log('🔄 CONVERTING TSV TO JSON');
  console.log('=========================\n');

  try {
    // Convert users
    const users = await tsvToJson('sejoli_users.tsv', [
      'ID', 'user_login', 'user_email', 'user_registered', 'user_status', 'display_name'
    ]);

    // Convert user meta
    const userMeta = await tsvToJson('sejoli_usermeta.tsv', [
      'user_id', 'meta_key', 'meta_value'
    ]);

    // Convert affiliates
    const affiliates = await tsvToJson('sejoli_affiliates.tsv', [
      'ID', 'user_id', 'affiliate_code', 'commission_type', 'commission_value',
      'total_commission', 'total_referrals', 'status', 'created_at', 'updated_at'
    ]);

    // Convert orders  
    const orders = await tsvToJson('sejoli_orders.tsv', [
      'ID', 'user_id', 'product_id', 'grand_total', 'status', 'payment_method',
      'payment_gateway', 'created_at', 'updated_at', 'order_via'
    ]);

    // Convert products
    const products = await tsvToJson('sejoli_products.tsv', [
      'ID', 'post_title', 'post_content', 'post_status', 'post_date', 'post_type'
    ]);

    // Convert wallet
    const wallet = await tsvToJson('sejoli_wallet.tsv', [
      'ID', 'user_id', 'balance', 'created_at', 'updated_at'
    ]);

    // Create summary
    const summary = {
      convertedAt: new Date().toISOString(),
      totalRecords: {
        users: users.length,
        userMeta: userMeta.length,
        affiliates: affiliates.length,
        orders: orders.length,
        products: products.length,
        wallet: wallet.length
      },
      sampleUser: users[0],
      sampleAffiliate: affiliates[0],
      sampleOrder: orders[0]
    };

    await fs.writeFile(
      path.join(EXPORT_DIR, '_conversion_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('✅ CONVERSION COMPLETE!');
    console.log('=======================\n');
    console.log('📊 Summary:');
    console.log(`  Users: ${users.length}`);
    console.log(`  User Meta: ${userMeta.length}`);
    console.log(`  Affiliates: ${affiliates.length}`);
    console.log(`  Orders: ${orders.length}`);
    console.log(`  Products: ${products.length}`);
    console.log(`  Wallet: ${wallet.length}\n`);
    console.log('📁 JSON files ready in exports/\n');
    console.log('Next: npm run migrate\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

convertAll().catch(console.error);
