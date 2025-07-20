'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';

type CarouselImage = {
  id: string;
  filename: string;
  blobUrl: string;
  isPromo?: boolean;
};

export default function CarouselPage() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    async function dropFirstImageAndLoadNext() {
      setImages((currentImages) => {
        if (currentImages.length === 0) return currentImages;
        // Remove the first image and return the rest
        const imagesWithFirstRemoved = currentImages.slice(1);
        return imagesWithFirstRemoved;
      });

      const [currentTopXImagesResponse, promotionalImagesResponse] = await Promise.all([
        fetch('/api/images?type=user&limit=7'),
        fetch('/api/images?type=promo'),
      ]);
      if (!currentTopXImagesResponse.ok) throw new Error('Failed to fetch images');
      if (!promotionalImagesResponse.ok) throw new Error('Failed to fetch promotional images');

      const [currentTopXImages, promotionalImages] = await Promise.all([
        currentTopXImagesResponse.json() as Promise<CarouselImage[]>,
        promotionalImagesResponse.json() as Promise<CarouselImage[]>,
      ]);

      /**
       * Set images again; keep the first 6 images we have already, then take the next top X images until we have 7 in total.
       * Only take "other" images, i.e. images with IDs we don't have in the current state.
       */
      setImages((currentImages) => {
        const existingIds = new Set(currentImages.map((img) => img.id));
        const newTopXImages = currentTopXImages.filter((img) => !existingIds.has(img.id));
        const whatToKeep = [...currentImages.slice(0, 6)];
        if (whatToKeep.filter((img) => img.isPromo).length === 0 && promotionalImages.length > 0) {
          const randomIndex = Math.floor(Math.random() * promotionalImages.length);
          whatToKeep.push(promotionalImages[randomIndex]!);
        }
        whatToKeep.push(...newTopXImages);

        const newImages = whatToKeep.slice(0, 7);
        return newImages;
      });
    }

    void dropFirstImageAndLoadNext();

    const interval = setInterval(() => {
      void dropFirstImageAndLoadNext();
    }, 10_000);

    return () => clearInterval(interval);
  }, []);

  // Generate QR code for upload URL
  useEffect(() => {
    async function generateQrCode() {
      const qrCode = await QRCode.toDataURL('https://ballermann.vercel.app/upload', {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrCode);
    }
    void generateQrCode();
  }, []);

  if (images.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading images...</p>
        </div>
      </div>
    );
  }

  const currentImage = images[0]!;
  const nextImages = [];
  const maxPreviewImages = Math.min(6, images.length - 1); // Don't show more than available unique images
  for (let i = 1; i <= maxPreviewImages; i++) {
    const nextIndex = i % images.length;
    nextImages.push(images[nextIndex]);
  }

  const currentImageIsPromo = currentImage && currentImage.isPromo;
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Main Image */}
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        {currentImageIsPromo && (
          <div className="flex items-center justify-center text-6xl bg-black text-white px-3 py-4 w-full">
            Mit freundlicher Unterstützung:
          </div>
        )}
        <div className="relative w-full basis-full">
          <Image
            src={currentImage.blobUrl}
            alt={`Current Image`}
            fill
            className="object-contain"
            priority
            onLoad={() => {
              if (!currentImageIsPromo) {
                // Track image load
                fetch(`/api/images/${currentImage.id}/view`, {
                  method: 'POST',
                }).catch((error) => {
                  console.error('Failed to track load:', error);
                });
              }
            }}
          />
        </div>
      </div>

      {/* QR Code - Bottom Left */}
      {qrCodeUrl && (
        <div className={`absolute bottom-6 left-6 z-10`}>
          <div className="bg-white p-3 rounded-lg shadow-lg flex flex-col items-center">
            <div className="relative w-32 h-32">
              <Image
                src={qrCodeUrl}
                alt="Upload QR Code"
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
            <p className="text-md text-center mt-2 text-black font-medium">Bilder hochladen </p>
          </div>
        </div>
      )}

      {/* Preview - Bottom Right */}
      {nextImages.length > 0 && (
        <div
          className={`absolute bottom-6 right-6 z-10 flex space-x-2 ${currentImageIsPromo ? 'invisible' : ''}`}
        >
          {nextImages
            .slice()
            .map((image, index) => {
              if (!image) {
                console.error('Image is undefined at index:', index);
                return null;
              }
              const isFirst = index === 0;
              const shouldBeHidden = index > 4;

              return (
                <div
                  key={image.id}
                  className={`relative w-36 h-36 flex flex-col items-center rounded overflow-hidden border-2 border-white ${isFirst ? 'border-yellow-500' : ''} ${shouldBeHidden ? 'invisible' : ''}`}
                >
                  <Image
                    src={image.blobUrl}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {isFirst && (
                    <div
                      className="absolute bottom-2 left-0 right-0 text-center font-extrabold text-xl text-yellow-500"
                      style={{
                        textShadow:
                          '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                      }}
                    >
                      NEXT UP
                    </div>
                  )}
                </div>
              );
            })
            .reverse()}
        </div>
      )}
    </div>
  );
}
