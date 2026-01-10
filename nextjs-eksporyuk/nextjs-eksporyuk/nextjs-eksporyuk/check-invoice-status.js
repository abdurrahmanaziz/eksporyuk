const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  console.log('🔍 Checking payment with external ID: 54576e399cd3699d6be335d4412f936e\n');
  
  db.get(
    `SELECT p.*, u.email, u.id as userId, m.name as membershipName 
     FROM "Payment" p 
     LEFT JOIN "User" u ON p.userId = u.id 
     LEFT JOIN "Membership" m ON p.membershipId = m.id 
     WHERE p.externalId = ?`,
    ['54576e399cd3699d6be335d4412f936e'],
    (err, payment) => {
      if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        process.exit(1);
      }
      
      if (payment) {
        console.log('💳 Payment Found:');
        console.log('  Status:', payment.status);
        console.log('  Amount:', payment.amount);
        console.log('  User Email:', payment.email);
        console.log('  User ID:', payment.userId);
        console.log('  Membership:', payment.membershipName);
        console.log('');
        
        // Check invoices
        db.all(
          `SELECT i.*, m.name as membershipName 
           FROM "Invoice" i 
           LEFT JOIN "Membership" m ON i.membershipId = m.id 
           WHERE i.userId = ?
           ORDER BY i.createdAt DESC`,
          [payment.userId],
          (err, invoices) => {
            if (err) {
              console.error('❌ Error:', err.message);
              db.close();
              process.exit(1);
            }
            
            console.log('📄 Invoices:');
            if (invoices.length === 0) {
              console.log('  (no invoices)');
            } else {
              invoices.forEach(inv => {
                console.log(`  - ${inv.membershipName} | Status: ${inv.status} | Amount: ${inv.amount}`);
              });
            }
            console.log('');
            
            // Check user memberships
            db.all(
              `SELECT um.*, m.name as membershipName 
               FROM "UserMembership" um 
               LEFT JOIN "Membership" m ON um.membershipId = m.id 
               WHERE um.userId = ?`,
              [payment.userId],
              (err, memberships) => {
                if (err) {
                  console.error('❌ Error:', err.message);
                  db.close();
                  process.exit(1);
                }
                
                console.log('📋 User Memberships:');
                if (memberships.length === 0) {
                  console.log('  (no memberships)');
                } else {
                  memberships.forEach(m => {
                    console.log(`  - ${m.membershipName} | Status: ${m.status} | Active: ${m.isActive}`);
                  });
                }
                
                db.close();
              }
            );
          }
        );
      } else {
        console.log('❌ Payment not found');
        db.close();
      }
    }
  );
});
