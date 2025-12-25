import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get published documentation for public access (role-filtered)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const role = searchParams.get('role');
    const slug = searchParams.get('slug');

    // Get session to check user role
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role || 'MEMBER_FREE';

    const where: any = {
      status: 'PUBLISHED'
    };

    // Filter by slug for single doc
    if (slug) {
      where.slug = slug;
      
      const doc = await prisma.documentation.findFirst({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          children: {
            where: {
              status: 'PUBLISHED'
            },
            select: {
              id: true,
              slug: true,
              title: true,
              icon: true,
              order: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      if (!doc) {
        return NextResponse.json(
          { error: 'Documentation not found' },
          { status: 404 }
        );
      }

      // Check role access
      const targetRoles = doc.targetRoles as string[];
      const hasAccess = doc.isPublic || targetRoles.includes(userRole) || !session;

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You do not have access to this documentation' },
          { status: 403 }
        );
      }

      // Increment view count
      await prisma.documentation.update({
        where: { id: doc.id },
        data: {
          viewCount: {
            increment: 1
          }
        }
      });

      return NextResponse.json({ doc });
    }

    // List all docs - filter by category if specified
    if (category) where.category = category;

    // Get all published docs first, then filter by role in JS (SQLite doesn't support JSON queries)
    const allDocs = await prisma.documentation.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        targetRoles: true,
        status: true,
        isPublic: true,
        icon: true,
        order: true,
        parentId: true,
        featuredImage: true,
        publishedAt: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
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
            email: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { publishedAt: 'desc' }
      ]
    });

    // Filter docs based on user's role (manual filtering for SQLite compatibility)
    let docs = allDocs;
    
    if (role) {
      // Filter by specific role
      docs = allDocs.filter(doc => {
        const targetRoles = (doc.targetRoles as string[]) || [];
        return targetRoles.includes(role);
      });
    } else if (session?.user) {
      // Show docs that target user's role or are public
      docs = allDocs.filter(doc => {
        const targetRoles = (doc.targetRoles as string[]) || [];
        return doc.isPublic || targetRoles.includes(userRole);
      });
    } else {
      // Not logged in - only show public docs
      docs = allDocs.filter(doc => doc.isPublic);
    }

    // Group docs by category
    const grouped = docs.reduce((acc: any, doc) => {
      const cat = doc.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(doc);
      return acc;
    }, {});

    return NextResponse.json({
      docs,
      grouped,
      userRole
    });
  } catch (error: any) {
    console.error('Error fetching public documentation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentation', details: error.message },
      { status: 500 }
    );
  }
}
