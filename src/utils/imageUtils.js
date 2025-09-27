/**
 * Utility functions for handling product images
 */

/**
 * Resolves a product image URL to include the backend server URL if needed (for local uploads)
 * or returns external URLs as-is
 * @param {string} imageUrl - The image URL (can be relative, absolute, or external)
 * @param {string} fallback - Fallback image path if imageUrl is empty
 * @returns {string} The resolved image URL
 */
export function resolveImageUrl(imageUrl, fallback = '/placeholder-product.jpg') {
  if (!imageUrl) return fallback;
  
  // If it's already a full URL (external), return as-is
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // If it's a relative path (from local uploads), resolve with backend URL
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imageUrl}`;
}

/**
 * Gets the primary image URL from a product object
 * @param {Object} product - The product object
 * @param {string} fallback - Fallback image path if no image is found
 * @returns {string} The resolved primary image URL
 */
export function getProductImageUrl(product, fallback = '/placeholder-product.jpg') {
  const imageUrl = (product.images && product.images[0] && product.images[0].url) || 
                   product.image || 
                   product.thumbnail;
  return resolveImageUrl(imageUrl, fallback);
}
