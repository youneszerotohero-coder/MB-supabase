import { supabase } from '../lib/supabaseClient'

// Get all categories
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        parent:categories(*),
        children:categories(*),
        products:products(count)
      `)
      .order('name', { ascending: true })

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

// Get single category by ID
export const getCategoryById = async (categoryId) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error fetching category:', error)
    throw error
  }
}

// Create new category
export const createCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: categoryData.name,
        slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        parent_id: categoryData.parentId || null
      })
      .select()
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error creating category:', error)
    throw error
  }
}

// Update category
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: categoryData.name,
        slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        parent_id: categoryData.parentId || null
      })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error

    return { data }
  } catch (error) {
    console.error('Error updating category:', error)
    throw error
  }
}

// Delete category
export const deleteCategory = async (categoryId) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}
