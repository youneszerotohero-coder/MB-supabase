import api from './api'

// Get all products with filtering and pagination
export const getProducts = async (options = {}) => {
  try {
    const params = new URLSearchParams()
    
    if (options.page) params.append('page', options.page)
    if (options.limit) params.append('limit', options.limit)
    if (options.categoryId) params.append('categoryId', options.categoryId)
    if (options.isActive !== undefined) params.append('isActive', options.isActive)
    if (options.isFeatured !== undefined) params.append('isFeatured', options.isFeatured)
    if (options.brand) params.append('brand', options.brand)
    if (options.minPrice) params.append('minPrice', options.minPrice)
    if (options.maxPrice) params.append('maxPrice', options.maxPrice)
    if (options.search) params.append('search', options.search)
    if (options.sortBy) params.append('sortBy', options.sortBy)
    if (options.sortOrder) params.append('sortOrder', options.sortOrder)

    const response = await api.get(`/products?${params.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

// Get single product by ID
export const getProductById = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

// Search products
export const searchProducts = async (query, options = {}) => {
  try {
    const params = new URLSearchParams()
    params.append('q', query)
    
    if (options.page) params.append('page', options.page)
    if (options.limit) params.append('limit', options.limit)

    const response = await api.get(`/products/search?${params.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error searching products:', error)
    throw error
  }
}

// Get featured products
export const getFeaturedProducts = async (limit = 10) => {
  try {
    const response = await api.get(`/products/featured?limit=${limit}`)
    return response.data
  } catch (error) {
    console.error('Error fetching featured products:', error)
    throw error
  }
}

// Get products by category
export const getProductsByCategory = async (categoryId, options = {}) => {
  try {
    const params = new URLSearchParams()
    
    if (options.page) params.append('page', options.page)
    if (options.limit) params.append('limit', options.limit)
    if (options.sortBy) params.append('sortBy', options.sortBy)
    if (options.sortOrder) params.append('sortOrder', options.sortOrder)

    const response = await api.get(`/products/category/${categoryId}?${params.toString()}`)
    return response.data
  } catch (error) {
    console.error('Error fetching products by category:', error)
    throw error
  }
}

// Update product stock
export const updateProductStock = async (productId, stockData) => {
  try {
    const response = await api.patch(`/products/${productId}/stock`, stockData)
    return response.data
  } catch (error) {
    console.error('Error updating product stock:', error)
    throw error
  }
}

// Get low stock products
export const getLowStockProducts = async (limit = 50) => {
  try {
    const response = await api.get(`/products/low-stock?limit=${limit}`)
    return response.data
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    throw error
  }
}
