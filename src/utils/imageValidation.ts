/**
 * Utility functions for image validation including aspect ratio checking
 */

export interface AspectRatioRequirement {
  width: number;
  height: number;
  tolerance?: number; // Tolerance percentage (default: 5%)
}

/**
 * Validates if an image file meets the specified aspect ratio requirements
 * @param file - The image file to validate
 * @param requirement - The aspect ratio requirement
 * @returns Promise<boolean> - True if the aspect ratio is valid
 */
export const validateImageAspectRatio = (
  file: File,
  requirement: AspectRatioRequirement
): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const { width, height } = img;
      const actualRatio = width / height;
      const expectedRatio = requirement.width / requirement.height;
      const tolerance = requirement.tolerance || 0.05; // 5% default tolerance
      
      const difference = Math.abs(actualRatio - expectedRatio) / expectedRatio;
      const isValid = difference <= tolerance;
      
      URL.revokeObjectURL(url);
      resolve(isValid);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    img.src = url;
  });
};

/**
 * Gets the actual dimensions of an image file
 * @param file - The image file
 * @returns Promise<{width: number, height: number}> - The image dimensions
 */
export const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Predefined aspect ratio requirements for different poster types
 */
export const POSTER_ASPECT_RATIOS = {
  LISTING: { width: 4, height: 3, tolerance: 0.05 }, // 4:3 for event listings
  DETAIL: { width: 16, height: 9, tolerance: 0.05 }, // 16:9 for detail pages
} as const;

/**
 * Validates if a file is a valid image type
 * @param file - The file to validate
 * @returns boolean - True if the file is a valid image
 */
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * Validates file size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in MB (default: 10MB)
 * @returns boolean - True if the file size is valid
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};