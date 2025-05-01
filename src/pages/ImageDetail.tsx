import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Info, Calendar, FileText, X, Tag, RefreshCcw, ZoomIn, ZoomOut, Download, Loader2, Maximize, Minimize, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useImageStore, ImageItem } from "@/hooks/useImageStore";
import { useToast } from "@/hooks/use-toast";
import { imageService } from "@/lib/image-service";
import { defaultConfig } from "@/lib/api-client";
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

const ImageDetail = () => {
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : "";
  
  const navigate = useNavigate();
  const { images, removeImage } = useImageStore();
  const [image, setImage] = useState<ImageItem | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retries, setRetries] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullScreenContainerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      const element = fullScreenContainerRef.current;
      if (element) {
        if (element.requestFullscreen) {
          element.requestFullscreen().then(() => {
            setIsFullScreen(true);
          }).catch(err => {
            console.error('Error attempting to enable full-screen mode:', err);
            toast({
              title: "Fullscreen error",
              description: "Could not enter fullscreen mode. Please try again.",
              variant: "destructive"
            });
          });
        }
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullScreen(false);
        }).catch(err => {
          console.error('Error attempting to exit full-screen mode:', err);
        });
      }
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  useEffect(() => {
    if (isFullScreen) {
      setZoom(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [isFullScreen]);

  const createPlaceholderFile = (fileName: string) => {
    const emptyBlob = new Blob([], { type: 'image/png' });
    const sanitizedName = fileName.replace(/[^\w.-]/g, '_') || 'placeholder.png';
    return new File([emptyBlob], sanitizedName, { type: 'image/png' });
  };

  useEffect(() => {
    setLoadError(false);
    setErrorMessage("");
    setRetries(0);
    setPanPosition({ x: 0, y: 0 });
    setZoom(1);
    
    if (decodedName) {
      const foundImage = images.find(img => img.file.name === decodedName);
      
      if (foundImage) {
        setImage(foundImage);
        setLoading(false);
        fetchImageDetailsFromApi(decodedName);
      } else {
        fetchImageDetailsFromApi(decodedName);
      }
    } else {
      setLoading(false);
      setLoadError(true);
      setErrorMessage("No image name provided");
    }
  }, [decodedName, images]);

  const fetchImageDetailsFromApi = async (imageName: string) => {
    try {
      setApiLoading(true);
      setLoadError(false);
      const backoffDelay = retries > 0 ? Math.min(1000 * Math.pow(2, retries - 1), 8000) : 0;
      if (backoffDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
      const response = await imageService.getImageByName(imageName);
      
      if (response.status >= 200 && response.status < 300 && response.data) {
        const apiData = response.data;
        
        const imagePath = apiData.image_path ? 
          apiData.image_path.replace('./app', defaultConfig.baseUrl) : 
          '';
        
        const fileName = imagePath.split('/').pop() || 'image.jpg';
        const metadata = apiData.metadata || {};
        
        const apiImage: ImageItem = {
          id: crypto.randomUUID(),
          url: imagePath,
          tags: fileName ? apiData.tags || [] : [],
          uploadDate: new Date(metadata.created_at || new Date()),
          description: metadata.description || '',
          category: metadata.category || '',
          file: createPlaceholderFile(fileName)
        };
        
        setImage(apiImage);
        setRetries(0);
        setLoading(false);
        
        toast({
          title: "Image details loaded",
          description: "Successfully retrieved image details from server.",
        });
      } else {
        console.error('API returned an invalid response:', response);
        setLoadError(true);
        setErrorMessage(`Server returned status ${response.status}`);
        
        if (!image) {
          toast({
            title: "Image not found",
            description: `The image "${imageName}" could not be found on the server.`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch image details from API:', error);
      setLoadError(true);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      
      if (!image) {
        toast({
          title: "Error loading image",
          description: "There was a problem retrieving the image details.",
          variant: "destructive"
        });
      }
    } finally {
      setApiLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!image) return;

    try {
      setIsDeleting(true);
      if (images.find(img => img.id === image.id)) {
        const result = await removeImage(image.id);
        
        if (result) {
          toast({
            title: "Image deleted",
            description: `Successfully deleted ${image.file.name}`,
          });
          navigate('/');
        }
      } else {
        const response = await imageService.deleteImage(image.file.name);
        
        if (response.status >= 200 && response.status < 300) {
          toast({
            title: "Image deleted",
            description: `Successfully deleted ${image.file.name}`,
          });
          navigate('/');
        } else {
          throw new Error(`API returned status ${response.status}`);
        }
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete the image",
        variant: "destructive"
      });
      console.error('Failed to delete image:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRetry = () => {
    if (retries < 3 && decodedName) {
      setRetries(prev => prev + 1);
      fetchImageDetailsFromApi(decodedName);
    } else {
      toast({
        title: "Max retries reached",
        description: "Unable to load the image after multiple attempts.",
        variant: "destructive"
      });
    }
  };

  const handleImageError = () => {
    setLoadError(true);
    setErrorMessage("Failed to load image file");
  };

  const handleImageLoad = () => {
    setLoadError(false);
    setErrorMessage("");
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      if (newZoom <= 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 1) {
      setIsPanning(true);
      panStartRef.current = { 
        x: e.clientX - panPosition.x, 
        y: e.clientY - panPosition.y 
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && panStartRef.current) {
      const newX = e.clientX - panStartRef.current.x;
      const newY = e.clientY - panStartRef.current.y;
      setPanPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const downloadImage = () => {
    if (image?.url) {
      try {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = image.file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download started",
          description: `Downloading ${image.file.name}`,
        });
      } catch (error) {
        console.error('Download failed:', error);
        toast({
          title: "Download failed",
          description: "There was a problem downloading the image. Try again later.",
          variant: "destructive"
        });
      }
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading && !image) {
    return (
      <div className="container mx-auto px-4 py-6 flex flex-col justify-center items-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p className="text-muted-foreground">Loading image...</p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[80vh]">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Image not found</h2>
          <p className="text-muted-foreground mb-4">
            {errorMessage || "The image you're looking for doesn't exist or has been removed."}
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
          <span>Quay lại</span>
        </Button>
        
        <h1 className="text-xl font-medium truncate max-w-lg">{image.file.name}</h1>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete image"
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span className="sr-only">Delete image</span>
          </Button>
          <Button variant="outline" size="icon" onClick={downloadImage} title="Download image">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download image</span>
          </Button>
          <Button variant="outline" size="icon" onClick={toggleFullScreen} title={isFullScreen ? "Exit full screen" : "Enter full screen"}>
            {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            <span className="sr-only">{isFullScreen ? "Exit full screen" : "Enter full screen"}</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowInfo(!showInfo)}
            className={showInfo ? "bg-muted" : ""}
            title="Show image details"
            aria-expanded={showInfo}
            aria-pressed={showInfo}
          >
            <Info className="h-4 w-4" />
            <span className="sr-only">Show image details</span>
          </Button>
        </div>
      </header>

      <div 
        ref={fullScreenContainerRef}
        className={`relative flex items-center justify-center ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : 'min-h-[70vh] bg-muted/30 rounded-lg'} overflow-hidden`}
      >
        {apiLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
              <p className="text-muted-foreground">Updating image details...</p>
            </div>
          </div>
        )}
        
        {loadError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Failed to load image{errorMessage ? `: ${errorMessage}` : ""}
            </p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              <span>Retry ({retries}/3)</span>
            </Button>
          </div>
        ) : (
          <>
            <div className={`${isFullScreen ? 'fixed bottom-4 right-4' : 'absolute bottom-4 right-4'} bg-background/80 p-2 rounded-lg flex items-center gap-2 z-20`}>
              <Button variant="ghost" size="icon" onClick={zoomOut} disabled={zoom <= 0.5} title="Zoom out">
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom out</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={resetZoom} title="Reset zoom">
                {Math.round(zoom * 100)}%
              </Button>
              <Button variant="ghost" size="icon" onClick={zoomIn} disabled={zoom >= 3} title="Zoom in">
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom in</span>
              </Button>
              {isFullScreen && (
                <Button variant="ghost" size="icon" onClick={toggleFullScreen} title="Exit full screen">
                  <Minimize className="h-4 w-4" />
                  <span className="sr-only">Exit full screen</span>
                </Button>
              )}
            </div>
            <div 
              ref={containerRef}
              className={`${isFullScreen ? 'w-full h-full' : 'overflow-auto max-h-[70vh] w-full'}`}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: zoom > 1 ? '2rem' : '0',
                cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              role="img"
              aria-label={`Image of ${image.file.name}`}
            >
              <img 
                ref={imageRef}
                src={image.url} 
                alt={image.description || image.file.name}
                className={`transition-all duration-200 ${isFullScreen ? 'max-h-[95vh] max-w-[95vw]' : 'max-w-full'} object-contain`}
                style={{ 
                  transform: `scale(${zoom}) translate(${panPosition.x / zoom}px, ${panPosition.y / zoom}px)`, 
                  transformOrigin: 'center center',
                }}
                onError={handleImageError}
                onLoad={handleImageLoad}
                loading="lazy"
                draggable={false}
              />
            </div>
          </>
        )}
      </div>

      <Sheet open={showInfo} onOpenChange={setShowInfo}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Thông tin hình ảnh</SheetTitle>
            <SheetDescription>
              Thông tin chi tiết về hình ảnh này.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Ngày đăng</span>
              </h3>
              <p>{format(image.uploadDate, 'MMMM d, yyyy h:mm a')}</p>
            </div>

            {image.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Mô tả</span>
                </h3>
                <p>{image.description}</p>
              </div>
            )}
            
            {image.category && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Phân loại</span>
                </h3>
                <p>{image.category}</p>
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

      <div className={`hidden md:block bg-card border rounded-lg p-4 space-y-4 transition-all ${showInfo ? 'opacity-100' : 'opacity-0 hidden'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thông tin hình ảnh</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)} aria-label="Close details">
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
          
          {image.category && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                <span>Category</span>
              </h3>
              <p>{image.category}</p>
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
              onClick={handleDelete} 
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
    </div>
  );
};

export default ImageDetail;
