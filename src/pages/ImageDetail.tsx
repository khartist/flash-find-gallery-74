
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Info, Calendar, FileText, X, Tag } from "lucide-react";
import { format } from "date-fns";
import { useImageStore, ImageItem } from "@/hooks/useImageStore";
import { useToast } from "@/hooks/use-toast";

const ImageDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { images } = useImageStore();
  const [image, setImage] = useState<ImageItem | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      const foundImage = images.find(img => img.id === id);
      
      if (foundImage) {
        setImage(foundImage);
      } else {
        toast({
          title: "Image not found",
          description: "The requested image could not be found.",
          variant: "destructive"
        });
        navigate("/");
      }
    }
    setLoading(false);
  }, [id, images, navigate, toast]);

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[80vh]">
        <p className="text-muted-foreground">Loading image...</p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[80vh]">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Image not found</h2>
          <p className="text-muted-foreground mb-4">
            The image you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={goBack}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <header className="flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        
        <h1 className="text-xl font-medium truncate max-w-lg">{image.file.name}</h1>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setShowInfo(!showInfo)}
          className={showInfo ? "bg-muted" : ""}
        >
          <Info className="h-4 w-4" />
        </Button>
      </header>

      <div className="relative flex items-center justify-center min-h-[70vh] bg-muted/30 rounded-lg overflow-hidden">
        <img 
          src={image.url} 
          alt={image.file.name} 
          className="max-h-[80vh] max-w-full object-contain"
        />
      </div>

      {/* Image info sheet for mobile devices */}
      <Sheet open={showInfo} onOpenChange={setShowInfo}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Image Details</SheetTitle>
            <SheetDescription>
              Metadata and information about this image
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Upload Date</span>
              </h3>
              <p>{format(image.uploadDate, 'MMMM d, yyyy h:mm a')}</p>
            </div>

            {image.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Description</span>
                </h3>
                <p>{image.description}</p>
              </div>
            )}

            {image.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Tags</span>
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {image.tags.map((tag, index) => (
                    <span key={index} className="bg-muted px-2 py-1 rounded-md text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop info sidebar */}
      <div className={`hidden md:block bg-card border rounded-lg p-4 space-y-4 transition-all ${showInfo ? 'opacity-100' : 'opacity-0 hidden'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Image Details</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Upload Date</span>
            </h3>
            <p>{format(image.uploadDate, 'MMMM d, yyyy h:mm a')}</p>
          </div>

          {image.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span>Description</span>
              </h3>
              <p>{image.description}</p>
            </div>
          )}

          {image.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                <span>Tags</span>
              </h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {image.tags.map((tag, index) => (
                  <span key={index} className="bg-muted px-2 py-1 rounded-md text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageDetail;
