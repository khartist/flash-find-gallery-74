import { useState } from "react";
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageItem } from "@/hooks/useImageStore";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ImageCardProps {
  image: ImageItem;
  onRemove: (id: string) => void;
  onSelect: () => void;
}

const ImageCard = ({ image, onRemove, onSelect }: ImageCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(image.id);
  };

  const handleClick = () => {
    onSelect();
  };

  return (
    <Card 
      className="relative overflow-hidden group aspect-square bg-muted cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
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
          
          <div className="text-white space-y-1">
            <div className="text-sm font-medium truncate">
              {image.file.name}
            </div>
            {image.description && (
              <div className="flex items-center gap-1 text-xs">
                <FileText className="h-3 w-3" />
                <span className="line-clamp-2">{image.description}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ImageCard;
