/**
 * CREATE DUMMY USER FOR SEJOLI MIGRATION
 * ========================================
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createDummyUser() {
    try {
        // Check if dummy user exists
        const existing = await prisma.user.findUnique({
            where: { id: 'SEJOLI-MIGRATION' }
        })
        
        if (existing) {
            console.log('✅ Dummy user already exists')
            return
        }
        
        // Create dummy user for migration
        await prisma.user.create({
            data: {
                id: 'SEJOLI-MIGRATION',
                name: 'Sejoli Migration User',
                email: 'sejoli-migration@eksporyuk.com',
                username: 'sejoli-migration',
                role: 'MEMBER_FREE',
                password: 'SEJOLI-MIGRATION-DUMMY' // This won't be used
            }
        })
        
        console.log('✅ Created dummy user for Sejoli migration')
        console.log('   ID: SEJOLI-MIGRATION')
        console.log('   Email: sejoli-migration@eksporyuk.com')
        
    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

createDummyUser()
