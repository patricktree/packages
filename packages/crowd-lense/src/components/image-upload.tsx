'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { validateImageFile } from '@/lib/utils';
import { Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { heicTo } from 'heic-to';

type UploadedFile = {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
};

export function ImageUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const convertHeicFile = async (file: File): Promise<File> => {
    try {
      const convertedBlob = await heicTo({
        blob: file,
        type: 'image/jpeg',
        quality: 0.9,
      });

      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const convertedFile = new File([blob!], file.name.replace(/\.heic$/i, '.jpg'), {
        type: 'image/jpeg',
      });

      return convertedFile;
    } catch (error) {
      console.error('HEIC conversion failed:', error);
      throw new Error('HEIC conversion failed');
    }
  };

  const handleFiles = useCallback(
    async (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);

      if (files.length + fileArray.length > 10) {
        alert('10 Bilder sind das Maximum.');
        return;
      }

      const processedFiles = await Promise.all(
        fileArray.map(async (file) => {
          let processedFile = file;
          let error: string | undefined;

          // Convert HEIC files
          if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
            try {
              processedFile = await convertHeicFile(file);
            } catch (conversionError) {
              error = 'HEIC conversion failed';
            }
          }

          const validation = validateImageFile(processedFile);

          return {
            file: processedFile,
            preview: URL.createObjectURL(processedFile),
            status: validation.valid && !error ? ('pending' as const) : ('error' as const),
            progress: 0,
            error: error || validation.error,
          };
        }),
      );

      setFiles((prev) => [...prev, ...processedFiles]);
    },
    [files.length],
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await handleFiles(e.target.files);
      e.target.value = '';
    },
    [handleFiles],
  );

  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // Set all pending files to uploading state immediately
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'pending' ? { ...f, status: 'uploading' as const, progress: 0 } : f,
      ),
    );

    for (let i = 0; i < pendingFiles.length; i++) {
      const fileToUpload = pendingFiles[i]!;
      const fileIndex = files.findIndex((f) => f === fileToUpload);

      try {
        await new Promise<void>((resolve, reject) => {
          const formData = new FormData();
          formData.append('files', fileToUpload.file);

          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              setFiles((prev) =>
                prev.map((f, index) => (index === fileIndex ? { ...f, progress } : f)),
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              setFiles((prev) =>
                prev.map((f, index) =>
                  index === fileIndex ? { ...f, status: 'success' as const, progress: 100 } : f,
                ),
              );
              resolve();
            } else {
              setFiles((prev) =>
                prev.map((f, index) =>
                  index === fileIndex
                    ? { ...f, status: 'error' as const, error: 'Upload failed' }
                    : f,
                ),
              );
              reject(new Error('Upload failed'));
            }
          };

          xhr.onerror = () => {
            setFiles((prev) =>
              prev.map((f, index) =>
                index === fileIndex
                  ? { ...f, status: 'error' as const, error: 'Upload failed' }
                  : f,
              ),
            );
            reject(new Error('Upload failed'));
          };

          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });
      } catch (error) {
        // Error already handled in xhr.onerror
        console.error('Upload failed for file:', fileToUpload.file.name);
        // Continue with next file even if current one fails
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index]!.preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  if (typeof window === 'undefined') {
    return null; // Ensure this component only runs on the client side
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Bilder auswählen (maximal 10)
        </Button>
      </div>

      {files.filter((f) => f.status === 'pending').length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={uploadFiles}
            disabled={!files.some((f) => f.status === 'pending')}
            className="min-w-32"
          >
            {files.filter((f) => f.status === 'pending').length} Bilder hochladen
          </Button>
        </div>
      )}

      <input
        id="file-input"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="relative w-16 h-16">
                  <Image
                    src={file.preview}
                    alt={file.file.name}
                    fill
                    className="object-cover rounded"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="mt-2" />
                  )}
                  {file.error && <p className="text-xs text-red-500 mt-1">{file.error}</p>}
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {file.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {(file.status === 'pending' || file.status === 'error') && (
                    <Button variant="outline" size="sm" onClick={() => removeFile(index)}>
                      Entfernen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
