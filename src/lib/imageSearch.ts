import type { ImageItem } from "../hooks/useImageStore";
import { defaultConfig } from "./api-client";

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

// Define the search types available in our application
export enum SearchType {
  LOCAL = 'local',      // Local search - no API call
  SEMANTIC = 'semantic', // Semantic search using AI
  IMAGE = 'image',      // Search using an image as input
  VOICE = 'voice'       // Search using voice/audio input
}

export interface SearchResult {
  id: string;
  url: string;
  title?: string;
  description?: string;
  date?: Date;
  tags?: string[];
}

/**
 * Get fake search results (for development)
 */
export function getFakeSearchResults(query: string, count: number = 10): SearchResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `result-${i}`,
    url: `https://source.unsplash.com/random?${query}&sig=${i}`,
    title: `Result ${i + 1} for "${query}"`,
    description: `This is a sample result for "${query}"`,
    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
    tags: ['sample', 'demo', query]
  }));
}

/**
 * Semantic search through the backend API
 * @param query The search query
 * @param limit Maximum number of results to return (default: 10)
 * @returns Promise with image URLs
 */
export async function semanticSearch(query: string, limit: number = 10): Promise<string[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const url = `${defaultConfig.baseUrl}/search/text?query=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.image_urls || [];
  } catch (error) {
    console.error('Semantic search failed:', error);
    return [];
  }
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
