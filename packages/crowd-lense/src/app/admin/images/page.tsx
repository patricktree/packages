'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Image as ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type AdminImage = {
  id: string;
  originalFilename: string;
  uploadTimestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  blobUrl: string;
};

const STATUS_STYLES: Record<AdminImage['status'], string> = {
  PENDING: 'bg-yellow-500 text-black',
  APPROVED: 'bg-green-600 text-white',
  REJECTED: 'bg-red-600 text-white',
};

export default function AdminImagesPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | undefined>(undefined);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);

  const {
    data: images = [],
    isLoading,
    error,
  } = useQuery<AdminImage[]>({
    queryKey: ['admin-images', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/admin/images?status=ALL&order=desc');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch images');
      }

      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/admin/images?imageId=${encodeURIComponent(imageId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // The API reports every failure explicitly, so surface its message instead of a generic one.
        const body = await response.json().catch(() => undefined);
        throw new Error(body?.error ?? 'Failed to delete image');
      }

      return response.json();
    },
    onMutate: (imageId) => {
      setDeletingId(imageId);
      setDeleteError(undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-images'] });
    },
    onError: (mutationError: Error) => {
      setDeleteError(mutationError.message);
    },
    onSettled: () => {
      setDeletingId(undefined);
    },
  });

  function handleDelete(image: AdminImage) {
    const confirmed = window.confirm(`Really delete "${image.originalFilename}"?`);
    if (confirmed) {
      deleteMutation.mutate(image.id);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading images...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading images</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Images</h2>
          <p className="text-gray-500 mb-4">Nothing has been uploaded yet.</p>
          <Button asChild variant="outline">
            <Link href="/admin/review">
              <CheckCircle className="w-4 h-4 mr-2" />
              Review
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex justify-between items-center p-4">
        <div>
          <h1 className="text-xl font-bold">All Images</h1>
          <p className="text-sm text-gray-600">{images.length} total</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/review">
            <CheckCircle className="w-4 h-4 mr-2" />
            Review
          </Link>
        </Button>
      </div>

      {deleteError && (
        <div className="mx-4 mb-4 flex items-center justify-between rounded bg-red-100 p-3 text-red-700">
          <p className="text-sm">{deleteError}</p>
          <Button variant="ghost" size="sm" onClick={() => setDeleteError(undefined)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 p-4">
        {images.map((image) => (
          <div key={image.id} className="rounded overflow-hidden bg-white shadow">
            <div className="relative aspect-square">
              <Image
                src={image.blobUrl}
                alt={image.originalFilename}
                fill
                className="object-cover"
                sizes="50vw"
              />
              <Button
                onClick={() => handleDelete(image)}
                variant="destructive"
                size="icon"
                className="absolute bottom-2 right-2 z-10"
                disabled={deletingId === image.id}
                aria-label={`Delete ${image.originalFilename}`}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-2">
              <p className="truncate text-sm font-medium" title={image.originalFilename}>
                {image.originalFilename}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[image.status]}`}
                >
                  {image.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(image.uploadTimestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
