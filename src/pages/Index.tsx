import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import SearchBar from "@/components/SearchBar";
import ImageUpload from "@/components/ImageUpload";
import ImageGallery from "@/components/ImageGallery";
import TimelineView from "@/components/TimelineView";
import Statistics from "@/components/Statistics";
import { useImageStore } from "@/hooks/useImageStore";
import { imageService } from "@/lib/image-service";
import { SearchType } from "@/lib/imageSearch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlusCircle, Search, Grid, CalendarDays, BarChart2 } from "lucide-react";

type ViewMode = "grid" | "timeline";

const Index = () => {
  const { 
    images, 
    timelineGroups, 
    addImage, 
    removeImage, 
    searchQuery, 
    setSearchQuery, 
    searchType, 
    setSearchType, 
    isLoading,
    isDeletingImage
  } = useImageStore();
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (file: File, metadata: { description: string; category: string }) => {
    try {
      // Add the image with description and category
      addImage(file, metadata.description, metadata.category);
      toast.success(`Image '${file.name}' uploaded successfully.`);
      imageService.uploadImage(file, metadata);
      setShowUpload(false);
    } catch (error) {
      toast.error("Error uploading image. Please try again.");
      console.error(error);
    }
  };

  const noImagesUploaded = images.length === 0;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-photo-blue">FlashFind Gallery</h1>
          <p className="text-muted-foreground">Store and search your photos easily</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            searchType={searchType}
            onSearchTypeChange={setSearchType}
          />
          
          <Button 
            variant={showUpload ? "outline" : "default"} 
            onClick={() => setShowUpload(!showUpload)}
            className="flex-shrink-0"
          >
            {showUpload ? "Cancel" : <PlusCircle className="mr-2 h-4 w-4" />}
            {!showUpload && "Upload"}
          </Button>

          {!noImagesUploaded && (
            <Link to="/stats">
              <Button variant="outline" size="icon">
                <BarChart2 className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </header>
      
      {showUpload && (
        <ImageUpload 
          onUpload={handleImageUpload}
        />
      )}
      
      <div className="space-y-4">
        {noImagesUploaded ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center rounded-lg border border-dashed">
            <Search className="h-12 w-12 mb-4 text-muted-foreground" />
            <h2 className="text-xl font-medium mb-2">No images yet</h2>
            <p className="text-muted-foreground mb-4">
              Upload some images to get started with FlashFind Gallery
            </p>
            <Button 
              onClick={() => setShowUpload(true)}
              className="mt-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload Images
            </Button>
          </div>
        ) : (
          <>
            <Tabs defaultValue="grid" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger 
                    value="grid" 
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="mr-2 h-4 w-4" />
                    Grid View
                  </TabsTrigger>
                  <TabsTrigger 
                    value="timeline" 
                    onClick={() => setViewMode("timeline")}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Timeline
                  </TabsTrigger>
                </TabsList>

                {searchQuery && (
                  <div className="text-sm text-muted-foreground">
                    {isLoading ? (
                      "Searching..."
                    ) : (
                      <>
                        Found {images.length} result{images.length !== 1 ? 's' : ''} for "{searchQuery}"
                      </>
                    )}
                  </div>
                )}
              </div>
            </Tabs>
            
            {viewMode === "grid" && (
              <ImageGallery 
                images={images} 
                onRemoveImage={removeImage}
                emptyContent={
                  searchQuery ? (
                    <div className="text-muted-foreground">
                      <p className="text-lg font-medium mb-2">No results found</p>
                      <p className="text-sm">
                        No images matching "{searchQuery}" were found
                      </p>
                      <Button 
                        variant="link" 
                        onClick={() => setSearchQuery("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    </div>
                  ) : undefined
                } 
              />
            )}
            
            {viewMode === "timeline" && (
              <TimelineView 
                timelineGroups={timelineGroups}
                onRemoveImage={removeImage}
                emptyContent={
                  searchQuery ? (
                    <div className="text-muted-foreground">
                      <p className="text-lg font-medium mb-2">No results found</p>
                      <p className="text-sm">
                        No images matching "{searchQuery}" were found
                      </p>
                      <Button 
                        variant="link" 
                        onClick={() => setSearchQuery("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
