import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get single documentation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const doc = await prisma.documentation.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        lastEditedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        parent: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        revisions: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            version: 'desc'
          },
          take: 10
        }
      }
    });

    if (!doc) {
      return NextResponse.json(
        { error: 'Documentation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ doc });
  } catch (error: any) {
    console.error('Error fetching documentation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentation', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update documentation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      slug,
      title,
      content,
      excerpt,
      category,
      targetRoles,
      status,
      isPublic,
      icon,
      order,
      parentId,
      metaTitle,
      metaDescription,
      keywords,
      featuredImage,
      changeNote
    } = body;

    // Check if doc exists
    const existing = await prisma.documentation.findUnique({
      where: { id: params.id },
      include: {
        revisions: {
          orderBy: {
            version: 'desc'
          },
          take: 1
        }
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Documentation not found' },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.documentation.findUnique({
        where: { slug }
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists. Please use a unique slug.' },
          { status: 400 }
        );
      }
    }

    // Validate targetRoles
    const validRoles = ['ADMIN', 'FOUNDER', 'CO_FOUNDER', 'MENTOR', 'AFFILIATE', 'MEMBER_PREMIUM', 'MEMBER_FREE'];
    if (targetRoles && Array.isArray(targetRoles)) {
      const invalidRoles = targetRoles.filter((role: string) => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          { error: `Invalid roles: ${invalidRoles.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      lastEditedById: session.user.id,
      updatedAt: new Date()
    };

    if (slug !== undefined) updateData.slug = slug;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (category !== undefined) updateData.category = category;
    if (targetRoles !== undefined) updateData.targetRoles = targetRoles;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (icon !== undefined) updateData.icon = icon;
    if (order !== undefined) updateData.order = order;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;

    // Handle status change
    if (status !== undefined) {
      updateData.status = status;
      
      // Set publishedAt if publishing
      if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }
      
      // Set archivedAt if archiving
      if (status === 'ARCHIVED' && existing.status !== 'ARCHIVED') {
        updateData.archivedAt = new Date();
      }
    }

    // Update documentation
    const doc = await prisma.documentation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        lastEditedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Create revision if content changed
    if (content !== undefined && content !== existing.content) {
      const latestVersion = existing.revisions[0]?.version || 0;
      
      await prisma.documentationRevision.create({
        data: {
          documentationId: doc.id,
          content: content,
          title: title || existing.title,
          excerpt: excerpt || existing.excerpt,
          changedById: session.user.id,
          changeNote: changeNote || 'Content updated',
          version: latestVersion + 1
        }
      });
    }

    return NextResponse.json({
      message: 'Documentation updated successfully',
      doc
    });
  } catch (error: any) {
    console.error('Error updating documentation:', error);
    return NextResponse.json(
      { error: 'Failed to update documentation', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete documentation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Check if doc exists
    const existing = await prisma.documentation.findUnique({
      where: { id: params.id },
      include: {
        children: true
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Documentation not found' },
        { status: 404 }
      );
    }

    // Check if has children
    if (existing.children.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete documentation with child documents. Please delete or reassign child documents first.',
          childrenCount: existing.children.length
        },
        { status: 400 }
      );
    }

    // Delete documentation (revisions will cascade delete)
    await prisma.documentation.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Documentation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting documentation:', error);
    return NextResponse.json(
      { error: 'Failed to delete documentation', details: error.message },
      { status: 500 }
    );
  }
}
