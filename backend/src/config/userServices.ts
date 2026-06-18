import { getSupabaseAdmin } from '../lib/supabase'
import { Profile } from './types'

class userServices {
    static getAllUsers = async () => {
        try {
            const { data, error } = await getSupabaseAdmin().from('profiles').select('*')
            if (error) throw error
            if (!data) {
                throw new Error('No se encontraron usuarios')
            }
            return data
        } catch (err) {
            console.error('Error en el servicio getAllUsers:', err)
        }
    }

    static getUserById = async (userId: string) => {
        try {
            const { data, error } = await getSupabaseAdmin()
                .from('profiles')
                .select('*')
                .eq('id', userId)
            if (error) throw error
            if (!data) {
                throw new Error('No se encontro el usuario')
            }
            return data as Profile[]
        } catch (err) {
            console.error('Error en el servicio getUserById', err)
        }
    }

    static updateOneUser = async (userId: string, updateData: Partial<Profile>) => {
        try {
            const [key, value] = Object.entries(updateData)[0]
            const { error } = await getSupabaseAdmin()
                .from('profiles')
                .update({ [key]: value })
                .eq('id', userId)
            if (error) throw error
        } catch (err) {
            console.error('Error en el servicio updateOneUser', err)
        }
    }

    static deleteOneUser = async (userId: string) => {
        try {
            const { error } = await getSupabaseAdmin()
                .from('profiles')
                .delete()
                .eq('id', userId)
            if (error) throw error
        } catch (err) {
            console.error('Error en el servicio deleteOneUser', err)
        }
    }
}

export default userServices
