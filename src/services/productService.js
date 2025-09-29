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
    // Note: isActive filter removed as there's no is_active column in the database
    // Products are considered active if they have stock_quantity > 0
    if (options.isActive !== undefined && options.isActive) {
      query = query.gt('stock_quantity', 0)
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
    // First, create the main product
    const { data: product, error: productError } = await supabase
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

    if (productError) throw productError

    const productId = product.id

    // Insert product images if provided
    if (productData.images && productData.images.length > 0) {
      const imageInserts = productData.images.map(image => ({
        product_id: productId,
        url: image.url,
        alt: image.alt || productData.name,
        sort_order: image.sortOrder || 0,
        is_primary: image.isPrimary || false
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts)

      if (imagesError) {
        console.error('Error inserting product images:', imagesError)
        // Don't throw here, just log the error as images are not critical
      }
    }

    // Insert product sizes if provided
    if (productData.sizes && productData.sizes.length > 0) {
      const sizeInserts = productData.sizes.map((size, index) => ({
        product_id: productId,
        value: size.value,
        size_type: size.sizeType || 'letter',
        sort_order: index
      }))

      const { error: sizesError } = await supabase
        .from('product_sizes')
        .insert(sizeInserts)

      if (sizesError) {
        console.error('Error inserting product sizes:', sizesError)
        // Don't throw here, just log the error as sizes are not critical
      }
    }

    // Insert product colors if provided
    if (productData.colors && productData.colors.length > 0) {
      const colorInserts = productData.colors.map((color, index) => ({
        product_id: productId,
        name: color.name,
        hex_code: color.hexCode,
        sort_order: index
      }))

      const { error: colorsError } = await supabase
        .from('product_colors')
        .insert(colorInserts)

      if (colorsError) {
        console.error('Error inserting product colors:', colorsError)
        // Don't throw here, just log the error as colors are not critical
      }
    }

    // Return the created product with all related data
    const { data: fullProduct, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error('Error fetching created product:', fetchError)
      return { data: product } // Return basic product if fetch fails
    }

    return { data: fullProduct }
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

// Update product
export const updateProduct = async (productId, productData) => {
  try {
    // Update the main product
    const { data: product, error: productError } = await supabase
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

    if (productError) throw productError

    // Update product images if provided
    if (productData.images !== undefined) {
      // First, delete existing images
      const { error: deleteImagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)

      if (deleteImagesError) {
        console.error('Error deleting existing images:', deleteImagesError)
      }

      // Then insert new images if any
      if (productData.images && productData.images.length > 0) {
        const imageInserts = productData.images.map(image => ({
          product_id: productId,
          url: image.url,
          alt: image.alt || productData.name,
          sort_order: image.sortOrder || 0,
          is_primary: image.isPrimary || false
        }))

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageInserts)

        if (imagesError) {
          console.error('Error inserting product images:', imagesError)
        }
      }
    }

    // Update product sizes if provided
    if (productData.sizes !== undefined) {
      // First, delete existing sizes
      const { error: deleteSizesError } = await supabase
        .from('product_sizes')
        .delete()
        .eq('product_id', productId)

      if (deleteSizesError) {
        console.error('Error deleting existing sizes:', deleteSizesError)
      }

      // Then insert new sizes if any
      if (productData.sizes && productData.sizes.length > 0) {
        const sizeInserts = productData.sizes.map((size, index) => ({
          product_id: productId,
          value: size.value,
          size_type: size.sizeType || 'letter',
          sort_order: index
        }))

        const { error: sizesError } = await supabase
          .from('product_sizes')
          .insert(sizeInserts)

        if (sizesError) {
          console.error('Error inserting product sizes:', sizesError)
        }
      }
    }

    // Update product colors if provided
    if (productData.colors !== undefined) {
      // First, delete existing colors
      const { error: deleteColorsError } = await supabase
        .from('product_colors')
        .delete()
        .eq('product_id', productId)

      if (deleteColorsError) {
        console.error('Error deleting existing colors:', deleteColorsError)
      }

      // Then insert new colors if any
      if (productData.colors && productData.colors.length > 0) {
        const colorInserts = productData.colors.map((color, index) => ({
          product_id: productId,
          name: color.name,
          hex_code: color.hexCode,
          sort_order: index
        }))

        const { error: colorsError } = await supabase
          .from('product_colors')
          .insert(colorInserts)

        if (colorsError) {
          console.error('Error inserting product colors:', colorsError)
        }
      }
    }

    // Return the updated product with all related data
    const { data: fullProduct, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error('Error fetching updated product:', fetchError)
      return { data: product } // Return basic product if fetch fails
    }

    return { data: fullProduct }
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
