/**
 * Image Service
 * Handles all API requests related to images
 */

import { apiClient, ApiResponse } from './api-client';

// Define image-related types
export interface ImageApiItem {
//   id: string;
//   url: string;
  filename: string;
//   tags: string[];
//   uploadDate: string;
  description?: string;
  category?: string;
}

// Define response type for image search
export interface ImageSearchResponse {
  text: string[];
}

// Image service API paths
const API_PATHS = {
  IMAGES: '/image/all',
  IMAGE: (id: string) => `/images/${id}`,
  UPLOAD: '/upload/image',
  SEARCH_IMAGE: '/search/image',
};

// Image service methods
export const imageService = {
  /**
   * Get all images
   */
  getAllImages: async (): Promise<ApiResponse<ImageApiItem[]>> => {
    return apiClient.get<ImageApiItem[]>(API_PATHS.IMAGES);
  },

  /**
   * Get a single image by ID
   */
  getImageById: async (filename: string): Promise<ApiResponse<ImageApiItem>> => {
    console.log("Fetching image with ID:", filename);
    return apiClient.get<ImageApiItem>(API_PATHS.IMAGE(filename));
  },

  /**
   * Upload a new image
   */
  uploadImage: async (
    file: File,
    metadata: { description: string; category: string }
  ): Promise<ApiResponse<ImageApiItem>> => {
    try {
      // For file uploads, we use FormData
      const formData = new FormData();
      formData.append('file', file, file.name);
      
      // Format metadata as array with object as required by the API
      const metadata_json = JSON.stringify([{
        description: metadata.description,
        category: metadata.category
      }]);
      
      formData.append('metadata_json', metadata_json);

      console.log("formData:", formData);
      
      // Use apiClient but ensure proper FormData handling by NOT setting Content-Type
      // Let the browser set Content-Type with proper boundary
      return await apiClient.request<ImageApiItem>(API_PATHS.UPLOAD, {
        method: 'POST',
        body: formData,
        headers: {
          // Override the default Content-Type in apiClient by setting it to undefined
          'Content-Type': undefined,
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },

  /**
   * Update image metadata
   */
  updateImage: async (
    id: string,
    data: { description?: string; tags?: string[]; category?: string }
  ): Promise<ApiResponse<ImageApiItem>> => {
    return apiClient.patch<ImageApiItem>(API_PATHS.IMAGE(id), data);
  },

  /**
   * Delete an image
   */
  deleteImage: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(API_PATHS.IMAGE(id));
  },

  /**
   * Search for images using an image file
   */
  searchByImage: async (
    file: File,
    limit: number = 5
  ): Promise<ApiResponse<ImageSearchResponse>> => {
    try {
      // For file uploads, we use FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Use apiClient but ensure proper FormData handling by NOT setting Content-Type
      return await apiClient.request<ImageSearchResponse>(`${API_PATHS.SEARCH_IMAGE}?limit=${limit}`, {
        method: 'POST',
        body: formData,
        headers: {
          // Override the default Content-Type in apiClient by setting it to undefined
          'Content-Type': undefined,
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      console.error("Image search failed:", error);
      throw error;
    }
  },
};
