import type {
  Household,
  HouseholdInvite,
  HouseholdMember,
  HouseholdRecurringExpense,
} from '@/types'
import { apiFetch } from '@/lib/api/http'

export interface HouseholdData {
  household: Household | null
  members: HouseholdMember[]
  invites: HouseholdInvite[]
}

export async function fetchHouseholdData(): Promise<HouseholdData> {
  return apiFetch<HouseholdData>('/api/v1/household')
}

export async function getMyHouseholdId(): Promise<string | null> {
  const data = await fetchHouseholdData()
  return data.household?.id ?? null
}

export async function fetchPendingInvites(): Promise<HouseholdInvite[]> {
  const data = await fetchHouseholdData()
  return data.invites ?? []
}

export async function createHousehold(name: string): Promise<void> {
  await apiFetch('/api/v1/household', {
    method: 'POST',
    body: { name },
  })
}

export async function inviteMember(identifier: string): Promise<void> {
  await apiFetch('/api/v1/household/invites', {
    method: 'POST',
    body: { identifier },
  })
}

export async function acceptInvite(inviteId: string): Promise<void> {
  await apiFetch(`/api/v1/household/invites/${inviteId}/accept`, {
    method: 'POST',
  })
}

export async function rejectInvite(inviteId: string): Promise<void> {
  await apiFetch(`/api/v1/household/invites/${inviteId}/reject`, {
    method: 'POST',
  })
}

export async function leaveHousehold(memberUserId?: string): Promise<void> {
  await apiFetch('/api/v1/household/leave', {
    method: 'POST',
    body: memberUserId ? { member_user_id: memberUserId } : {},
  })
}

export async function setSharedCash(enabled: boolean): Promise<void> {
  await apiFetch('/api/v1/household/shared-cash', {
    method: 'POST',
    body: { enabled },
  })
}

export async function ensureRecurringExpenses(): Promise<void> {
  await apiFetch('/api/v1/household/ensure-recurring', { method: 'POST' })
}

export async function listRecurringExpenses(): Promise<HouseholdRecurringExpense[]> {
  return apiFetch<HouseholdRecurringExpense[]>('/api/v1/household/recurring')
}

export async function createRecurringExpense(payload: {
  title: string
  amount_type: 'fixed' | 'estimated'
  fixed_amount: number
  category_id?: number | null
}): Promise<void> {
  await apiFetch('/api/v1/household/recurring', {
    method: 'POST',
    body: {
      title: payload.title.trim(),
      amount_type: payload.amount_type,
      fixed_amount: payload.fixed_amount,
      category_id: payload.category_id ?? null,
    },
  })
  await ensureRecurringExpenses()
}

export async function updateRecurringExpense(
  id: string,
  payload: {
    title: string
    amount_type: 'fixed' | 'estimated'
    fixed_amount: number
    category_id?: number | null
  }
): Promise<void> {
  await apiFetch(`/api/v1/household/recurring/${id}`, {
    method: 'PATCH',
    body: {
      title: payload.title.trim(),
      amount_type: payload.amount_type,
      fixed_amount: payload.fixed_amount,
      category_id: payload.category_id ?? null,
    },
  })
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  await apiFetch(`/api/v1/household/recurring/${id}`, { method: 'DELETE' })
}
