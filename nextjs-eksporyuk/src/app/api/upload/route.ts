import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/octet-stream', // Fallback for unknown types
];

// Extension-based validation as fallback
const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.zip', '.rar', '.7z'
];

// Check if Vercel Blob is configured
const isVercelBlobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Upload API called')
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string; // 'image', 'video', 'document', 'logo', 'banner'

    console.log('📄 Upload details:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type, 
      uploadType 
    })

    if (!file) {
      console.log('❌ No file received')
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      console.log('❌ File too large:', file.size)
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Map logo and banner to image type for validation and storage
    const type = (uploadType === 'logo' || uploadType === 'banner') ? 'image' : uploadType;

    // Get file extension for fallback validation
    const fileExtension = path.extname(file.name).toLowerCase();

    // Validate file type
    let allowedTypes: string[] = [];
    let isValidByExtension = false;
    
    switch (type) {
      case 'image':
        allowedTypes = ALLOWED_IMAGE_TYPES;
        break;
      case 'video':
        allowedTypes = ALLOWED_VIDEO_TYPES;
        break;
      case 'document':
        allowedTypes = ALLOWED_DOCUMENT_TYPES;
        // Also check by extension for documents (browsers sometimes report wrong MIME type)
        isValidByExtension = ALLOWED_DOCUMENT_EXTENSIONS.includes(fileExtension);
        break;
      default:
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // For documents: allow if MIME type matches OR extension matches
    const isValidMimeType = allowedTypes.includes(file.type);
    const isValid = type === 'document' ? (isValidMimeType || isValidByExtension) : isValidMimeType;

    if (!isValid) {
      console.log('❌ File type not allowed:', file.type, 'Extension:', fileExtension, 'Expected types:', allowedTypes)
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    console.log('✅ File validation passed, proceeding with upload...')

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const fileName = `${timestamp}-${path.basename(originalName, fileExtension)}${fileExtension}`;

    let publicUrl: string;

    // Use Vercel Blob in production, local storage in development
    if (isVercelBlobConfigured) {
      // Upload to Vercel Blob (cloud storage - persists in production!)
      const blob = await put(`uploads/${type}/${fileName}`, file, {
        access: 'public',
        addRandomSuffix: false,
      });
      publicUrl = blob.url;
      console.log('🎉 Upload to Vercel Blob successful:', publicUrl);
    } else {
      // Fallback to local storage for development
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
      console.log('📁 Upload directory:', uploadDir);
      
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
        console.log('📁 Created upload directory');
      }

      const filePath = path.join(uploadDir, fileName);
      console.log('💾 Saving file to:', filePath);
      await writeFile(filePath, buffer);

      // For local dev
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      publicUrl = `${appUrl}/uploads/${type}/${fileName}`;
      console.log('🎉 Local upload successful:', publicUrl);
    }

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}