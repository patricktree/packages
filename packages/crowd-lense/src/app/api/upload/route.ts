import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadToBlob } from '@/lib/blob';
import { validateImageFile } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const files: File[] = data.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 files allowed' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    for (const file of files) {
      try {
        const { url, filename } = await uploadToBlob(file);

        const image = await prisma.image.create({
          data: {
            filename,
            originalFilename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            blobUrl: url,
          },
        });

        results.push({ id: image.id, filename: image.filename });
      } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Upload successful',
      count: results.length,
      files: results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
