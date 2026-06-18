import { getSupabaseAdmin } from '../lib/supabase'

class roleServices {

    static getRole = async (userId: string) => {
        const { data, error } = await getSupabaseAdmin()
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()
        if (error) throw error
        return data.role
    }

}

export default roleServices
