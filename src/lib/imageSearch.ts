
import type { ImageItem } from "../hooks/useImageStore";

/**
 * Search through images based on a text query
 * In a real app, this would leverage more advanced search techniques
 * like image recognition or proper tagging
 */
export function searchImages(images: ImageItem[], query: string): ImageItem[] {
  if (!query.trim()) {
    return images;
  }

  const normalizedQuery = query.toLowerCase().trim();
  const searchTerms = normalizedQuery.split(/\s+/);

  return images.filter(image => {
    // Check against tags
    const tagMatches = searchTerms.some(term => 
      image.tags.some(tag => tag.toLowerCase().includes(term))
    );

    // Check against filename
    const filenameMatches = searchTerms.some(term => 
      image.file.name.toLowerCase().includes(term)
    );

    return tagMatches || filenameMatches;
  });
}

/**
 * Generate automatic tags for an image based on its filename
 * In a real application, this would use AI image recognition
 */
export function generateTagsFromFilename(filename: string): string[] {
  // Remove file extension
  const nameWithoutExtension = filename.split('.').slice(0, -1).join('.');
  
  // Split by common separators
  const rawTags = nameWithoutExtension
    .replace(/[-_]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(tag => tag.length > 2); // Filter out very short words
  
  // Remove duplicates
  return Array.from(new Set(rawTags));
}
