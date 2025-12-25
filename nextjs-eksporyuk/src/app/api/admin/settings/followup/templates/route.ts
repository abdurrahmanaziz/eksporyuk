import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Create new template
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await request.json()

    // Get existing templates
    const templatesRecord = await prisma.setting.findFirst({
      where: { key: 'followup_templates' },
    })

    const templates = templatesRecord?.value ? JSON.parse(templatesRecord.value as string) : []

    // Add new template
    const newTemplate = {
      id: randomUUID(),
      ...template,
      order: templates.length + 1,
      createdAt: new Date().toISOString(),
    }

    templates.push(newTemplate)

    // Save templates
    await prisma.setting.upsert({
      where: { key: 'followup_templates' },
      update: { value: JSON.stringify(templates) },
      create: { key: 'followup_templates', value: JSON.stringify(templates) },
    })

    return NextResponse.json({ success: true, template: newTemplate })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
