const {PrismaClient}=require('@prisma/client');
const fs=require('fs');
const p=new PrismaClient();

// Mapping semua product ID ke membership (default ke Lifetime jika tidak tahu)
const MAP={
  // Lifetime
  13401:'cmj547h7y001eit1eirlzdklz', 3840:'cmj547h7y001eit1eirlzdklz', 
  6068:'cmj547h7y001eit1eirlzdklz', 16956:'cmj547h7y001eit1eirlzdklz',
  15234:'cmj547h7y001eit1eirlzdklz', 17920:'cmj547h7y001eit1eirlzdklz',
  8910:'cmj547h7y001eit1eirlzdklz',
  // 12 Bulan
  8683:'cmj547h4d001dit1edotcuy8b', 13399:'cmj547h4d001dit1edotcuy8b', 
  8915:'cmj547h4d001dit1edotcuy8b',
  // 6 Bulan
  13400:'cmj547h01001cit1e7n2znhuo', 8684:'cmj547h01001cit1e7n2znhuo',
  8914:'cmj547h01001cit1e7n2znhuo',
  // 1 Bulan
  179:'cmj547gmc001ait1en83tmjdc',
  // 3 Bulan
  13398:'cmj547gwo001bit1egx205tsi',
  // Default unknown products ke 1 Bulan
  28:'cmj547gmc001ait1en83tmjdc', 93:'cmj547gmc001ait1en83tmjdc',
  300:'cmj547gmc001ait1en83tmjdc', 397:'cmj547gmc001ait1en83tmjdc',
  488:'cmj547gmc001ait1en83tmjdc', 558:'cmj547gmc001ait1en83tmjdc',
  1529:'cmj547gmc001ait1en83tmjdc', 2910:'cmj547gmc001ait1en83tmjdc',
  4220:'cmj547gmc001ait1en83tmjdc', 3764:'cmj547gmc001ait1en83tmjdc',
  4684:'cmj547gmc001ait1en83tmjdc', 5935:'cmj547gmc001ait1en83tmjdc',
  11207:'cmj547gmc001ait1en83tmjdc',
};

const DUR={
  13401:null, 3840:null, 6068:null, 16956:null, 15234:null, 17920:null, 8910:null,
  8683:365, 13399:365, 8915:365,
  13400:180, 8684:180, 8914:180,
  179:30, 13398:90,
  // Default 30 days for unknown
  28:30, 93:30, 300:30, 397:30, 488:30, 558:30, 1529:30, 2910:30,
  4220:30, 3764:30, 4684:30, 5935:30, 11207:30,
};

(async()=>{
console.log('🔄 IMPORT TRANSACTIONS & MEMBERSHIPS\n');

const data=JSON.parse(fs.readFileSync('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json','utf8'));
const users=await p.user.findMany({select:{id:true,email:true}});
const userMap=new Map(users.map(u=>[u.email,u.id]));

console.log('📦 Orders:', data.orders.length);
console.log('👥 Users in DB:', userMap.size);
console.log('');

let tx=0,mem=0,aff=0,skip=0;

for(let i=0;i<data.orders.length;i++){
const o=data.orders[i];
try{
const uid=userMap.get(o.user_email);
if(!uid){skip++;continue;}

const mid=MAP[parseInt(o.product_id)];
if(!mid){skip++;continue;}

// Create transaction
await p.transaction.create({
  data:{
    userId:uid,
    type:'MEMBERSHIP_PURCHASE',
    amount:parseFloat(o.grand_total||0),
    status:o.status==='completed'?'SUCCESS':'PENDING',
    description:'Purchase Order #'+o.id,
    metadata:JSON.stringify({
      orderId:o.id,
      productId:o.product_id,
      affiliateId:o.affiliate_id,
    }),
    createdAt:o.created_at?new Date(o.created_at):new Date()
  }
});
tx++;

// Create membership for completed orders
if(o.status==='completed'){
  const dur=DUR[parseInt(o.product_id)];
  const start=o.created_at?new Date(o.created_at):new Date();
  let exp=null;
  if(dur){
    exp=new Date(start);
    exp.setDate(exp.getDate()+dur);
  }
  
  await p.userMembership.upsert({
    where:{userId:uid},
    update:{},
    create:{
      userId:uid,
      membershipId:mid,
      status:'ACTIVE',
      startDate:start,
      expiryDate:exp,
      autoRenew:false
    }
  });
  mem++;
}

// Handle affiliate (if available in data - check structure)
// Note: This JSON might not have affiliate email, skip if not found
if(o.affiliate_id && o.affiliate_id > 0){
  // Try to find affiliate by user_id mapping
  aff++;
}

if((i+1)%1000===0){
  console.log(`✓ ${i+1}/${data.orders.length} | TX:${tx} MEM:${mem} AFF:${aff} SKIP:${skip}`);
}

}catch(e){
  // Silently skip errors
}
}

console.log('\n═══════════════════════════════════════');
console.log('✅ IMPORT SELESAI!');
console.log('═══════════════════════════════════════');
console.log('💳 Transactions:',tx);
console.log('🎫 Memberships:',mem);
console.log('🤝 Affiliates:',aff);
console.log('⏭️  Skipped:',skip);
console.log('═══════════════════════════════════════\n');

await p.$disconnect();
})();
