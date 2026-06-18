import { getSupabaseAdmin } from '../lib/supabase'
import { newCategory } from './types'

class categoriesServices {
  private static normalizeUserIds = (userIds: string | string[]) => {
    return Array.isArray(userIds) ? userIds : [userIds]
  }

  static getCategories = async (userIds: string | string[], activeOnly = false) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('categories')
        .select('*')
        .in('user_id', this.normalizeUserIds(userIds))

      if (error) throw error

      let result = data ?? []
      if (activeOnly) {
        result = result.filter((c) => c.is_enabled !== false)
      }

      return result.sort((a, b) => {
        const aSystem = a.is_system === true ? 1 : 0
        const bSystem = b.is_system === true ? 1 : 0
        if (bSystem !== aSystem) return bSystem - aSystem
        return String(a.name).localeCompare(String(b.name))
      })
    } catch (err) {
      console.error('Error en el servicio getCategories', err)
      throw err
    }
  }

  static getOneCategory = async (categoryId: string) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('categories')
        .select('*')
        .eq('id', categoryId)
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error en el servicio getOneCategory')
    }
  }

  static createOneCategory = async (userId: string, categoryTitle: newCategory) => {
    try {
      const { error } = await getSupabaseAdmin()
        .from('categories')
        .insert({
          user_id: userId,
          name: categoryTitle.name,
          is_system: false,
          is_enabled: true,
        })
      if (error) throw error
    } catch (err) {
      console.error('Error en el servicio createOneCategory', err)
    }
  }

  static updateOneCategory = async (
    categoryId: string,
    updates: { name?: string; is_enabled?: boolean },
    visibleUserIds?: string[]
  ) => {
    try {
      let query = getSupabaseAdmin()
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
      if (visibleUserIds?.length) {
        query = query.in('user_id', visibleUserIds)
      }
      const { error } = await query
      if (error) throw error
    } catch (err) {
      console.error('Error en el servicio updateOneCategory', err)
      throw err
    }
  }

  static deleteOneCategory = async (categoryId: string, visibleUserIds?: string[]) => {
    try {
      let fetchQuery = getSupabaseAdmin()
        .from('categories')
        .select('is_system, user_id')
        .eq('id', categoryId)
      if (visibleUserIds?.length) {
        fetchQuery = fetchQuery.in('user_id', visibleUserIds)
      }
      const { data: category, error: fetchError } = await fetchQuery.maybeSingle()

      if (fetchError) throw fetchError
      if (!category) throw new Error('Categoría no encontrada')
      if (category?.is_system) {
        throw new Error('No se pueden eliminar categorías base')
      }

      let deleteQuery = getSupabaseAdmin()
        .from('categories')
        .delete()
        .eq('id', categoryId)
      if (visibleUserIds?.length) {
        deleteQuery = deleteQuery.in('user_id', visibleUserIds)
      }
      const { error } = await deleteQuery
      if (error) throw error
    } catch (err) {
      console.error('Error en el servicio deleteOneCategory', err)
      throw err
    }
  }
}

export default categoriesServices
