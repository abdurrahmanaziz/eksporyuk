const fs = require("fs");
const data = JSON.parse(fs.readFileSync("scripts/migration/wp-data/sejolisa-export-100users-1765248491032.json", "utf8"));

// Check users with their IDs
console.log("Sample users from export:");
data.users.slice(0, 5).forEach(u => {
  console.log("  WP ID:", u.ID, "| Email:", u.user_email);
});

// Check orders with their user_ids
console.log("\nSample orders from export:");
data.orders.slice(0, 5).forEach(o => {
  console.log("  Order:", o.id, "| User WP ID:", o.user_id, "| Status:", o.status);
});

// Get unique user_ids from orders
const orderUserIds = [...new Set(data.orders.map(o => o.user_id))];
console.log("\nUnique user IDs in orders:", orderUserIds.length);
console.log("User IDs in users export:", data.users.length);

// Find user_ids in orders that are not in users
const userWpIds = new Set(data.users.map(u => u.ID));
const missingUsers = orderUserIds.filter(id => !userWpIds.has(id));
console.log("\nOrder user_ids NOT in users export:", missingUsers.length);
console.log("Missing IDs sample:", missingUsers.slice(0, 10));

// Check what are the user IDs in the export
console.log("\nAll user WP IDs:", Array.from(userWpIds).slice(0, 20));
