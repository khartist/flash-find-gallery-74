
import { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import ImageUpload from "@/components/ImageUpload";
import ImageGallery from "@/components/ImageGallery";
import TimelineView from "@/components/TimelineView";
import Statistics from "@/components/Statistics";
import { useImageStore } from "@/hooks/useImageStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PlusCircle, Search, Grid, CalendarDays, BarChart2 } from "lucide-react";

type ViewMode = "grid" | "timeline";

const Index = () => {
  const { images, timelineGroups, addImage, removeImage, searchQuery, setSearchQuery } = useImageStore();
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const noImagesUploaded = images.length === 0 && !searchQuery;

  const handleImageUpload = (file: File, description: string) => {
    addImage(file, description);
    setShowUpload(false);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/50 backdrop-blur-sm p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-photo-blue to-blue-600 bg-clip-text text-transparent">
            FlashFind Gallery
          </h1>
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

          {!noImagesUploaded && (
            <Link to="/stats">
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Stats
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Statistics Section */}
      {!noImagesUploaded && <Statistics images={images} />}

      {/* Upload area */}
      {showUpload && (
        <div className="animate-fade-in">
          <ImageUpload onUpload={handleImageUpload} />
        </div>
      )}

      {/* View mode selection */}
      {!noImagesUploaded && (
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
          <TabsList className="grid w-48 grid-cols-2 bg-white/50 backdrop-blur-sm shadow-sm">
            <TabsTrigger value="grid" className="flex items-center gap-1 data-[state=active]:shadow-sm data-[state=active]:bg-white">
              <Grid className="h-4 w-4" />
              <span>Grid</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-1 data-[state=active]:shadow-sm data-[state=active]:bg-white">
              <CalendarDays className="h-4 w-4" />
              <span>Timeline</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Gallery or empty state */}
      <div className="min-h-[60vh]">
        {noImagesUploaded ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white/50 backdrop-blur-sm rounded-lg shadow-md p-8 transition-all duration-300 hover:shadow-lg">
            <div className="bg-primary/10 p-5 rounded-full mb-4 transition-transform hover:scale-110">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-photo-blue to-blue-600 bg-clip-text text-transparent">
              Your gallery is empty
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Upload your first photos to start building your searchable gallery
            </p>
            <Button size="lg" onClick={() => setShowUpload(true)} 
              className="transition-all duration-300 hover:shadow-lg hover:scale-105">
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
