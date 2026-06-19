export interface Profile {
  id: string
  username: string
  created_at: Date
  role: number
}

export interface Household {
  id: string
  name: string
  created_by: string
  created_at: Date
  shared_cash?: boolean
}

export interface HouseholdMember {
  household_id: string
  user_id: string
  role: 'owner' | 'member'
  status: 'accepted' | 'left'
  joined_at: Date
  profile?: Profile
}

export interface HouseholdInvite {
  id: string
  household_id: string
  invited_by: string
  invitee_user_id?: string | null
  invitee_email?: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: Date
  responded_at?: Date | null
}

export interface HouseholdContext {
  householdId?: string
  sharedCash?: boolean
  members: Array<{
    id: string
    username: string
    role: 'owner' | 'member'
  }>
  visibleUserIds: string[]
}

export interface newExpenses {
  title: string
  amount: number
  payment_date: Date
  is_paid: boolean
  user_id: string
  account_id: string
  category_id: string
}

export interface Expenses {
  id: string
  title: string
  amount: number
  amount_paid?: number
  payment_date: Date
  created_at: Date
  is_paid: boolean
  user_id: string
  category_id: string
  account_id: string
}

export type ExpensePaymentFilter = 'all' | 'paid' | 'unpaid'

export interface ExpensesMonthSummary {
  pendingCount: number
  paidTotal: number
  pendingTotal: number
  monthTotal: number
}

export interface PaginatedExpenses {
  data: Expenses[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: ExpensesMonthSummary
}

export interface newCategory {
  name: string
}

export interface newAccount {
  type: string
  balance: number
  description: string
  owner_user_id?: string
}

export interface Account {
  id: string
  user_id: string
  household_id?: string | null
  type: string
  balance: number
  description: string
  created_at: Date
}

export interface Role {
  id: string
  name: string
}
