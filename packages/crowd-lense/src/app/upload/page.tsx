import ClientOnly from '@/components/client-only-guard';
import { ImageUpload } from '@/components/image-upload';

export default function HomePage() {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <ClientOnly>
          <ImageUpload />
        </ClientOnly>
      </div>
    </div>
  );
}
