import { Search, Image, Mic, Square, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchType } from "@/lib/imageSearch";
import { useState, useRef, useEffect } from "react";
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
  onSearch: (query: string, type: SearchType) => void;
  placeholder?: string;
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
}

const SearchBar = ({ 
  value, 
  onChange, 
  onSearch,
  placeholder = "Search your photos...",
  searchType,
  onSearchTypeChange
}: SearchBarProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<string[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const handleImageSearch = () => {
    onSearchTypeChange(SearchType.IMAGE);
    fileInputRef.current?.click();
  };

  const startRecording = async () => {
    try {
      onSearchTypeChange(SearchType.VOICE);
      
      // Clear previous recording data
      audioChunksRef.current = [];
      setAudioBlob(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks from the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Submit the audio for search
        submitAudioSearch(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak now to search your photos...",
        duration: 3000
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access failed",
        description: "Unable to access your microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Processing your audio search...",
        duration: 2000
      });
    }
  };

  const submitAudioSearch = async (blob: Blob) => {
    try {
      setIsSearching(true);
      
      // Use imageService to search by audio
      const response = await imageService.searchByAudio(blob);
      
      if (response.status === 200 && response.data) {
        // Check if we have image URLs from audio search
        if (response.data.image_urls && response.data.image_urls.length > 0) {
          console.log(`Voice search returned ${response.data.image_urls.length} images`);
          
          // Store the image URLs in localStorage for the useImageStore hook to use
          localStorage.setItem('lastVoiceSearchUrls', JSON.stringify(response.data.image_urls));
          
          // Use the transcribed audio as the query
          const audioQuery = response.data.query || value || "voice query";
          
          // Set the query and trigger the search
          onChange(audioQuery);
          onSearch(audioQuery, SearchType.VOICE);
          
          toast({
            title: "Voice search completed",
            description: `Found ${response.data.image_urls.length} matching images`,
            duration: 3000
          });
        } else {
          toast({
            title: "Voice search completed",
            description: "No results were found",
            duration: 3000
          });
        }
      } else {
        console.error('Audio search failed with status:', response.status);
        throw new Error('Failed to process audio search');
      }
    } catch (error) {
      console.error('Audio search failed:', error);
      toast({
        title: "Voice search failed",
        description: "Failed to process your audio search",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleVoiceSearch = () => {
    // Toggle recording state
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmitSearch = async () => {
    if (value.trim().length > 0) {
      // Show loading state
      setIsSearching(true);
      
      try {
        if (searchType === SearchType.SEMANTIC) {
          // For semantic/AI search, we only need to call onSearch
          // The actual API call will be handled by the performSemanticSearch function
          // in the parent component (Index.tsx)
          onSearch(value, searchType);
        } else {
          // For local search, just call the parent's onSearch function
          onSearch(value, searchType);
        }
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: "Search failed",
          description: "Failed to process your search request",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    } else {
      toast({
        title: "Empty search",
        description: "Please enter a search term",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSearching && value.trim().length > 0) {
      handleSubmitSearch();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        
        // Stop all tracks from the stream to release the microphone
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [isRecording]);

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
    onSearch(text, searchType);
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-lg">
      <div className="relative w-full flex">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-20 rounded-l-full border-r-0 border-transparent bg-secondary shadow-sm focus-visible:ring-2 transition-all"
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
              disabled={isSearching || isRecording}
            >
              <Image className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleVoiceSearch}
              title={isRecording ? "Stop recording" : "Search by voice"}
              className={`transition-colors ${searchType === SearchType.VOICE || isRecording ? "bg-primary/20 text-primary" : ""}`}
              disabled={isSearching}
            >
              {isRecording ? (
                <Square className="h-4 w-4 fill-current animate-pulse" />
              ) : isSearching ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Mic className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        <Button 
          type="submit"
          onClick={handleSubmitSearch}
          className="rounded-r-full px-4"
          disabled={isSearching || isRecording || value.trim().length === 0}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
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