const {PrismaClient}=require('@prisma/client');
const fs=require('fs');
const p=new PrismaClient();

// Default semua product ke 1 Bulan membership
const DEFAULT_MEM='cmj547gmc001ait1en83tmjdc';
const LIFETIME='cmj547h7y001eit1eirlzdklz';
const M12='cmj547h4d001dit1edotcuy8b';
const M6='cmj547h01001cit1e7n2znhuo';
const M3='cmj547gwo001bit1egx205tsi';

const MAP={
  // Lifetime products
  13401:LIFETIME, 3840:LIFETIME, 6068:LIFETIME, 16956:LIFETIME,
  15234:LIFETIME, 17920:LIFETIME, 8910:LIFETIME,
  // 12 Bulan
  8683:M12, 13399:M12, 8915:M12,
  // 6 Bulan
  13400:M6, 8684:M6, 8914:M6,
  // 3 Bulan
  13398:M3,
  // 1 Bulan
  179:DEFAULT_MEM,
  // ALL other products default to 1 Bulan
  28:DEFAULT_MEM, 93:DEFAULT_MEM, 300:DEFAULT_MEM, 397:DEFAULT_MEM, 488:DEFAULT_MEM, 558:DEFAULT_MEM,
  1529:DEFAULT_MEM, 2910:DEFAULT_MEM, 3764:DEFAULT_MEM, 4220:DEFAULT_MEM, 4684:DEFAULT_MEM,
  5928:DEFAULT_MEM, 5932:DEFAULT_MEM, 5935:DEFAULT_MEM, 6810:DEFAULT_MEM, 8686:DEFAULT_MEM,
  11207:DEFAULT_MEM, 12994:DEFAULT_MEM, 13039:DEFAULT_MEM, 13045:DEFAULT_MEM, 13050:DEFAULT_MEM,
  16130:DEFAULT_MEM, 16581:DEFAULT_MEM, 16587:DEFAULT_MEM, 16592:DEFAULT_MEM, 16826:DEFAULT_MEM,
  16860:DEFAULT_MEM, 16963:DEFAULT_MEM, 17227:DEFAULT_MEM, 17322:DEFAULT_MEM, 17767:DEFAULT_MEM,
  18358:DEFAULT_MEM, 18528:DEFAULT_MEM, 18705:DEFAULT_MEM, 18893:DEFAULT_MEM, 19042:DEFAULT_MEM,
  19296:DEFAULT_MEM, 20130:DEFAULT_MEM, 20336:DEFAULT_MEM, 20852:DEFAULT_MEM, 21476:DEFAULT_MEM,
};

const DUR={
  // Lifetime = null
  13401:null, 3840:null, 6068:null, 16956:null, 15234:null, 17920:null, 8910:null,
  // 12 Bulan = 365 days
  8683:365, 13399:365, 8915:365,
  // 6 Bulan = 180 days
  13400:180, 8684:180, 8914:180,
  // 3 Bulan = 90 days
  13398:90,
  // 1 Bulan = 30 days (default for all others)
  179:30, 28:30, 93:30, 300:30, 397:30, 488:30, 558:30, 1529:30, 2910:30, 3764:30, 
  4220:30, 4684:30, 5928:30, 5932:30, 5935:30, 6810:30, 8686:30, 11207:30,
  12994:30, 13039:30, 13045:30, 13050:30, 16130:30, 16581:30, 16587:30, 16592:30,
  16826:30, 16860:30, 16963:30, 17227:30, 17322:30, 17767:30, 18358:30, 18528:30,
  18705:30, 18893:30, 19042:30, 19296:30, 20130:30, 20336:30, 20852:30, 21476:30,
};

(async()=>{
console.log('🔄 IMPORT TRANSACTIONS & MEMBERSHIPS\n');

const jsonPath='/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
const data=JSON.parse(fs.readFileSync(jsonPath,'utf8'));

// Build WP user ID to email mapping
const wpUserMap=new Map();
data.users.forEach(u=>wpUserMap.set(u.id,u.user_email));

// Build email to our DB user ID mapping
const users=await p.user.findMany({select:{id:true,email:true}});
const userMap=new Map(users.map(u=>[u.email,u.id]));

console.log('📦 Orders:',data.orders.length);
console.log('👥 WP Users:',wpUserMap.size);
console.log('👥 DB Users:',userMap.size);
console.log('');

let tx=0,mem=0,aff=0,skip=0,errors=0;
const errorSamples=[];

for(let i=0;i<data.orders.length;i++){
const o=data.orders[i];
try{
// Get email from WP user ID
const email=wpUserMap.get(o.user_id);
if(!email){skip++;continue;}

// Get our DB user ID from email
const uid=userMap.get(email);
if(!uid){skip++;continue;}

const mid=MAP[parseInt(o.product_id)];
if(!mid){skip++;continue;}

// Create transaction
await p.transaction.create({
  data:{
    userId:uid,
    type:'MEMBERSHIP',
    amount:parseFloat(o.grand_total||0),
    status:o.status==='completed'?'SUCCESS':'PENDING',
    description:'Purchase Order #'+o.id,
    metadata:JSON.stringify({orderId:o.id,productId:o.product_id}),
    createdAt:o.created_at?new Date(o.created_at):new Date()
  }
});
tx++;

// Create membership for completed
if(o.status==='completed'){
  const dur=DUR[parseInt(o.product_id)];
  const start=o.created_at?new Date(o.created_at):new Date();
  let exp=null;
  if(dur){exp=new Date(start);exp.setDate(exp.getDate()+dur);}
  
  await p.userMembership.upsert({
    where:{userId:uid},
    update:{membershipId:mid,status:'ACTIVE',startDate:start,expiryDate:exp},
    create:{userId:uid,membershipId:mid,status:'ACTIVE',startDate:start,expiryDate:exp,autoRenew:false}
  });
  mem++;
}

// Affiliate
if(o.affiliate_id && o.affiliate_id>0){
  const affEmail=wpUserMap.get(o.affiliate_id);
  if(affEmail){
    const affUid=userMap.get(affEmail);
    if(affUid){
      await p.affiliateProfile.upsert({
        where:{userId:affUid},
        update:{},
        create:{userId:affUid,isActive:true,approvalStatus:'APPROVED',totalSales:0,totalCommission:0}
      });
      aff++;
    }
  }
}

if((i+1)%1000===0){
  console.log(`✓ ${i+1}/${data.orders.length} | TX:${tx} MEM:${mem} AFF:${aff} SKIP:${skip} ERR:${errors}`);
}

}catch(e){
  errors++;
  if(errorSamples.length<5){
    errorSamples.push({order:o.id,error:e.message});
  }
}
}

console.log('\n═══════════════════════════════════════');
console.log('✅ IMPORT SELESAI!');
console.log('═══════════════════════════════════════');
console.log('💳 Transactions:',tx);
console.log('🎫 Memberships:',mem);
console.log('🤝 Affiliates:',aff);
console.log('⏭️  Skipped:',skip);
console.log('❌ Errors:',errors);

if(errorSamples.length>0){
  console.log('\n📋 Sample Errors:');
  errorSamples.forEach(e=>console.log(`   Order ${e.order}: ${e.error}`));
}

console.log('═══════════════════════════════════════\n');

// Show final count
const [finalTx,finalMem,finalAff]=await Promise.all([
  p.transaction.count(),
  p.userMembership.count(),
  p.affiliateProfile.count()
]);
console.log('🎉 TOTAL DI DATABASE:');
console.log('💳 Transactions:',finalTx.toLocaleString());
console.log('🎫 Memberships:',finalMem.toLocaleString());
console.log('🤝 Affiliates:',finalAff.toLocaleString());
console.log('');

await p.$disconnect();
})();
