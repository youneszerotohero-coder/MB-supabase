import { supabase } from '../lib/supabaseClient'

// Product Images
export const getProductImages = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error fetching product images:', error)
    throw error
  }
}

export const createProductImage = async (imageData) => {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: imageData.productId,
        url: imageData.url,
        alt: imageData.alt,
        sort_order: imageData.sortOrder || 0,
        is_primary: imageData.isPrimary || false
      })
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error creating product image:', error)
    throw error
  }
}

export const updateProductImage = async (imageId, imageData) => {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .update({
        url: imageData.url,
        alt: imageData.alt,
        sort_order: imageData.sortOrder,
        is_primary: imageData.isPrimary
      })
      .eq('id', imageId)
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error updating product image:', error)
    throw error
  }
}

export const deleteProductImage = async (imageId) => {
  try {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting product image:', error)
    throw error
  }
}

// Product Colors
export const getProductColors = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_colors')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error fetching product colors:', error)
    throw error
  }
}

export const createProductColor = async (colorData) => {
  try {
    const { data, error } = await supabase
      .from('product_colors')
      .insert({
        product_id: colorData.productId,
        name: colorData.name,
        hex_code: colorData.hexCode,
        sort_order: colorData.sortOrder || 0
      })
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error creating product color:', error)
    throw error
  }
}

export const updateProductColor = async (colorId, colorData) => {
  try {
    const { data, error } = await supabase
      .from('product_colors')
      .update({
        name: colorData.name,
        hex_code: colorData.hexCode,
        sort_order: colorData.sortOrder
      })
      .eq('id', colorId)
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error updating product color:', error)
    throw error
  }
}

export const deleteProductColor = async (colorId) => {
  try {
    const { error } = await supabase
      .from('product_colors')
      .delete()
      .eq('id', colorId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting product color:', error)
    throw error
  }
}

// Product Sizes
export const getProductSizes = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_sizes')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error fetching product sizes:', error)
    throw error
  }
}

export const createProductSize = async (sizeData) => {
  try {
    const { data, error } = await supabase
      .from('product_sizes')
      .insert({
        product_id: sizeData.productId,
        value: sizeData.value,
        size_type: sizeData.sizeType || 'letter',
        sort_order: sizeData.sortOrder || 0
      })
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error creating product size:', error)
    throw error
  }
}

export const updateProductSize = async (sizeId, sizeData) => {
  try {
    const { data, error } = await supabase
      .from('product_sizes')
      .update({
        value: sizeData.value,
        size_type: sizeData.sizeType,
        sort_order: sizeData.sortOrder
      })
      .eq('id', sizeId)
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error updating product size:', error)
    throw error
  }
}

export const deleteProductSize = async (sizeId) => {
  try {
    const { error } = await supabase
      .from('product_sizes')
      .delete()
      .eq('id', sizeId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting product size:', error)
    throw error
  }
}

// Product Variants
export const getProductVariants = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        color:product_colors(*),
        size:product_sizes(*)
      `)
      .eq('product_id', productId)

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error fetching product variants:', error)
    throw error
  }
}

export const createProductVariant = async (variantData) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: variantData.productId,
        color_id: variantData.colorId,
        size_id: variantData.sizeId,
        stock_quantity: variantData.stockQuantity || 0,
        reserved_qty: variantData.reservedQty || 0,
        sold_count: variantData.soldCount || 0,
        revenue: variantData.revenue || 0
      })
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error creating product variant:', error)
    throw error
  }
}

export const updateProductVariant = async (variantId, variantData) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update({
        color_id: variantData.colorId,
        size_id: variantData.sizeId,
        stock_quantity: variantData.stockQuantity,
        reserved_qty: variantData.reservedQty,
        sold_count: variantData.soldCount,
        revenue: variantData.revenue
      })
      .eq('id', variantId)
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error updating product variant:', error)
    throw error
  }
}

export const deleteProductVariant = async (variantId) => {
  try {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting product variant:', error)
    throw error
  }
}

// Update variant stock
export const updateVariantStock = async (variantId, stockData) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update({
        stock_quantity: stockData.stockQuantity || stockData.stock_quantity,
        reserved_qty: stockData.reservedQty || stockData.reserved_qty || 0
      })
      .eq('id', variantId)
      .select()
      .single()

    if (error) throw error
    return { data }
  } catch (error) {
    console.error('Error updating variant stock:', error)
    throw error
  }
}
