import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


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

    // Filter by role if specified - use string contains for JSON field (PostgreSQL compatible)
    // Note: targetRoles is stored as JSON array like ["ADMIN", "MEMBER_FREE"]
    if (role) {
      // Use raw filter for JSON contains in PostgreSQL
      where.targetRoles = {
        string_contains: role
      };
    }

    const [docs, total] = await Promise.all([
      prisma.documentation.findMany({
        where,
        // Note: Relations author, lastEditedBy, parent, children are not defined in schema
        // Query raw data and enrich manually if needed
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.documentation.count({ where })
    ]);

    // Enrich docs with author info if needed
    const enrichedDocs = await Promise.all(docs.map(async (doc) => {
      let author = null;
      let lastEditedBy = null;
      
      if (doc.authorId) {
        author = await prisma.user.findUnique({
          where: { id: doc.authorId },
          select: { id: true, name: true, email: true, avatar: true }
        });
      }
      
      if (doc.lastEditedById) {
        lastEditedBy = await prisma.user.findUnique({
          where: { id: doc.lastEditedById },
          select: { id: true, name: true, email: true, avatar: true }
        });
      }
      
      return {
        ...doc,
        author,
        lastEditedBy
      };
    }));

    return NextResponse.json({
      docs: enrichedDocs,
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
    const existing = await prisma.documentation.findFirst({
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
        id: createId(),
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
        authorId: session.user.id,
        updatedAt: new Date(),
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
        id: createId(),
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
