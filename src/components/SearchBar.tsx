import { Search, Image, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchType } from "@/lib/imageSearch";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { imageService } from "@/lib/image-service";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
}

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search your photos...",
  searchType,
  onSearchTypeChange
}: SearchBarProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<string[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  const handleImageSearch = () => {
    onSearchTypeChange(SearchType.IMAGE);
    fileInputRef.current?.click();
  };

  const handleVoiceSearch = () => {
    onSearchTypeChange(SearchType.VOICE);
    toast({
      title: "Voice search activated",
      description: "Speak now to search your photos...",
      duration: 3000
    });
    
    // In a real implementation, we would initialize the Web Speech API here
    try {
      // Mock voice recognition after a delay
      setTimeout(() => {
        // This is just for demonstration
        onChange("sample voice search");
        toast({
          title: "Voice search completed",
          description: "Search query applied",
          duration: 3000
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Voice search failed",
        description: "Your browser may not support voice recognition",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSearching(true);
      
      toast({
        title: "Image search",
        description: "Searching for similar images...",
        duration: 3000
      });

      // Call the actual image search API
      const response = await imageService.searchByImage(file);

      if (response.status == 200 && response.data) {
        setImageSearchResults(response.data.text || []);
        setShowResultsDialog(true);
        
        // If there are text results, update the search input with the first result
        if (response.data.text && response.data.text.length > 0) {
          onChange(response.data.text[0]);
        }
      } else {
        toast({
          title: "Search failed",
          description: "Could not retrieve image search results",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Image search failed:", error);
      toast({
        title: "Search error",
        description: "Failed to process image search",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const applySearchText = (text: string) => {
    onChange(text);
    setShowResultsDialog(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-lg">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-20 rounded-full border-transparent bg-secondary shadow-sm focus-visible:ring-2 transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleImageSearch}
            title="Search by image"
            className={searchType === SearchType.IMAGE ? "bg-primary/10" : ""}
            disabled={isSearching}
          >
            <Image className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleVoiceSearch}
            title="Search by voice"
            className={searchType === SearchType.VOICE ? "bg-primary/10" : ""}
          >
            <Mic className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-center px-2">
        <RadioGroup
          value={searchType}
          onValueChange={(value) => onSearchTypeChange(value as SearchType)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={SearchType.LOCAL} id="local-search" />
            <Label htmlFor="local-search" className="text-sm">Local search</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={SearchType.SEMANTIC} id="semantic-search" />
            <Label htmlFor="semantic-search" className="text-sm">AI search</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Image Search Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Image Search Results</DialogTitle>
            <DialogDescription>
              The following text descriptions were found related to your image:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {imageSearchResults.length > 0 ? (
              <div className="space-y-2">
                {imageSearchResults.map((text, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => applySearchText(text)}
                  >
                    {text}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No results found</p>
            )}
          </div>
          
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowResultsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchBar;
