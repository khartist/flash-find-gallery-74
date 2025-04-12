
/**
 * Image Service
 * Handles all API requests related to images
 */

import { apiClient, ApiResponse } from './api-client';

// Define image-related types
export interface ImageApiItem {
  id: string;
  url: string;
  filename: string;
  tags: string[];
  uploadDate: string;
  description?: string;
}

// Image service API paths
const API_PATHS = {
  IMAGES: '/images',
  IMAGE: (id: string) => `/images/${id}`,
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
  getImageById: async (id: string): Promise<ApiResponse<ImageApiItem>> => {
    return apiClient.get<ImageApiItem>(API_PATHS.IMAGE(id));
  },

  /**
   * Upload a new image
   */
  uploadImage: async (
    file: File,
    metadata: { description?: string; tags?: string[] }
  ): Promise<ApiResponse<ImageApiItem>> => {
    // For file uploads, we use FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata as JSON
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return apiClient.request<ImageApiItem>(API_PATHS.IMAGES, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData, browser will set it with boundary
      headers: {},
    });
  },

  /**
   * Update image metadata
   */
  updateImage: async (
    id: string,
    data: { description?: string; tags?: string[] }
  ): Promise<ApiResponse<ImageApiItem>> {
    return apiClient.patch<ImageApiItem>(API_PATHS.IMAGE(id), data);
  },

  /**
   * Delete an image
   */
  deleteImage: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(API_PATHS.IMAGE(id));
  },
};
