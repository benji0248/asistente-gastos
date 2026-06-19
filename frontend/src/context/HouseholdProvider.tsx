import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate"
import useAuth from "@/hooks/useAuth"
import type { Household, HouseholdInvite, HouseholdMember } from "@/types"

export interface HouseholdContextType {
  household: Household | null
  members: HouseholdMember[]
  invites: HouseholdInvite[]
  loading: boolean
  fetchError: string | null
  isLinked: boolean
  refreshHousehold: () => Promise<void>
  createHousehold: (name: string) => Promise<void>
  inviteMember: (identifier: string) => Promise<void>
  acceptInvite: (inviteId: string) => Promise<void>
  rejectInvite: (inviteId: string) => Promise<void>
  leaveHousehold: () => Promise<void>
  removeMember: (userId: string) => Promise<void>
  getOwnerName: (userId?: string | null) => string
}

export const HouseholdContext = createContext<HouseholdContextType | null>(null)

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useAuth()
  const axiosPrivate = useAxiosPrivate()
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [invites, setInvites] = useState<HouseholdInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const normalizeMembers = useCallback((rawMembers: HouseholdMember[] | undefined) => {
    const list = rawMembers ?? []
    if (!auth?.id || list.some((member) => member.id === auth.id)) return list
    return [
      {
        id: auth.id,
        username: auth.user || "Yo",
        role: "member" as const,
      },
      ...list,
    ]
  }, [auth?.id, auth?.user])

  const refreshHousehold = useCallback(async () => {
    if (!auth?.id || !auth.accessToken) {
      if (!auth?.id) {
        setHousehold(null)
        setMembers([])
        setInvites([])
        setFetchError(null)
      }
      return
    }

    setLoading(true)
    setFetchError(null)

    try {
      const householdRes = await axiosPrivate.get("/household")
      setHousehold(householdRes.data?.household ?? null)
      setMembers(normalizeMembers(householdRes.data?.members))
    } catch (err) {
      console.error("No se pudo cargar el hogar", err)
      setFetchError("No se pudo cargar tu hogar. Si ya estabas enlazado, tocá Reintentar.")
    }

    try {
      const invitesRes = await axiosPrivate.get("/household/invites")
      setInvites(invitesRes.data ?? [])
    } catch (err) {
      console.warn("No se pudieron cargar las invitaciones del hogar", err)
    } finally {
      setLoading(false)
    }
  }, [auth?.id, auth?.accessToken, axiosPrivate, normalizeMembers])

  useEffect(() => {
    void refreshHousehold()
  }, [refreshHousehold])

  const createHousehold = useCallback(async (name: string) => {
    await axiosPrivate.post("/household", { name })
    await refreshHousehold()
  }, [axiosPrivate, refreshHousehold])

  const inviteMember = useCallback(async (identifier: string) => {
    await axiosPrivate.post("/household/invites", { identifier })
    await refreshHousehold()
  }, [axiosPrivate, refreshHousehold])

  const acceptInvite = useCallback(async (inviteId: string) => {
    await axiosPrivate.post(`/household/invites/${inviteId}/accept`)
    await refreshHousehold()
  }, [axiosPrivate, refreshHousehold])

  const rejectInvite = useCallback(async (inviteId: string) => {
    await axiosPrivate.post(`/household/invites/${inviteId}/reject`)
    await refreshHousehold()
  }, [axiosPrivate, refreshHousehold])

  const leaveHousehold = useCallback(async () => {
    await axiosPrivate.delete("/household/members/me")
    await refreshHousehold()
  }, [axiosPrivate, refreshHousehold])

  const removeMember = useCallback(async (userId: string) => {
    await axiosPrivate.delete(`/household/members/${userId}`)
    await refreshHousehold()
  }, [axiosPrivate, refreshHousehold])

  const memberNameById = useMemo(() => {
    return new Map(members.map((member) => [member.id, member.username]))
  }, [members])

  const getOwnerName = useCallback((userId?: string | null) => {
    if (!userId) return "Sin dueño"
    if (userId === auth?.id) return auth.user || "Yo"
    return memberNameById.get(userId) ?? "Miembro"
  }, [auth?.id, auth?.user, memberNameById])

  return (
    <HouseholdContext.Provider
      value={{
        household,
        members,
        invites,
        loading,
        fetchError,
        isLinked: Boolean(household && members.length > 1),
        refreshHousehold,
        createHousehold,
        inviteMember,
        acceptInvite,
        rejectInvite,
        leaveHousehold,
        removeMember,
        getOwnerName,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  )
}
