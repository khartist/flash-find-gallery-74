
import { useState, useEffect } from 'react';
import { searchImages, generateTagsFromFilename } from '@/lib/imageSearch';

export interface ImageItem {
  id: string;
  file: File;
  url: string;
  tags: string[];
  uploadDate: Date;
}

export function useImageStore() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load images from localStorage on component mount
  useEffect(() => {
    const savedImagesJson = localStorage.getItem('flashFindImages');
    if (savedImagesJson) {
      try {
        // We can't store File objects in localStorage, so we're just loading metadata
        // In a real app, we'd use a proper backend storage solution
        const savedImagesMeta = JSON.parse(savedImagesJson);
        
        // Create a placeholder File object since we can't restore the actual file
        const createPlaceholderFile = (fileName: string) => {
          // Create an empty blob with the correct type
          const emptyBlob = new Blob([], { type: 'image/png' });
          // Convert to File with the original name
          return new File([emptyBlob], fileName, { type: 'image/png' });
        };
        
        // For demo purposes, we'll use some placeholder tags since we can't restore the actual files
        const demoImages = savedImagesMeta.map((meta: any) => ({
          id: meta.id,
          url: meta.url || '/placeholder.svg',
          tags: meta.tags || [],
          uploadDate: new Date(meta.uploadDate),
          // Create a placeholder File object
          file: createPlaceholderFile(meta.fileName || 'placeholder.png')
        }));
        
        setImages(demoImages);
        setFilteredImages(demoImages);
      } catch (error) {
        console.error('Failed to load saved images:', error);
      }
    }
  }, []);

  // Save images to localStorage when images change
  useEffect(() => {
    // We can't store File objects directly, so we'll store just the metadata
    const imagesToSave = images.map(img => ({
      id: img.id,
      url: img.url,
      tags: img.tags,
      uploadDate: img.uploadDate.toISOString(),
      fileName: img.file.name
    }));
    
    localStorage.setItem('flashFindImages', JSON.stringify(imagesToSave));
  }, [images]);

  // Filter images based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
      return;
    }

    const filtered = searchImages(images, searchQuery);
    setFilteredImages(filtered);
  }, [searchQuery, images]);

  const addImage = (file: File) => {
    // Generate a preview URL for the image
    const url = URL.createObjectURL(file);
    
    // Extract tags from filename
    const tags = generateTagsFromFilename(file.name);
    
    const newImage: ImageItem = {
      id: crypto.randomUUID(),
      file,
      url,
      tags,
      uploadDate: new Date()
    };

    setImages(prevImages => [...prevImages, newImage]);
  };

  const removeImage = (id: string) => {
    setImages(prevImages => prevImages.filter(img => img.id !== id));
  };

  return {
    images: filteredImages,
    addImage,
    removeImage,
    searchQuery,
    setSearchQuery
  };
}
