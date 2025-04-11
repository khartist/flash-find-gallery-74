
import { useState, useEffect } from 'react';

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
        
        // For demo purposes, we'll use some placeholder tags since we can't restore the actual files
        const demoImages = savedImagesMeta.map((meta: any) => ({
          ...meta,
          uploadDate: new Date(meta.uploadDate),
          // In a real app, we'd fetch the actual files from storage
          url: meta.url || '/placeholder.svg',
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

    const query = searchQuery.toLowerCase();
    const filtered = images.filter(image => {
      // Check if search term matches any tag
      const tagsMatch = image.tags.some(tag => 
        tag.toLowerCase().includes(query)
      );
      
      // Check if search term matches filename
      const filenameMatch = image.file.name.toLowerCase().includes(query);
      
      return tagsMatch || filenameMatch;
    });

    setFilteredImages(filtered);
  }, [searchQuery, images]);

  const addImage = (file: File) => {
    // Generate a preview URL for the image
    const url = URL.createObjectURL(file);
    
    // Extract basic tags from filename (simple demo implementation)
    const filename = file.name.toLowerCase();
    const fileExtension = filename.split('.').pop() || '';
    const filenameWithoutExtension = filename.replace(`.${fileExtension}`, '');
    
    // Split by common separators and filter out empty strings
    const baseTags = filenameWithoutExtension
      .split(/[-_.\s]/)
      .filter(tag => tag.length > 0);
    
    // Add file type as a tag
    const tags = [...baseTags, fileExtension];
    
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
