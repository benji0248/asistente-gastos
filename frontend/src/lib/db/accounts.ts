import type { Account, newAccount } from '@/types'
import { supabase, throwIfError } from './client'
import { getMyHouseholdId } from './household'

export async function listAccounts(): Promise<Account[]> {
  const householdId = await getMyHouseholdId()

  let household: { id: string; shared_cash: boolean } | null = null
  if (householdId) {
    const { data } = await supabase
      .from('households')
      .select('id, shared_cash')
      .eq('id', householdId)
      .maybeSingle()
    household = data
  }

  const { data: personal, error } = await supabase
    .from('accounts')
    .select('*')
    .is('household_id', null)
    .order('created_at', { ascending: true })

  throwIfError(error)

  let accounts = (personal ?? []) as Account[]

  if (household?.shared_cash && household.id) {
    accounts = accounts.filter((a) => a.type !== 'cash')

    const { data: shared } = await supabase
      .from('accounts')
      .select('*')
      .eq('household_id', household.id)
      .eq('type', 'cash')
      .maybeSingle()

    if (shared) accounts = [...accounts, shared as Account]
  }

  return accounts
}

export async function createAccount(userId: string, payload: newAccount): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      type: payload.type,
      balance: payload.balance,
      description: payload.description,
    })
    .select('*')
    .single()
  throwIfError(error)
  return data as Account
}

export async function updateAccount(accountId: string, payload: Partial<Account>): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .update({
      type: payload.type,
      balance: payload.balance,
      description: payload.description,
    })
    .eq('id', accountId)
  throwIfError(error)
}

export async function setAccountBalance(accountId: string, balance: number): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .update({ balance })
    .eq('id', accountId)
  throwIfError(error)
}

export async function addFunds(accountId: string, amount: number): Promise<void> {
  const { error } = await supabase.rpc('adjust_account_balance', {
    p_account_id: Number(accountId),
    p_delta: amount,
  })
  throwIfError(error)
}

export async function transferFunds(
  fromId: string,
  toId: string,
  amount: number
): Promise<void> {
  const { error } = await supabase.rpc('transfer_funds', {
    p_from_id: Number(fromId),
    p_to_id: Number(toId),
    p_amount: amount,
  })
  throwIfError(error)
}

export async function deleteAccount(accountId: string): Promise<void> {
  const { data: account } = await supabase
    .from('accounts')
    .select('household_id')
    .eq('id', accountId)
    .maybeSingle()

  if (account?.household_id) {
    throw new Error('No se puede eliminar el efectivo compartido del hogar')
  }

  const { error } = await supabase.from('accounts').delete().eq('id', accountId)
  throwIfError(error)
}
