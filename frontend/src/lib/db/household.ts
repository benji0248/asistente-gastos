import type {
  Household,
  HouseholdInvite,
  HouseholdMember,
  HouseholdRecurringExpense,
} from '@/types'
import { supabase, throwIfError } from './client'

export interface HouseholdData {
  household: Household | null
  members: HouseholdMember[]
  invites: HouseholdInvite[]
}

export async function fetchHouseholdData(): Promise<HouseholdData> {
  const householdId = await getMyHouseholdId()

  const [householdRes, membersRes, invitesRes] = await Promise.all([
    householdId
      ? supabase.from('households').select('*').eq('id', householdId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    householdId
      ? supabase
          .from('household_members')
          .select('user_id, role, profiles(id, username)')
          .eq('household_id', householdId)
          .eq('status', 'accepted')
      : Promise.resolve({ data: [], error: null }),
    fetchPendingInvites(),
  ])

  throwIfError(householdRes.error)
  throwIfError(membersRes.error)

  const members: HouseholdMember[] = (membersRes.data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.user_id,
      username: profile?.username ?? 'usuario',
      role: row.role as 'owner' | 'member',
    }
  })

  return {
    household: (householdRes.data as Household | null) ?? null,
    members,
    invites: invitesRes,
  }
}

async function getMyHouseholdId(): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (error) throw error
  return data?.household_id ?? null
}

export { getMyHouseholdId }

export async function fetchPendingInvites(): Promise<HouseholdInvite[]> {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  const email = session.session?.user.email?.toLowerCase()

  if (!userId) return []

  let query = supabase
    .from('household_invites')
    .select('*, households(id, name), profiles!household_invites_invited_by_fkey(id, username)')
    .eq('status', 'pending')

  if (email) {
    query = query.or(`invitee_user_id.eq.${userId},invitee_email.eq.${email}`)
  } else {
    query = query.eq('invitee_user_id', userId)
  }

  const { data, error } = await query
  throwIfError(error)
  return (data ?? []) as HouseholdInvite[]
}

export async function createHousehold(name: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  if (!userId) throw new Error('No autenticado')

  const existing = await fetchHouseholdData()
  if (existing.household) return

  const { data: household, error } = await supabase
    .from('households')
    .insert({ name, created_by: userId })
    .select('*')
    .single()
  throwIfError(error)

  const { error: memberError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'owner',
    status: 'accepted',
  })
  throwIfError(memberError)
}

export async function inviteMember(identifier: string): Promise<void> {
  const { error } = await supabase.rpc('invite_household_member', {
    p_identifier: identifier,
  })
  throwIfError(error)
}

export async function acceptInvite(inviteId: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  if (!userId) throw new Error('No autenticado')

  const { data: invite, error } = await supabase
    .from('household_invites')
    .select('*')
    .eq('id', inviteId)
    .eq('status', 'pending')
    .maybeSingle()
  throwIfError(error)
  if (!invite) throw new Error('Invitación no encontrada')

  const { error: memberError } = await supabase.from('household_members').upsert({
    household_id: invite.household_id,
    user_id: userId,
    role: 'member',
    status: 'accepted',
    joined_at: new Date().toISOString(),
  })
  throwIfError(memberError)

  const { error: inviteError } = await supabase
    .from('household_invites')
    .update({
      status: 'accepted',
      invitee_user_id: userId,
      responded_at: new Date().toISOString(),
    })
    .eq('id', inviteId)
  throwIfError(inviteError)
}

export async function rejectInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('household_invites')
    .update({ status: 'rejected', responded_at: new Date().toISOString() })
    .eq('id', inviteId)
  throwIfError(error)
}

export async function leaveHousehold(memberUserId?: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession()
  const userId = memberUserId ?? session.session?.user.id
  if (!userId) return

  const { household } = await fetchHouseholdData()
  if (!household) return

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', household.id)
    .eq('user_id', userId)
  throwIfError(error)

  const { data: remaining } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', household.id)

  if (!remaining?.length) {
    await supabase.from('households').delete().eq('id', household.id)
  }
}

export async function setSharedCash(enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_shared_cash', { p_enabled: enabled })
  throwIfError(error)
}

export async function ensureRecurringExpenses(): Promise<void> {
  const { error } = await supabase.rpc('ensure_recurring_expenses')
  throwIfError(error)
}

export async function listRecurringExpenses(): Promise<HouseholdRecurringExpense[]> {
  const householdId = await getMyHouseholdId()
  if (!householdId) return []

  const { data, error } = await supabase
    .from('household_recurring_expenses')
    .select('*')
    .eq('household_id', householdId)
    .order('title')
  throwIfError(error)
  return (data ?? []) as HouseholdRecurringExpense[]
}

export async function createRecurringExpense(payload: {
  title: string
  amount_type: 'fixed' | 'estimated'
  fixed_amount: number
  category_id?: number | null
}): Promise<void> {
  const { data: session } = await supabase.auth.getSession()
  const userId = session.session?.user.id
  const householdId = await getMyHouseholdId()
  if (!userId || !householdId) throw new Error('No hay hogar')

  const { error } = await supabase.from('household_recurring_expenses').insert({
    household_id: householdId,
    title: payload.title.trim(),
    amount_type: payload.amount_type,
    fixed_amount: payload.fixed_amount,
    category_id: payload.category_id ?? null,
    created_by: userId,
  })
  throwIfError(error)
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
  const { error } = await supabase
    .from('household_recurring_expenses')
    .update({
      title: payload.title.trim(),
      amount_type: payload.amount_type,
      fixed_amount: payload.fixed_amount,
      category_id: payload.category_id ?? null,
    })
    .eq('id', id)
  throwIfError(error)
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const { error } = await supabase.from('household_recurring_expenses').delete().eq('id', id)
  throwIfError(error)
}
