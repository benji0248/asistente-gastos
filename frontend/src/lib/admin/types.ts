import type { PlanId, PlanStatus } from "@/lib/billing/plans"

export interface AdminUser {
  id: string
  username: string
  email: string
  role: number
  plan: PlanId
  planStatus: PlanStatus
  isBlocked: boolean
  lastLoginAt: string | null
  createdAt: string | null
}

export interface AdminUsersListResponse {
  users: AdminUser[]
  total: number
}

export interface AdminCreateUserInput {
  email: string
  password: string
  username?: string
  plan?: PlanId
  role?: number
}

export interface AdminUpdateUserInput {
  username?: string
  role?: number
  plan?: PlanId
  planStatus?: PlanStatus
  isBlocked?: boolean
}

export interface AdminSetPasswordInput {
  password: string
}
