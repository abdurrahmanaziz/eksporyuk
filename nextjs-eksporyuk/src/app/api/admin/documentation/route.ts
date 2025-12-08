import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

// GET - List all documentation with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by role if specified
    if (role) {
      where.targetRoles = {
        path: '$',
        array_contains: role
      };
    }

    const [docs, total] = await Promise.all([
      prisma.documentation.findMany({
        where,
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
              status: true
            }
          },
          _count: {
            select: {
              revisions: true
            }
          }
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.documentation.count({ where })
    ]);

    return NextResponse.json({
      docs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching documentation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documentation', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new documentation
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
      featuredImage
    } = body;

    // Validation
    if (!slug || !title || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, content, category' },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.documentation.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists. Please use a unique slug.' },
        { status: 400 }
      );
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

    // Create documentation
    const doc = await prisma.documentation.create({
      data: {
        slug,
        title,
        content,
        excerpt,
        category,
        targetRoles: targetRoles || [],
        status: status || 'DRAFT',
        isPublic: isPublic || false,
        icon,
        order: order || 0,
        parentId,
        metaTitle,
        metaDescription,
        keywords,
        featuredImage,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Create initial revision
    await prisma.documentationRevision.create({
      data: {
        documentationId: doc.id,
        content,
        title,
        excerpt,
        changedById: session.user.id,
        changeNote: 'Initial creation',
        version: 1
      }
    });

    return NextResponse.json({
      message: 'Documentation created successfully',
      doc
    });
  } catch (error: any) {
    console.error('Error creating documentation:', error);
    return NextResponse.json(
      { error: 'Failed to create documentation', details: error.message },
      { status: 500 }
    );
  }
}
