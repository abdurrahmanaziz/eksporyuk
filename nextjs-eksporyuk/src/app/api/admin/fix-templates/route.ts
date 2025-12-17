import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting template type fix...')

    // Update all templates with type NOTIFICATION to EMAIL
    const result = await prisma.brandedTemplate.updateMany({
      where: { type: 'NOTIFICATION' },
      data: { type: 'EMAIL' }
    })

    console.log(`Updated ${result.count} templates`)

    // Get all templates to verify
    const templates = await prisma.brandedTemplate.findMany({
      select: { 
        id: true, 
        name: true, 
        type: true, 
        isActive: true,
        category: true
      }
    })

    console.log('All templates:', templates)

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.count} templates from NOTIFICATION to EMAIL`,
      templates: templates
    })

  } catch (error) {
    console.error('Error fixing templates:', error)
    return NextResponse.json(
      { error: 'Failed to update templates', details: error.message },
      { status: 500 }
    )
  }
}