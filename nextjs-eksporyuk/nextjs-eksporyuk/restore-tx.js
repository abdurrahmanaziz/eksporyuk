const {PrismaClient}=require('@prisma/client');
const fs=require('fs');
const p=new PrismaClient();

const MAP={'13401':'cmj547h7y001eit1eirlzdklz','3840':'cmj547h7y001eit1eirlzdklz','6068':'cmj547h7y001eit1eirlzdklz','16956':'cmj547h7y001eit1eirlzdklz','15234':'cmj547h7y001eit1eirlzdklz','17920':'cmj547h7y001eit1eirlzdklz','8910':'cmj547h7y001eit1eirlzdklz','8683':'cmj547h4d001dit1edotcuy8b','13399':'cmj547h4d001dit1edotcuy8b','8915':'cmj547h4d001dit1edotcuy8b','13400':'cmj547h01001cit1e7n2znhuo','8684':'cmj547h01001cit1e7n2znhuo','8914':'cmj547h01001cit1e7n2znhuo','179':'cmj547gmc001ait1en83tmjdc','13398':'cmj547gwo001bit1egx205tsi'};

const DUR={'13401':null,'3840':null,'6068':null,'16956':null,'15234':null,'17920':null,'8910':null,'8683':365,'13399':365,'8915':365,'13400':180,'8684':180,'8914':180,'179':30,'13398':90};

(async()=>{
const data=JSON.parse(fs.readFileSync('./scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json','utf8'));
const users=await p.user.findMany({select:{id:true,email:true}});
const userMap=new Map(users.map(u=>[u.email,u.id]));

console.log('🔄 Processing',data.orders.length,'orders...\n');
let tx=0,mem=0,aff=0;

for(let i=0;i<data.orders.length;i++){
const o=data.orders[i];
try{
const uid=userMap.get(o.user_email);
if(!uid)continue;
const mid=MAP[o.product_id];
if(!mid)continue;

await p.transaction.create({data:{userId:uid,type:'MEMBERSHIP_PURCHASE',amount:parseFloat(o.grand_total||o.total||0),status:o.status==='completed'?'SUCCESS':'PENDING',description:'Purchase '+(o.product_name||'Membership'),metadata:JSON.stringify({orderId:o.order_id,productId:o.product_id}),createdAt:o.order_date?new Date(o.order_date):new Date()}});
tx++;

if(o.status==='completed'){
const dur=DUR[o.product_id];
const start=o.order_date?new Date(o.order_date):new Date();
let exp=null;
if(dur){exp=new Date(start);exp.setDate(exp.getDate()+dur);}
await p.userMembership.upsert({where:{userId:uid},update:{},create:{userId:uid,membershipId:mid,status:'ACTIVE',startDate:start,expiryDate:exp,autoRenew:false}});
mem++;
}

if(o.affiliate_email&&parseFloat(o.affiliate_commission||0)>0){
const aid=userMap.get(o.affiliate_email);
if(aid){
await p.affiliateProfile.upsert({where:{userId:aid},update:{},create:{userId:aid,isActive:true,approvalStatus:'APPROVED',totalSales:0,totalCommission:0}});
if(o.status==='completed'){
await p.wallet.update({where:{userId:aid},data:{balance:{increment:parseFloat(o.affiliate_commission)},totalEarnings:{increment:parseFloat(o.affiliate_commission)}}});
aff++;
}}}

if((i+1)%1000===0)console.log('✓ Progress:',(i+1)+'/',data.orders.length,'| TX:',tx,'MEM:',mem,'AFF:',aff);
}catch(e){}
}

console.log('\n✅ IMPORT SELESAI!');
console.log('💳 Transactions:',tx);
console.log('🎫 Memberships:',mem);
console.log('🤝 Affiliate Commissions:',aff);
await p.$disconnect();
})();
