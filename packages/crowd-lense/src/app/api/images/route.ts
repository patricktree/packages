import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getPromotionalImages } from '@/lib/blob';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limitValue = searchParams.get('limit');
    const limit = limitValue ? parseInt(limitValue, 10) : undefined;

    let imageData;
    if (type === 'promo') {
      imageData = await fetchPromotionalImageData({ limit });
    } else if (type === 'user') {
      imageData = await fetchUserImageData({ limit });
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter. Only "promo" is supported.' },
        { status: 400 },
      );
    }

    return NextResponse.json(imageData);
  } catch (error) {
    console.error('Failed to fetch promotional images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

async function fetchPromotionalImageData(opts: { limit?: number }) {
  const promoImages = await getPromotionalImages(opts);
  const promotionalImageData = promoImages.map((image) => {
    const id = createHash('sha256').update(image.pathname).digest('hex');
    return {
      id: id,
      filename: image.pathname,
      blobUrl: image.url,
      uploadTimestamp: image.uploadedAt,
      isPromo: true,
    };
  });
  return promotionalImageData;
}

async function fetchUserImageData(opts: { limit?: number }) {
  const images = await prisma.image.findMany({
    where: { status: 'APPROVED' },
    orderBy: [{ viewCount: 'asc' }, { uploadTimestamp: 'asc' }],
    select: {
      id: true,
      filename: true,
      blobUrl: true,
      uploadTimestamp: true,
    },
    take: opts.limit,
  });

  return images;
}
