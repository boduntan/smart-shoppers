import { apiClient } from './apiClient';

export interface ImageUploadResponse {
  success: boolean;
  data: {
    sessionId: string;
    userMessage: string;
    imageUrl: string;
    aiResponse: string;
    timestamp: string;
  };
}

export const imageService = {
  // Upload image with optional message for AI analysis
  uploadImageChat: async (
    imageFile: File,
    message?: string,
    sessionId?: string
  ): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    if (message) {
      formData.append('message', message);
    }
    
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    const { data } = await apiClient.post<ImageUploadResponse>('/upload/image-chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return data;
  },

  // Get image URL
  getImageUrl: (filename: string): string => {
    return `${apiClient.defaults.baseURL}/upload/images/${filename}`;
  },
};
