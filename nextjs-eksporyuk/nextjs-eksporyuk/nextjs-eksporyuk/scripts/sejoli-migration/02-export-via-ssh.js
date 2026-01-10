/**
 * Export Sejoli Data via SSH
 * Uses SSH commands to export data from remote server
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');
const execPromise = util.promisify(exec);

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.sejoli') });

const EXPORT_DIR = path.join(__dirname, 'exports');
const SSH_HOST = process.env.SEJOLI_SSH_HOST;
const SSH_USER = process.env.SEJOLI_SSH_USER;
const DB_USER = process.env.SEJOLI_DB_USER;
const DB_PASS = process.env.SEJOLI_DB_PASSWORD;
const DB_NAME = process.env.SEJOLI_DB_NAME;

async function exportViaSSH() {
  console.log('📤 SEJOLI DATA EXPORT (via SSH)');
  console.log('================================\n');

  await fs.mkdir(EXPORT_DIR, { recursive: true });

  console.log('⚠️  You will be prompted for SSH password multiple times');
  console.log(`Password: ${process.env.SEJOLI_SSH_PASSWORD}\n`);

  const queries = {
    users: `
      SELECT 
        u.ID,
        u.user_login,
        u.user_email,
        u.user_registered,
        u.user_status,
        u.display_name
      FROM wp_users u
      ORDER BY u.ID
    `,
    
    userMeta: `
      SELECT user_id, meta_key, meta_value
      FROM wp_usermeta
      WHERE meta_key IN (
        'wp_capabilities',
        'billing_phone', 
        'billing_address_1', 
        'billing_city',
        'first_name', 
        'last_name'
      )
      ORDER BY user_id
    `,
  };

  for (const [name, query] of Object.entries(queries)) {
    console.log(`Exporting ${name}...`);
    
    const sqlCommand = query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    const sshCommand = `ssh ${SSH_USER}@${SSH_HOST} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e \\"${sqlCommand}\\" --batch --raw" > ${path.join(EXPORT_DIR, name + '.tsv')}`;
    
    try {
      await execPromise(sshCommand);
      console.log(`  ✅ ${name}.tsv exported\n`);
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}\n`);
    }
  }

  console.log('✅ Export complete!');
  console.log(`📁 Files in: ${EXPORT_DIR}\n`);
}

exportViaSSH().catch(console.error);
