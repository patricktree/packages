import { put, list } from '@vercel/blob';
import assert from 'assert';

export async function uploadToBlob(file: File): Promise<{ url: string; filename: string }> {
  assert(process.env.BLOB_READ_WRITE_TOKEN, 'BLOB_READ_WRITE_TOKEN must be set');

  const filename = `user-images/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}-${file.name}`;

  const blob = await put(filename, file, {
    access: 'public',
  });

  return {
    url: blob.url,
    filename: blob.pathname.split('/').pop() || filename,
  };
}

export async function getPromotionalImages(opts: { limit?: number }) {
  assert(process.env.BLOB_READ_WRITE_TOKEN, 'BLOB_READ_WRITE_TOKEN must be set');

  try {
    let { blobs } = await list({
      prefix: 'promotional-images/',
      mode: 'folded',
      limit: opts.limit,
    });

    // returns the folder itself for whatever reason --> filter out all 0 size blobs
    blobs = blobs.filter((blob) => blob.size !== 0);

    return blobs.sort((a, b) => a.pathname.localeCompare(b.pathname));
  } catch (error) {
    console.error('Failed to fetch promotional images:', error);
    return [];
  }
}
