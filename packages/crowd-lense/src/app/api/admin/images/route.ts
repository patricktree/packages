import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { ImageStatus, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const isAuthenticated = await authenticateRequest(request);
  if (!isAuthenticated) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin Access"' },
    });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'PENDING';
  const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

  /**
   * `ALL` means "everything an admin should see", which excludes soft-deleted images — those are
   * hidden from the UI and only restorable via the database.
   */
  const where =
    status === 'ALL' ? { status: { not: ImageStatus.DELETED } } : { status: status as ImageStatus };

  try {
    const images = await prisma.image.findMany({
      where,
      orderBy: { uploadTimestamp: order },
      take: status === 'ALL' ? 500 : 50,
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const isAuthenticated = await authenticateRequest(request);
  if (!isAuthenticated) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin Access"' },
    });
  }

  try {
    const body = await request.json();
    const { imageId, status } = body;

    if (!imageId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const image = await prisma.image.update({
      where: { id: imageId },
      data: {
        status,
        reviewTimestamp: new Date(),
      },
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Failed to update image:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

/**
 * Soft delete: flips the status to `DELETED` so the image disappears from the admin grid. The row
 * and the blob are both kept, so the image stays restorable.
 */
export async function DELETE(request: NextRequest) {
  const isAuthenticated = await authenticateRequest(request);
  if (!isAuthenticated) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin Access"' },
    });
  }

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('imageId');

  if (!imageId) {
    return NextResponse.json({ error: 'Missing imageId' }, { status: 400 });
  }

  try {
    await prisma.image.update({
      where: { id: imageId },
      data: { status: ImageStatus.DELETED },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // `P2025` is Prisma's "record to update not found".
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    console.error('Failed to delete image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
