import type { Account, newAccount } from '@/types'
import { apiFetch } from '@/lib/api/http'

function normalizeAccount(row: Account): Account {
  return {
    ...row,
    id: String(row.id),
    balance: Number(row.balance),
  }
}

export async function listAccounts(): Promise<Account[]> {
  const rows = await apiFetch<Account[]>('/api/v1/accounts')
  return (rows ?? []).map(normalizeAccount)
}

export async function createAccount(_userId: string, payload: newAccount): Promise<Account> {
  const created = await apiFetch<Account>('/api/v1/accounts', {
    method: 'POST',
    body: {
      type: payload.type,
      balance: payload.balance,
      description: payload.description,
    },
  })
  return normalizeAccount(created)
}

export async function updateAccount(accountId: string, payload: Partial<Account>): Promise<void> {
  await apiFetch(`/api/v1/accounts/${accountId}`, {
    method: 'PATCH',
    body: {
      type: payload.type,
      balance: payload.balance,
      description: payload.description,
    },
  })
}

export async function setAccountBalance(accountId: string, balance: number): Promise<void> {
  await updateAccount(accountId, { balance })
}

export async function addFunds(accountId: string, amount: number): Promise<void> {
  await apiFetch(`/api/v1/accounts/${accountId}/adjust`, {
    method: 'POST',
    body: { delta: amount },
  })
}

export async function transferFunds(
  fromId: string,
  toId: string,
  amount: number
): Promise<void> {
  await apiFetch('/api/v1/accounts/transfer', {
    method: 'POST',
    body: {
      from_id: Number(fromId),
      to_id: Number(toId),
      amount,
    },
  })
}

export async function deleteAccount(accountId: string): Promise<void> {
  await apiFetch(`/api/v1/accounts/${accountId}`, { method: 'DELETE' })
}
