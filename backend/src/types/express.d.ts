declare global {
  namespace Express {
    interface Request {
      userId?: string
      user?: string
      email?: string
      userMetadata?: Record<string, unknown>
      role?: number
      householdId?: string
      sharedCash?: boolean
      visibleUserIds?: string[]
      householdMembers?: Array<{
        id: string
        username: string
        role: 'owner' | 'member'
      }>
    }
  }
}

export {}
