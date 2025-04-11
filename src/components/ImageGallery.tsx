
import { useState } from "react";
import { ImageItem } from "@/hooks/useImageStore";
import ImageCard from "./ImageCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageGalleryProps {
  images: ImageItem[];
  onRemoveImage: (id: string) => void;
  emptyContent?: React.ReactNode;
}

const ImageGallery = ({ images, onRemoveImage, emptyContent }: ImageGalleryProps) => {
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center rounded-lg border border-dashed">
        {emptyContent || (
          <div className="text-muted-foreground">
            <p className="mb-2">No images found</p>
            <p className="text-sm">Upload some images or try a different search term</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <ScrollArea className="h-full w-full">
        <div className={`image-grid ${isMobile ? 'gap-2' : 'gap-4'}`}>
          {images.map((image) => (
            <ImageCard 
              key={image.id} 
              image={image} 
              onRemove={onRemoveImage} 
            />
          ))}
        </div>
      </ScrollArea>
      
      {/* Image Preview Modal - in a real app, we would expand this */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <img 
              src={selectedImage.url} 
              alt={selectedImage.file.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
