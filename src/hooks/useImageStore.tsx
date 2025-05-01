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
      } else {
        // Use semantic search API
        try {
          const imageUrls = await semanticSearch(searchQuery, 10);
          if (imageUrls.length === 0) {
            setFilteredImages([]);
          } else {
            // Match the returned URLs with our existing images
            const filtered = images.filter(img => {
              // Extract the filename from both URLs for comparison
              const imgFilename = img.url.split('/').pop();
              return imageUrls.some(url => {
                const apiFilename = url.split('/').pop();
                return imgFilename === apiFilename;
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

  const removeImage = (id: string) => {
    setImages(prevImages => prevImages.filter(img => img.id !== id));
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
    isLoading
  };
}
