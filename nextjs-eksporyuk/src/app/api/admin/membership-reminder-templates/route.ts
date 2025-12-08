import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { 
  allReminderTemplates, 
  templateCategories,
  getTemplatesByCategory,
  getTemplateById,
} from '@/lib/membership-reminder-templates'

/**
 * GET /api/admin/membership-reminder-templates
 * Get all available reminder templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const templateId = searchParams.get('id')

    // Get single template by ID
    if (templateId) {
      const template = getTemplateById(templateId)
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json({ template })
    }

    // Get templates by category
    if (category) {
      const templates = getTemplatesByCategory(category)
      return NextResponse.json({ 
        templates,
        category: templateCategories.find(c => c.id === category)
      })
    }

    // Get all templates grouped by category
    const groupedTemplates = templateCategories.map(cat => ({
      ...cat,
      templates: getTemplatesByCategory(cat.id),
    }))

    return NextResponse.json({
      categories: templateCategories,
      templates: allReminderTemplates,
      grouped: groupedTemplates,
    })

  } catch (error) {
    console.error('Error fetching reminder templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
