
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageItem } from "@/hooks/useImageStore";

interface ImageCardProps {
  image: ImageItem;
  onRemove: (id: string) => void;
}

const ImageCard = ({ image, onRemove }: ImageCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(image.id);
  };

  return (
    <div 
      className="image-card group aspect-square bg-muted"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={image.url}
        alt={image.file.name}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover ${isLoaded ? 'animate-scale-in' : 'opacity-0'}`}
      />
      
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex flex-col justify-between animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            className="self-end rounded-full bg-black/30 hover:bg-black/50 text-white h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="text-white text-sm font-medium truncate">
            {image.file.name}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCard;
