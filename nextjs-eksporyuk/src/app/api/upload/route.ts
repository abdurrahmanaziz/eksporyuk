import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

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

    // Validate file type
    let allowedTypes: string[] = [];
    switch (type) {
      case 'image':
        allowedTypes = ALLOWED_IMAGE_TYPES;
        break;
      case 'video':
        allowedTypes = ALLOWED_VIDEO_TYPES;
        break;
      case 'document':
        allowedTypes = ALLOWED_DOCUMENT_TYPES;
        break;
      default:
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      console.log('❌ File type not allowed:', file.type, 'Expected:', allowedTypes)
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    console.log('✅ File validation passed, proceeding with upload...')

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory structure
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
    console.log('📁 Upload directory:', uploadDir)
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log('📁 Created upload directory')
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
    const fileExtension = path.extname(originalName);
    const fileName = `${timestamp}-${path.basename(originalName, fileExtension)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    console.log('💾 Saving file to:', filePath)

    // Save file
    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/uploads/${type}/${fileName}`;

    console.log('🎉 Upload successful:', publicUrl)

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