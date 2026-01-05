const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickUserCheck() {
  try {
    console.log('QUICK USER CHECK\n');
    
    // Check for users with email azizbiasa@gmail.com
    const azizUsers = await prisma.user.count({
      where: { email: 'azizbiasa@gmail.com' }
    });
    
    console.log(`Users with azizbiasa@gmail.com: ${azizUsers}`);
    
    // Check for users with name containing Sambung Dakwah
    const sambungCount = await prisma.user.count({
      where: { name: { contains: 'Sambung Dakwah' } }
    });
    
    console.log(`Users with name Sambung Dakwah: ${sambungCount}`);
    
    // Check for users with name containing Abdurrahman Aziz  
    const abdurrahmanCount = await prisma.user.count({
      where: { name: { contains: 'Abdurrahman Aziz' } }
    });
    
    console.log(`Users with name Abdurrahman Aziz: ${abdurrahmanCount}`);
    
    // Find the problematic user
    const problemUser = await prisma.user.findFirst({
      where: { 
        AND: [
          { email: 'azizbiasa@gmail.com' },
          { name: { contains: 'Sambung Dakwah' } }
        ]
      }
    });
    
    if (problemUser) {
      console.log(`\nPROBLEM USER FOUND:`);
      console.log(`ID: ${problemUser.id}`);
      console.log(`Name: ${problemUser.name}`);
      console.log(`Email: ${problemUser.email}`);
      console.log(`Should update name to: Abdurrahman Aziz`);
    } else {
      console.log('\nNo problem user with Sambung Dakwah name + azizbiasa email');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

quickUserCheck();