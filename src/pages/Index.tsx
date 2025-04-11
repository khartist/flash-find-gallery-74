
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import ImageUpload from "@/components/ImageUpload";
import ImageGallery from "@/components/ImageGallery";
import TimelineView from "@/components/TimelineView";
import { useImageStore } from "@/hooks/useImageStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlusCircle, Search, Grid, CalendarDays } from "lucide-react";

type ViewMode = "grid" | "timeline";

const Index = () => {
  const { images, timelineGroups, addImage, removeImage, searchQuery, setSearchQuery } = useImageStore();
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const noImagesUploaded = images.length === 0 && !searchQuery;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      {/* Header with app title */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-photo-blue">FlashFind Gallery</h1>
          <p className="text-muted-foreground">Store and search your photos easily</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
          />
          
          <Button 
            variant={showUpload ? "outline" : "default"} 
            onClick={() => setShowUpload(!showUpload)}
            className="flex-shrink-0"
          >
            {showUpload ? "Cancel" : <PlusCircle className="mr-2 h-4 w-4" />}
            {!showUpload && "Upload"}
          </Button>
        </div>
      </header>

      {/* Upload area */}
      {showUpload && (
        <div className="animate-fade-in">
          <ImageUpload onUpload={addImage} />
        </div>
      )}

      {/* View mode selection */}
      {!noImagesUploaded && (
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
          <TabsList className="grid w-48 grid-cols-2">
            <TabsTrigger value="grid" className="flex items-center gap-1">
              <Grid className="h-4 w-4" />
              <span>Grid</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Gallery or empty state */}
      <div className="min-h-[60vh]">
        {noImagesUploaded ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-primary/10 p-5 rounded-full mb-4">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your gallery is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Upload your first photos to start building your searchable gallery
            </p>
            <Button size="lg" onClick={() => setShowUpload(true)}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Upload Photos
            </Button>
          </div>
        ) : (
          <>
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
