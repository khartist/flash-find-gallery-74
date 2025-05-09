/**
 * Image Service
 * Handles all API requests related to images
 */

import { apiClient, ApiResponse } from './api-client';
import { v5 as uuidv5 } from 'uuid';

// Define the UUID namespace (using DNS as in backend)
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID namespace for DNS

// Define image-related types
export interface ImageApiItem {
  filename: string;
  description?: string;
  category?: string;
}

// Define response type for image search
export interface ImageSearchResponse {
  text: string[];
}

export interface SearchResponse {
  status: number;
  data?: any;
  error?: string;
}

interface TextSearchResponse {
  text?: string[];
}

// Image service API paths
const API_PATHS = {
  IMAGES: '/image/all',
  IMAGE: (filename: string) => `/image/${generateUuidForFile(filename)}`,
  UPLOAD: '/upload/image',
  SEARCH_IMAGE: '/search/image',
};

/**
 * Generate a UUID v5 for a file name
 * This matches the backend's approach of using UUID5 with DNS namespace
 */
const generateUuidForFile = (fileName: string): string => {
  return uuidv5(fileName, UUID_NAMESPACE);
};

export class ImageService {
  /**
   * Get all images
   */
  async getAllImages(): Promise<ApiResponse<ImageApiItem[]>> {
    return apiClient.get<ImageApiItem[]>(API_PATHS.IMAGES);
  }

  /**
   * Get a single image by ID
   */
  async getImageByName(filename: string): Promise<ApiResponse<ImageApiItem>> {
    return apiClient.get<ImageApiItem>(API_PATHS.IMAGE(filename));
  }

  /**
   * Upload a new image
   */
  async uploadImage(
    file: File,
    metadata: { description: string; category: string }
  ): Promise<ApiResponse<ImageApiItem>> {
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const metadata_json = JSON.stringify([
        {
          description: metadata.description,
          category: metadata.category,
        },
      ]);

      formData.append('metadata_json', metadata_json);

      return await apiClient.request<ImageApiItem>(API_PATHS.UPLOAD, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Update image metadata
   */
  async updateImage(
    id: string,
    data: { description?: string; tags?: string[]; category?: string }
  ): Promise<ApiResponse<ImageApiItem>> {
    return apiClient.patch<ImageApiItem>(API_PATHS.IMAGE(id), data);
  }

  /**
   * Delete an image
   */
  async deleteImage(filename: string): Promise<ApiResponse<void>> {
    return apiClient.delete(API_PATHS.IMAGE(filename));
  }

  /**
   * Search by text query
   */
  async searchByText(query: string): Promise<SearchResponse> {
    try {
      const response = await apiClient.get(`/search/text?query=${encodeURIComponent(query)}`);
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Text search error:', error);
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Search by image
   */
  async searchByImage(file: File): Promise<SearchResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/search/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Image search error:', error);
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Search by audio
   */
  async searchByAudio(audioBlob: Blob): Promise<SearchResponse> {
    try {
      const formData = new FormData();
      // Change file parameter name from 'file' to explicit file parameter expected by API
      formData.append('file', audioBlob, 'recording.wav');

      // Use apiClient to ensure consistent error handling and headers
      const response = await apiClient.request<{image_urls?: string[]}>('/search/audio', {
        method: 'POST',
        body: formData,
        headers: {
          // Remove 'Content-Type' header to let the browser set it correctly with boundary
          'Accept': 'application/json',
        },
      });

      return {
        status: response.status,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Audio search error:', error);
      return {
        status: error.response?.status || 500,
        error: error.response?.data?.detail || error.message || 'Unknown error',
      };
    }
  }
}

// Export a singleton instance
export const imageService = new ImageService();
