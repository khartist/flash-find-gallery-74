import { useState, useEffect } from 'react';
import { searchImages, generateTagsFromFilename, semanticSearch, SearchType } from '@/lib/imageSearch';
import { format } from 'date-fns';
import { imageService } from '@/lib/image-service';
import { defaultConfig } from '@/lib/api-client';

export interface ImageItem {
  id: string;
  file: File;
  url: string;
  tags: string[];
  uploadDate: Date;
  description: string;
  category: string; // Added category field
}

export interface TimelineGroup {
  date: string;
  formattedDate: string;
  images: ImageItem[];
}

export function useImageStore() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>(SearchType.LOCAL);
  const [timelineGroups, setTimelineGroups] = useState<TimelineGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Create a placeholder File object since we can't restore the actual file
  const createPlaceholderFile = (fileName: string) => {
    // Create an empty blob with the correct type
    const emptyBlob = new Blob([], { type: 'image/png' });
    // Convert to File with the original name
    return new File([emptyBlob], fileName || 'placeholder.png', { type: 'image/png' });
  };

  // Load images from API on component mount
  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        // Call the API to get all images
        const response = await imageService.getAllImages();
        // console.log('API response:', response);
        if (response.status >= 200 && response.status < 300 && Array.isArray(response.data)) {
          // Map API response to ImageItem format
          const apiImages = response.data.map((item: any) => {
            // Remove './app' prefix from image paths if it exists
            const imagePath = item.image_path ? item.image_path.replace('./app', defaultConfig.baseUrl) : '';
            const fileName = imagePath.split('/').pop() || 'image.jpg';
            const metadata = item.metadata || {};
            
            return {
              id: crypto.randomUUID(),
              url: imagePath,
              tags: fileName ? generateTagsFromFilename(fileName) : [],
              uploadDate: new Date(metadata.created_at || new Date()),
              description: metadata.description || '',
              category: metadata.category || '',
              file: createPlaceholderFile(fileName)
            };
          });
          
          setImages(apiImages);
          setFilteredImages(apiImages);
        } else {
          console.error('Invalid API response format:', response);
          // Fall back to localStorage if API fails
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Failed to fetch images from API:', error);
        // Fall back to localStorage if API fails
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Function to load from localStorage as fallback
    const loadFromLocalStorage = () => {
      const savedImagesJson = localStorage.getItem('flashFindImages');
      if (savedImagesJson) {
        try {
          const savedImagesMeta = JSON.parse(savedImagesJson);
          
          const demoImages = savedImagesMeta.map((meta: any) => ({
            id: meta.id,
            url: meta.url || '/placeholder.svg',
            tags: meta.tags || [],
            uploadDate: new Date(meta.uploadDate),
            description: meta.description || '', 
            category: meta.category || '',
            file: createPlaceholderFile(meta.fileName || 'placeholder.png')
          }));
          
          setImages(demoImages);
          setFilteredImages(demoImages);
        } catch (error) {
          console.error('Failed to load saved images:', error);
        }
      }
    };

    fetchImages();
  }, []);

  // Save images to localStorage when images change
  useEffect(() => {
    // We can't store File objects directly, so we'll store just the metadata
    const imagesToSave = images.map(img => ({
      id: img.id,
      url: img.url,
      tags: img.tags,
      uploadDate: img.uploadDate.toISOString(),
      fileName: img.file.name,
      description: img.description,
      category: img.category // Save category to localStorage
    }));
    
    localStorage.setItem('flashFindImages', JSON.stringify(imagesToSave));
  }, [images]);

  // Filter images based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);

      if (searchType === SearchType.LOCAL) {
        // Use local search
        const filtered = searchImages(images, searchQuery);
        setFilteredImages(filtered);
      } else if (searchType === SearchType.SEMANTIC) {
        // For semantic/AI search, don't auto-search - it will be triggered by submit button
        // This prevents concurrent API calls
      } else if (searchType === SearchType.VOICE) {
        // Voice search handling - API returns image_urls
        try {
          // Get image URLs from localStorage (set by SearchBar component)
          const storedUrls = localStorage.getItem('lastVoiceSearchUrls');
          let imageUrls: string[] = [];
          
          if (storedUrls) {
            imageUrls = JSON.parse(storedUrls);
            console.log("Voice search found URLs:", imageUrls);
            // Clear after use to avoid stale data
            localStorage.removeItem('lastVoiceSearchUrls');
          } else {
            console.log("No voice search URLs in localStorage, falling back to text search");
            // If no stored URLs, perform a text search as fallback
            const response = await imageService.searchByText(searchQuery);
            if (response.status >= 200 && response.status < 300 && response.data && response.data.image_urls) {
              imageUrls = response.data.image_urls;
              console.log("Fallback text search returned URLs:", imageUrls);
            }
          }
          
          if (imageUrls.length === 0) {
            console.log("No image URLs found from voice search");
            setFilteredImages([]);
          } else {
            console.log(`Processing ${imageUrls.length} voice search result URLs`);
            
            // Create a mapping of all local image filenames for easy lookup
            const imageFilenameMap = new Map(
              images.map(img => {
                const filename = img.url.split('/').pop()?.toLowerCase() || '';
                return [filename, img];
              })
            );
            
            // Process each API URL to find matches in local images
            const filteredImages = [];
            
            for (const url of imageUrls) {
              // Normalize URL path (handle './app' prefix)
              const normalizedUrl = url.startsWith('./app') 
                ? url.replace('./app', defaultConfig.baseUrl) 
                : url;
              
              // Extract filename from URL
              const apiFilename = normalizedUrl.split('/').pop()?.toLowerCase() || '';
              
              // Try to find an exact match first
              if (imageFilenameMap.has(apiFilename)) {
                filteredImages.push(imageFilenameMap.get(apiFilename));
                continue;
              }
              
              // If no exact match, try partial matches
              for (const img of images) {
                const imgFilename = img.url.split('/').pop()?.toLowerCase() || '';
                if ((imgFilename && apiFilename && imgFilename.includes(apiFilename)) ||
                    (imgFilename && apiFilename && apiFilename.includes(imgFilename))) {
                  filteredImages.push(img);
                  break;
                }
              }
            }
            
            console.log(`Found ${filteredImages.length} matching local images from voice search`);
            
            // If no matches found or if there were errors with exact matching, fall back to local text search
            if (filteredImages.length > 0) {
              setFilteredImages(filteredImages);
            } else {
              console.log("No local matches for voice search results, falling back to text search");
              setFilteredImages(searchImages(images, searchQuery));
            }
          }
        } catch (error) {
          console.error('Voice search processing failed:', error);
          // Fall back to local search in case of error
          const filtered = searchImages(images, searchQuery);
          setFilteredImages(filtered);
        }
      } else {
        // For other search types like IMAGE, search immediately
        try {
          const imageUrls = await semanticSearch(searchQuery, 10);
          if (imageUrls.length === 0) {
            setFilteredImages([]);
          } else {
            // Match the returned URLs with our existing images
            const filtered = images.filter(img => {
              // Extract the filename from both URLs for comparison
              const imgFilename = img.url.split('/').pop()?.toLowerCase();
              return imageUrls.some(url => {
                const apiFilename = url.split('/').pop()?.toLowerCase();
                // Check for exact match or partial match
                return imgFilename === apiFilename || 
                      (imgFilename && apiFilename && imgFilename.includes(apiFilename)) ||
                      (imgFilename && apiFilename && apiFilename.includes(imgFilename));
              });
            });
            
            // If no matches found, fallback to local search
            setFilteredImages(filtered.length > 0 ? filtered : searchImages(images, searchQuery));
          }
        } catch (error) {
          console.error('Semantic search failed, falling back to local search:', error);
          const filtered = searchImages(images, searchQuery);
          setFilteredImages(filtered);
        }
      }

      setIsLoading(false);
    };

    performSearch();
  }, [searchQuery, searchType, images]);

  // Group images by date for timeline view
  useEffect(() => {
    // Sort images by date (newest first)
    const sortedImages = [...filteredImages].sort((a, b) => 
      b.uploadDate.getTime() - a.uploadDate.getTime()
    );
    
    // Group by date (YYYY-MM-DD)
    const groups: Record<string, ImageItem[]> = {};
    
    sortedImages.forEach(image => {
      const dateKey = format(image.uploadDate, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(image);
    });
    
    // Convert to array of timeline groups
    const timelineArray: TimelineGroup[] = Object.keys(groups).map(dateKey => {
      const date = new Date(dateKey);
      return {
        date: dateKey,
        formattedDate: format(date, 'MMMM d, yyyy'),
        images: groups[dateKey]
      };
    });
    
    setTimelineGroups(timelineArray);
  }, [filteredImages]);

  const addImage = (file: File, description: string = '', category: string = '') => {
    // Generate a preview URL for the image
    const url = URL.createObjectURL(file);
    
    // Extract tags from filename
    const tags = generateTagsFromFilename(file.name);
    
    const newImage: ImageItem = {
      id: crypto.randomUUID(),
      file,
      url,
      tags,
      uploadDate: new Date(),
      description,
      category // Store the category provided by the user
    };

    setImages(prevImages => [...prevImages, newImage]);
  };

  const removeImage = async (id: string) => {
    try {
      setIsDeletingImage(true);
      // Find the image by id
      const imageToRemove = images.find(img => img.id === id);
      
      if (imageToRemove) {
        // Call the API to delete the image
        const fileName = imageToRemove.file.name;
        const response = await imageService.deleteImage(fileName);
        
        if (response.status >= 200 && response.status < 300) {
          // If API call was successful, remove from local state
          setImages(prevImages => prevImages.filter(img => img.id !== id));
          return true; // Return success indicator
        } else {
          console.error('Failed to delete image from API:', response);
          throw new Error(`API returned status ${response.status}`);
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error; // Re-throw to let caller handle the error
    } finally {
      setIsDeletingImage(false);
    }
  };

  // Add a function to perform semantic search manually (triggered by the submit button)
  const performSemanticSearch = async (query: string) => {
    setIsLoading(true);
    try {
      // Call the semantic search API
      const imageUrls = await semanticSearch(query, 10);
      
      if (imageUrls.length === 0) {
        // If no results, set empty array
        setFilteredImages([]);
      } else {
        console.log("Semantic search returned URLs:", imageUrls);
        
        // Try matching with local images first
        const filtered = images.filter(img => {
          // Extract the filename from both URLs for comparison
          const imgFilename = img.url.split('/').pop()?.toLowerCase();
          
          // Try to match any returned URL
          return imageUrls.some(url => {
            const apiFilename = url.split('/').pop()?.toLowerCase();
            
            // Check for exact match or partial match
            return imgFilename === apiFilename || 
                  (imgFilename && apiFilename && imgFilename.includes(apiFilename)) ||
                  (imgFilename && apiFilename && apiFilename.includes(imgFilename));
          });
        });
        
        console.log("Filtered images after semantic search:", filtered.length);
        
        if (filtered.length > 0) {
          // Use the filtered results if matches were found
          setFilteredImages(filtered);
        } else {
          // If API returned results but no local matches were found,
          // we could consider showing placeholders or fetching the actual images
          console.log("No local matches found for semantic search results");
          
          // For now, fall back to local search as last resort
          const localResults = searchImages(images, query);
          setFilteredImages(localResults);
          
          // Show a message that we got results but couldn't match them locally
          if (imageUrls.length > 0 && localResults.length === 0) {
            console.log("Search returned remote results, but no local matches found");
          }
        }
      }
    } catch (error) {
      console.error('Semantic search failed, falling back to local search:', error);
      // Fall back to local search in case of error
      const filtered = searchImages(images, query);
      setFilteredImages(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    images: filteredImages,
    timelineGroups,
    addImage,
    removeImage,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    isLoading,
    isDeletingImage,
    performSemanticSearch // Export the new function
  };
}
