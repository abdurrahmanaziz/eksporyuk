import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// POST - Bulk actions (publish, archive, delete)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, documentIds } = body;

    if (!action || !documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: action and documentIds array' },
        { status: 400 }
      );
    }

    const validActions = ['publish', 'archive', 'draft', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'publish':
        result = await prisma.documentation.updateMany({
          where: {
            id: {
              in: documentIds
            }
          },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date()
          }
        });
        break;

      case 'archive':
        result = await prisma.documentation.updateMany({
          where: {
            id: {
              in: documentIds
            }
          },
          data: {
            status: 'ARCHIVED',
            archivedAt: new Date()
          }
        });
        break;

      case 'draft':
        result = await prisma.documentation.updateMany({
          where: {
            id: {
              in: documentIds
            }
          },
          data: {
            status: 'DRAFT'
          }
        });
        break;

      case 'delete':
        // Check for children first
        const docsWithChildren = await prisma.documentation.findMany({
          where: {
            id: {
              in: documentIds
            }
          },
          include: {
            children: true
          }
        });

        const blockedDocs = docsWithChildren.filter(doc => doc.children.length > 0);
        
        if (blockedDocs.length > 0) {
          return NextResponse.json(
            { 
              error: 'Some documents have child documents and cannot be deleted',
              blockedDocs: blockedDocs.map(doc => ({
                id: doc.id,
                title: doc.title,
                childrenCount: doc.children.length
              }))
            },
            { status: 400 }
          );
        }

        result = await prisma.documentation.deleteMany({
          where: {
            id: {
              in: documentIds
            }
          }
        });
        break;
    }

    return NextResponse.json({
      message: `Bulk ${action} completed successfully`,
      affectedCount: result.count || documentIds.length
    });
  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action', details: error.message },
      { status: 500 }
    );
  }
}
