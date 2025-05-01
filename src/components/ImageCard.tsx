import { useState } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageItem } from "@/hooks/useImageStore";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageCardProps {
  image: ImageItem;
  onRemove: (id: string) => Promise<boolean>;
  onSelect: () => void;
}

const ImageCard = ({ image, onRemove, onSelect }: ImageCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await onRemove(image.id);
      
      if (result) {
        toast.success(`Image '${image.file.name}' deleted successfully.`);
      }
    } catch (error) {
      toast.error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClick = () => {
    navigate(`/image/${encodeURIComponent(image.file.name)}`);
  };

  return (
    <>
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
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone and the image will be permanently removed from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ImageCard;
