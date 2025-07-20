import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const imageId = params.id;

    // Skip incrementing view count for promotional images
    if (imageId.startsWith('promo-')) {
      return NextResponse.json({ isPromo: true });
    }

    const image = await prisma.image.update({
      where: { id: imageId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        viewCount: true,
      },
    });

    return NextResponse.json({ viewCount: image.viewCount });
  } catch (error) {
    console.error('Failed to increment view count:', error);
    return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
  }
}
