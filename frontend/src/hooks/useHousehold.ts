import { useAppData } from '@/context/AppDataProvider'

export default function useHousehold() {
  const {
    household,
    members,
    invites,
    loading,
    fetchError,
    isLinked,
    refresh,
    createHousehold,
    inviteMember,
    acceptInvite,
    rejectInvite,
    leaveHousehold,
    removeMember,
    getOwnerName,
  } = useAppData()

  return {
    household,
    members,
    invites,
    loading,
    fetchError,
    isLinked,
    refreshHousehold: refresh,
    createHousehold,
    inviteMember,
    acceptInvite,
    rejectInvite,
    leaveHousehold,
    removeMember,
    getOwnerName,
  }
}
