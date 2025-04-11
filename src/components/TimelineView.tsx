
import { TimelineGroup } from "@/hooks/useImageStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ImageCard from "./ImageCard";
import { Calendar } from "lucide-react";

interface TimelineViewProps {
  timelineGroups: TimelineGroup[];
  onRemoveImage: (id: string) => void;
  emptyContent?: React.ReactNode;
}

const TimelineView = ({ timelineGroups, onRemoveImage, emptyContent }: TimelineViewProps) => {
  if (timelineGroups.length === 0) {
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
    <div className="space-y-8 w-full">
      <ScrollArea className="h-full max-h-[80vh] w-full pr-4">
        {timelineGroups.map((group) => (
          <div key={group.date} className="mb-8">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{group.formattedDate}</h2>
              </div>
              <Separator />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
              {group.images.map((image) => (
                <ImageCard 
                  key={image.id} 
                  image={image} 
                  onRemove={onRemoveImage} 
                />
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default TimelineView;
