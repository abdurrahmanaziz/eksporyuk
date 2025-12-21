const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserMembershipCreate() {
  try {
    console.log('Testing UserMembership creation...');
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'derryking914@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    // Get a membership
    const membership = await prisma.membership.findFirst({
      where: { isActive: true }
    });
    
    if (!membership) {
      console.log('No membership found');
      return;
    }
    
    console.log('Testing with user:', user.id);
    console.log('Testing with membership:', membership.id);
    
    // Test UserMembership create with required fields
    const expiryDate = new Date('2099-12-31T23:59:59Z'); // Far future date for LIFETIME
    
    const testData = {
      userId: user.id,
      membershipId: membership.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: expiryDate
    };
    
    console.log('Creating UserMembership with data:', testData);
    
    const userMembership = await prisma.userMembership.create({
      data: testData
    });
    
    console.log('UserMembership created successfully:', userMembership.id);
    
    // Clean up - delete the test membership
    await prisma.userMembership.delete({
      where: { id: userMembership.id }
    });
    
    console.log('Test UserMembership cleaned up');
    
  } catch (error) {
    console.error('Error details:', error);
    if (error.code) {
      console.log('Error code:', error.code);
    }
    if (error.meta) {
      console.log('Error meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testUserMembershipCreate();