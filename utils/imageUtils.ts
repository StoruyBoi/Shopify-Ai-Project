// utils/imageUtils.ts

/**
 * Preloads an image to check if it's valid
 * @param src Image URL to preload
 * @returns Promise that resolves to true if image loads successfully, false otherwise
 */
export const preloadImage = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!src) {
        resolve(false);
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };
  
  /**
   * Generates a fallback avatar URL based on the user's name
   * @param name User's name
   * @returns URL for a generated avatar
   */
  export const getFallbackAvatar = (name: string = 'User'): string => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
      
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=128`;
  };
  