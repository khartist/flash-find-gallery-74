
import { useState, useMemo } from "react";
import { useImageStore } from "@/hooks/useImageStore";
import { searchImages } from "@/lib/imageSearch";
import ImageGallery from "@/components/ImageGallery";
import TimelineView from "@/components/TimelineView";
import ImageUpload from "@/components/ImageUpload";
import SearchBar from "@/components/SearchBar";
import Statistics from "@/components/Statistics";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";

export default function Index() {
  const { images, addImage, removeImage } = useImageStore();
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredImages = useMemo(() => {
    return searchImages(images, searchTerm);
  }, [images, searchTerm]);

  const timelineGroups = useMemo(() => {
    const groups: { [key: string]: { date: string; images: any[] } } = {};

    filteredImages.forEach((image) => {
      const date = new Date(image.uploadDate);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!groups[dateKey]) {
        groups[dateKey] = { 
          date: dateKey, 
          images: [] 
        };
      }
      groups[dateKey].images.push(image);
    });

    return Object.values(groups).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }).map(group => ({
      ...group,
      formattedDate: new Date(group.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }));
  }, [filteredImages]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-20">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <ImageUpload onUpload={addImage} />
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === "timeline" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("timeline")}
              >
                <LayoutList className="h-4 w-4 mr-1" />
                Timeline
              </Button>
            </div>
          </div>

          <SearchBar value={searchTerm} onChange={setSearchTerm} />

          <Statistics images={images} />

          {viewMode === "grid" ? (
            <ImageGallery 
              images={filteredImages} 
              onRemoveImage={removeImage} 
            />
          ) : (
            <TimelineView 
              timelineGroups={timelineGroups} 
              onRemoveImage={removeImage} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
