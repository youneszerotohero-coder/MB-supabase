import { supabase } from '../lib/supabaseClient'

// Get all products with filtering and pagination
export const getProducts = async (options = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        colors:product_colors(*),
        sizes:product_sizes(*),
        variants:product_variants(*)
      `)

    // Apply filters
    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId)
    }
    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive)
    }
    if (options.isFeatured !== undefined) {
      query = query.eq('is_featured', options.isFeatured)
    }
    if (options.minPrice) {
      query = query.gte('price', options.minPrice)
    }
    if (options.maxPrice) {
      query = query.lte('price', options.maxPrice)
    }
    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
    }

    // Apply sorting
    if (options.sortBy) {
      const ascending = options.sortOrder !== 'desc'
      // Convert camelCase to snake_case for Supabase
      const columnName = options.sortBy === 'createdAt' ? 'created_at' : 
                        options.sortBy === 'stockQuantity' ? 'stock_quantity' :
                        options.sortBy === 'isFeatured' ? 'is_featured' :
                        options.sortBy === 'categoryId' ? 'category_id' :
                        options.sortBy
      query = query.order(columnName, { ascending })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    if (options.page && options.limit) {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    } else if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: {
        products: data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || data.length,
          total: count || data.length,
          totalPages: options.limit ? Math.ceil((count || data.length) / options.limit) : 1
        }
      }
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

// Get single product by ID
export const getProductById = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        colors:product_colors(*),
        sizes:product_sizes(*),
        variants:product_variants(*)
      `)
      .eq('id', productId)
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

// Search products
export const searchProducts = async (searchQuery, options = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        colors:product_colors(*),
        sizes:product_sizes(*),
        variants:product_variants(*)
      `)
      .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)

    // Apply pagination
    if (options.page && options.limit) {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    } else if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: {
        products: data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || data.length,
          total: count || data.length,
          totalPages: options.limit ? Math.ceil((count || data.length) / options.limit) : 1
        }
      }
    }
  } catch (error) {
    console.error('Error searching products:', error)
    throw error
  }
}

// Get featured products
export const getFeaturedProducts = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        colors:product_colors(*),
        sizes:product_sizes(*),
        variants:product_variants(*)
      `)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error fetching featured products:', error)
    throw error
  }
}

// Get products by category
export const getProductsByCategory = async (categoryId, options = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        colors:product_colors(*),
        sizes:product_sizes(*),
        variants:product_variants(*)
      `)
      .eq('category_id', categoryId)

    // Apply sorting
    if (options.sortBy) {
      const ascending = options.sortOrder !== 'desc'
      // Convert camelCase to snake_case for Supabase
      const columnName = options.sortBy === 'createdAt' ? 'created_at' : 
                        options.sortBy === 'stockQuantity' ? 'stock_quantity' :
                        options.sortBy === 'isFeatured' ? 'is_featured' :
                        options.sortBy === 'categoryId' ? 'category_id' :
                        options.sortBy
      query = query.order(columnName, { ascending })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    if (options.page && options.limit) {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1
      query = query.range(from, to)
    } else if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: {
        products: data,
        pagination: {
          page: options.page || 1,
          limit: options.limit || data.length,
          total: count || data.length,
          totalPages: options.limit ? Math.ceil((count || data.length) / options.limit) : 1
        }
      }
    }
  } catch (error) {
    console.error('Error fetching products by category:', error)
    throw error
  }
}

// Update product stock
export const updateProductStock = async (productId, stockData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ stock_quantity: stockData.stockQuantity || stockData.stock_quantity })
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error updating product stock:', error)
    throw error
  }
}

// Get low stock products
export const getLowStockProducts = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        colors:product_colors(*),
        sizes:product_sizes(*),
        variants:product_variants(*)
      `)
      .lte('stock_quantity', 10) // Assuming low stock threshold is 10
      .order('stock_quantity', { ascending: true })
      .limit(limit)

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    throw error
  }
}

// Create new product
export const createProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        slug: productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-'),
        description: productData.description,
        description_ar: productData.descriptionAr,
        price: productData.price,
        cost: productData.cost,
        compare_at_price: productData.compareAtPrice,
        stock_quantity: productData.stockQuantity || 0,
        category_id: productData.categoryId,
        is_featured: productData.isFeatured || false,
        has_variants: productData.hasVariants || false
      })
      .select()
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

// Update product
export const updateProduct = async (productId, productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: productData.name,
        slug: productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-'),
        description: productData.description,
        description_ar: productData.descriptionAr,
        price: productData.price,
        cost: productData.cost,
        compare_at_price: productData.compareAtPrice,
        stock_quantity: productData.stockQuantity,
        category_id: productData.categoryId,
        is_featured: productData.isFeatured,
        has_variants: productData.hasVariants
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}
