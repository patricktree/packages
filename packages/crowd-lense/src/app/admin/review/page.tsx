'use client';

import { type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminPage() {
  const queryClient = useQueryClient();

  const {
    data: images = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-images'],
    queryFn: async () => {
      const response = await fetch('/api/admin/images?status=PENDING');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch images');
      }

      return response.json();
    },
    refetchInterval: 5000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      imageId,
      status,
    }: {
      imageId: string;
      status: 'APPROVED' | 'REJECTED';
    }) => {
      const response = await fetch('/api/admin/images', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId, status }),
      });

      if (!response.ok) throw new Error('Failed to update image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-images'] });
    },
  });

  function handleReview(status: 'APPROVED' | 'REJECTED') {
    const currentImage = images[0];
    if (currentImage) {
      reviewMutation.mutate({ imageId: currentImage.id, status });
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="text-center py-32">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading images...</p>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="text-center py-32 text-red-600">
          <p>Error loading images</p>
        </div>
      </PageShell>
    );
  }

  if (images.length === 0) {
    return (
      <PageShell>
        <div className="text-center py-32">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Pending Images</h2>
          <p className="text-gray-500">All images have been reviewed!</p>
        </div>
      </PageShell>
    );
  }

  const currentImage = images[0];

  return (
    <PageShell dark subtitle={`${images.length} pending`}>
      {/* Main Image */}
      <div className="relative w-full h-screen flex items-center justify-center">
        <Image
          src={currentImage.blobUrl}
          alt={currentImage.originalFilename}
          fill
          className="object-contain"
          sizes="100vw"
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
        <div className="flex justify-center space-x-4 mb-4">
          <Button
            onClick={() => handleReview('REJECTED')}
            variant="destructive"
            size="lg"
            disabled={reviewMutation.isPending}
          >
            <XCircle className="w-5 h-5 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => handleReview('APPROVED')}
            size="lg"
            disabled={reviewMutation.isPending}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Approve
          </Button>
        </div>

        {/* Image Info */}
        <div className="text-center text-sm text-gray-300">
          <p>{currentImage.originalFilename}</p>
          <p>
            {new Date(currentImage.uploadTimestamp).toLocaleDateString()} •
            {(currentImage.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    </PageShell>
  );
}

/**
 * Rendered by every branch of the page, so the header — and with it the link to the images page —
 * sits in the same place no matter which state the page is in. The reviewing state is a fullscreen
 * black stage, so its header overlays the image; the other states are ordinary light pages.
 */
function PageShell({
  dark = false,
  subtitle,
  children,
}: {
  dark?: boolean;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className={dark ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-gray-100'}>
      <div
        className={
          dark
            ? 'absolute top-0 left-0 right-0 z-10 flex justify-between items-center bg-black bg-opacity-50 p-4'
            : 'flex justify-between items-center p-4'
        }
      >
        <div>
          <h1 className="text-xl font-bold">Admin Review</h1>
          {subtitle && <p className="text-sm text-gray-300">{subtitle}</p>}
        </div>
        <Button asChild variant={dark ? 'secondary' : 'outline'} size="sm">
          <Link href="/admin/images">
            <ImageIcon className="w-4 h-4 mr-2" />
            All Images
          </Link>
        </Button>
      </div>
      {children}
    </div>
  );
}
