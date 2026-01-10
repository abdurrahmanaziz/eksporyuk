/**
 * CORRECT IMPORT - Sesuai Data Transaksi Sejoli
 * - Product mapping berdasarkan harga asli
 * - Affiliate HANYA yang dapat komisi (punya completed orders)
 * - Komisi dihitung sesuai aturan (misal: 30% dari harga)
 */

const {PrismaClient}=require('@prisma/client');
const fs=require('fs');
const p=new PrismaClient();

// MAPPING BERDASARKAN HARGA ASLI dari Sejoli
// Berdasarkan analisa: 
// - Rp 1,998,000 = Lifetime (product 13401)
// - Rp 1,797,774 = 12 Bulan (product 8683)
// - Rp 1,398,000 = 6 Bulan (product 13400)
// - Rp 898,754 = Lifetime juga (product 3840)
// - Rp 698,916 = Lifetime juga (product 6068)
// - Rp 398,951 = 1 Bulan (product 179)

const LIFETIME='cmj547h7y001eit1eirlzdklz';
const M12='cmj547h4d001dit1edotcuy8b';
const M6='cmj547h01001cit1e7n2znhuo';
const M3='cmj547gwo001bit1egx205tsi';
const M1='cmj547gmc001ait1en83tmjdc';

// Mapping product ID ke membership berdasarkan HARGA
const PRODUCT_MAP={
  // Lifetime (harga tinggi 800rb - 2jt)
  13401:LIFETIME, 3840:LIFETIME, 6068:LIFETIME, 16956:LIFETIME,
  15234:LIFETIME, 17920:LIFETIME, 8910:LIFETIME,
  // 12 Bulan (harga 1.7jt - 1.8jt)
  8683:M12, 13399:M12, 8915:M12,
  // 6 Bulan (harga 1.3jt - 1.4jt)
  13400:M6, 8684:M6, 8914:M6,
  // 3 Bulan
  13398:M3,
  // 1 Bulan (harga 300rb - 400rb)
  179:M1,
};

// Products yang harga 0 atau kecil (promo/gratis) = 1 bulan
const PROMO_PRODUCTS=[16963,17322,8915,16130,17767,488,18358,16587,16592,16826,16860,17227,18705,18893,19042,19296,20130,20336,20852,21476];
PROMO_PRODUCTS.forEach(pid => PRODUCT_MAP[pid] = M1);

// Products lain default 1 bulan
[28,93,300,397,558,1529,2910,3764,4220,4684,5928,5932,5935,6810,8686,11207,12994,13039,13045,13050,18528].forEach(pid => PRODUCT_MAP[pid] = M1);

const DURATION_MAP={
  [LIFETIME]: null, // Lifetime
  [M12]: 365, [M6]: 180, [M3]: 90, [M1]: 30
};

// COMMISSION RATE - sesuaikan dengan aturan Anda
const COMMISSION_RATE = 0.30; // 30%

(async()=>{
console.log('🔄 CORRECT IMPORT - SESUAI DATA SEJOLI\n');

const jsonPath='/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
const data=JSON.parse(fs.readFileSync(jsonPath,'utf8'));

// Build mappings
const wpUserMap=new Map();
data.users.forEach(u=>wpUserMap.set(u.id,u.user_email));

const users=await p.user.findMany({select:{id:true,email:true}});
const userMap=new Map(users.map(u=>[u.email,u.id]));

console.log('📦 Orders:',data.orders.length);
console.log('👥 WP Users:',wpUserMap.size);
console.log('👥 DB Users:',userMap.size);
console.log('');

let tx=0,mem=0,affProfiles=0,affComm=0,skip=0,errors=0;
const errorSamples=[];

// Track affiliates dengan completed orders (yang benar-benar dapat komisi)
const affiliateStats = new Map(); // userId => {orders: [], totalCommission: 0}

for(let i=0;i<data.orders.length;i++){
const o=data.orders[i];
try{
// Get buyer user
const email=wpUserMap.get(o.user_id);
if(!email){skip++;continue;}

const uid=userMap.get(email);
if(!uid){skip++;continue;}

const mid=PRODUCT_MAP[parseInt(o.product_id)];
if(!mid){skip++;continue;}

const amount=parseFloat(o.grand_total||0);

// Create transaction
await p.transaction.create({
  data:{
    userId:uid,
    type:'MEMBERSHIP',
    amount:amount,
    status:o.status==='completed'?'SUCCESS':'PENDING',
    description:`Purchase Order #${o.id} - Product ${o.product_id}`,
    metadata:JSON.stringify({orderId:o.id,productId:o.product_id,affiliateId:o.affiliate_id}),
    createdAt:o.created_at?new Date(o.created_at):new Date()
  }
});
tx++;

// Create membership for completed orders
if(o.status==='completed'){
  const dur=DURATION_MAP[mid];
  const start=o.created_at?new Date(o.created_at):new Date();
  let exp=null;
  if(dur){exp=new Date(start);exp.setDate(exp.getDate()+dur);}
  
  await p.userMembership.upsert({
    where:{userId:uid},
    update:{membershipId:mid,status:'ACTIVE',startDate:start,expiryDate:exp},
    create:{userId:uid,membershipId:mid,status:'ACTIVE',startDate:start,expiryDate:exp,autoRenew:false}
  });
  mem++;
  
  // Track affiliate untuk completed orders dengan komisi
  if(o.affiliate_id && o.affiliate_id > 0 && amount > 0){
    const affEmail=wpUserMap.get(o.affiliate_id);
    if(affEmail){
      const affUid=userMap.get(affEmail);
      if(affUid){
        const commission = amount * COMMISSION_RATE;
        
        if(!affiliateStats.has(affUid)){
          affiliateStats.set(affUid, {orders:[], totalCommission:0});
        }
        
        const stats = affiliateStats.get(affUid);
        stats.orders.push(o.id);
        stats.totalCommission += commission;
      }
    }
  }
}

if((i+1)%1000===0){
  console.log(`✓ ${i+1}/${data.orders.length} | TX:${tx} MEM:${mem} SKIP:${skip} ERR:${errors}`);
}

}catch(e){
  errors++;
  if(errorSamples.length<3){
    errorSamples.push({order:o.id,error:e.message});
  }
}
}

console.log('\n🤝 CREATING AFFILIATE PROFILES (Only who got commission)...');

// Create affiliate profiles HANYA untuk yang dapat komisi
for(const [userId, stats] of affiliateStats.entries()){
  try{
    // Create affiliate profile
    await p.affiliateProfile.upsert({
      where:{userId},
      update:{},
      create:{
        userId,
        isActive:true,
        approvalStatus:'APPROVED',
        totalSales:0,
        totalCommission:0,
      }
    });
    
    // Update wallet dengan total komisi
    await p.wallet.update({
      where:{userId},
      data:{
        balance:{increment:stats.totalCommission},
        totalEarnings:{increment:stats.totalCommission},
      }
    });
    
    affProfiles++;
    affComm += stats.totalCommission;
    
    if(affProfiles % 10 === 0){
      console.log(`   ✓ ${affProfiles} affiliates, Total commission: Rp ${(affComm/1000000).toFixed(2)}M`);
    }
  }catch(e){
    // Skip
  }
}

console.log('\n═══════════════════════════════════════');
console.log('✅ IMPORT SELESAI!');
console.log('═══════════════════════════════════════');
console.log('💳 Transactions:',tx);
console.log('🎫 Memberships:',mem);
console.log('🤝 Affiliate Profiles:',affProfiles,'(yang dapat komisi)');
console.log('💰 Total Commission:','Rp',(affComm/1000000).toFixed(2),'Juta');
console.log('⏭️  Skipped:',skip);
console.log('❌ Errors:',errors);

if(errorSamples.length>0){
  console.log('\n📋 Sample Errors:');
  errorSamples.forEach(e=>console.log(`   Order ${e.order}: ${e.error}`));
}

console.log('═══════════════════════════════════════\n');

// Final count
const [finalTx,finalMem,finalAff]=await Promise.all([
  p.transaction.count(),
  p.userMembership.count(),
  p.affiliateProfile.count()
]);
console.log('🎉 TOTAL IN DATABASE:');
console.log('💳 Transactions:',finalTx.toLocaleString());
console.log('🎫 Memberships:',finalMem.toLocaleString());
console.log('🤝 Affiliates:',finalAff.toLocaleString());
console.log('');

await p.$disconnect();
})();
