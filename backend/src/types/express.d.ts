declare global {
  namespace Express {
    interface Request {
      userId?: string
      user?: string
      email?: string
      role?: number
      householdId?: string
      visibleUserIds?: string[]
      householdMembers?: Array<{
        id: string
        username: string
        role: 'owner' | 'member'
      }>
      supabaseUser?: import('@supabase/supabase-js').User
    }
  }
}

export {}
