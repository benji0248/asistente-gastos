import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import useAuth from '@/hooks/useAuth'
import type { Account, Category, Household, HouseholdInvite, HouseholdMember } from '@/types'
import { listAccounts } from '@/lib/db/accounts'
import { listCategories } from '@/lib/db/categories'
import {
  acceptInvite,
  createHousehold,
  fetchHouseholdData,
  inviteMember,
  leaveHousehold,
  rejectInvite,
  setSharedCash,
} from '@/lib/db/household'

export interface AppDataContextType {
  accounts: Account[]
  categories: Category[]
  household: Household | null
  members: HouseholdMember[]
  invites: HouseholdInvite[]
  loading: boolean
  fetchError: string | null
  isLinked: boolean
  refresh: () => Promise<void>
  refreshAccounts: () => Promise<void>
  refreshCategories: () => Promise<void>
  createHousehold: (name: string) => Promise<void>
  inviteMember: (identifier: string) => Promise<void>
  acceptInvite: (inviteId: string) => Promise<void>
  rejectInvite: (inviteId: string) => Promise<void>
  leaveHousehold: () => Promise<void>
  removeMember: (userId: string) => Promise<void>
  setSharedCash: (enabled: boolean) => Promise<void>
  getOwnerName: (userId?: string | null) => string
}

export const AppDataContext = createContext<AppDataContextType | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { auth } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [invites, setInvites] = useState<HouseholdInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const normalizeMembers = useCallback(
    (rawMembers: HouseholdMember[]) => {
      if (!auth?.id || rawMembers.some((m) => m.id === auth.id)) return rawMembers
      return [
        { id: auth.id, username: auth.user || 'Yo', role: 'member' as const },
        ...rawMembers,
      ]
    },
    [auth?.id, auth?.user]
  )

  const refresh = useCallback(async () => {
    if (!auth?.id) {
      setAccounts([])
      setCategories([])
      setHousehold(null)
      setMembers([])
      setInvites([])
      setFetchError(null)
      return
    }

    setLoading(true)
    setFetchError(null)

    try {
      const [accountsData, categoriesData, householdData] = await Promise.all([
        listAccounts(),
        listCategories(),
        fetchHouseholdData(),
      ])

      setAccounts(accountsData)
      setCategories(categoriesData)
      setHousehold(householdData.household)
      setMembers(normalizeMembers(householdData.members))
      setInvites(householdData.invites)
    } catch (err) {
      console.error('Error cargando datos', err)
      setFetchError('No se pudieron cargar tus datos. Tocá Reintentar.')
    } finally {
      setLoading(false)
    }
  }, [auth?.id, normalizeMembers])

  const refreshAccounts = useCallback(async () => {
    const data = await listAccounts()
    setAccounts(data)
  }, [])

  const refreshCategories = useCallback(async () => {
    const data = await listCategories()
    setCategories(data)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const memberNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.username])),
    [members]
  )

  const getOwnerName = useCallback(
    (userId?: string | null) => {
      if (!userId) return 'Sin dueño'
      if (userId === auth?.id) return auth.user || 'Yo'
      return memberNameById.get(userId) ?? 'Miembro'
    },
    [auth?.id, auth?.user, memberNameById]
  )

  const handleCreateHousehold = useCallback(
    async (name: string) => {
      await createHousehold(name)
      await refresh()
    },
    [refresh]
  )

  const handleInviteMember = useCallback(
    async (identifier: string) => {
      await inviteMember(identifier)
      await refresh()
    },
    [refresh]
  )

  const handleAcceptInvite = useCallback(
    async (inviteId: string) => {
      await acceptInvite(inviteId)
      await refresh()
    },
    [refresh]
  )

  const handleRejectInvite = useCallback(
    async (inviteId: string) => {
      await rejectInvite(inviteId)
      await refresh()
    },
    [refresh]
  )

  const handleLeaveHousehold = useCallback(async () => {
    await leaveHousehold()
    await refresh()
  }, [refresh])

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      await leaveHousehold(userId)
      await refresh()
    },
    [refresh]
  )

  const handleSetSharedCash = useCallback(
    async (enabled: boolean) => {
      await setSharedCash(enabled)
      await refresh()
    },
    [refresh]
  )

  return (
    <AppDataContext.Provider
      value={{
        accounts,
        categories,
        household,
        members,
        invites,
        loading,
        fetchError,
        isLinked: Boolean(household && members.length > 1),
        refresh,
        refreshAccounts,
        refreshCategories,
        createHousehold: handleCreateHousehold,
        inviteMember: handleInviteMember,
        acceptInvite: handleAcceptInvite,
        rejectInvite: handleRejectInvite,
        leaveHousehold: handleLeaveHousehold,
        removeMember: handleRemoveMember,
        setSharedCash: handleSetSharedCash,
        getOwnerName,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData debe usarse dentro de AppDataProvider')
  return ctx
}

/** @deprecated use useAppData */
export function useHouseholdFromAppData() {
  return useAppData()
}
