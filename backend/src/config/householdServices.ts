import type { User } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../lib/supabase'
import { HouseholdContext, HouseholdInvite, Profile } from './types'

type HouseholdMemberRow = {
  household_id: string
  user_id: string
  role: 'owner' | 'member'
  profiles?: Profile | Profile[] | null
}

function profileFromRelation(relation: Profile | Profile[] | null | undefined): Profile | undefined {
  if (Array.isArray(relation)) return relation[0]
  return relation ?? undefined
}

class householdServices {
  static getHouseholdContext = async (userId: string): Promise<HouseholdContext> => {
    const admin = getSupabaseAdmin()
    const { data: membership, error: membershipError } = await admin
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .maybeSingle()

    if (membershipError) throw membershipError
    if (!membership?.household_id) {
      return { members: [], visibleUserIds: [userId] }
    }

    const { data: members, error: membersError } = await admin
      .from('household_members')
      .select('household_id, user_id, role, profiles(id, username, role, created_at)')
      .eq('household_id', membership.household_id)
      .eq('status', 'accepted')

    if (membersError) throw membersError

    const visibleUserIds = (members ?? []).map((member) => member.user_id)
    return {
      householdId: membership.household_id,
      visibleUserIds: visibleUserIds.length ? visibleUserIds : [userId],
      members: ((members ?? []) as HouseholdMemberRow[]).map((member) => {
        const profile = profileFromRelation(member.profiles)
        return {
          id: member.user_id,
          username: profile?.username ?? 'usuario',
          role: member.role,
        }
      }),
    }
  }

  static getCurrentHousehold = async (userId: string) => {
    const context = await this.getHouseholdContext(userId)
    if (!context.householdId) return null

    const { data: household, error } = await getSupabaseAdmin()
      .from('households')
      .select('*')
      .eq('id', context.householdId)
      .maybeSingle()

    if (error) throw error
    return { household, members: context.members, visibleUserIds: context.visibleUserIds }
  }

  static createHousehold = async (userId: string, name: string) => {
    const existing = await this.getCurrentHousehold(userId)
    if (existing?.household) return existing

    const admin = getSupabaseAdmin()
    const { data: household, error } = await admin
      .from('households')
      .insert({ name, created_by: userId })
      .select('*')
      .single()

    if (error) throw error

    const { error: memberError } = await admin
      .from('household_members')
      .insert({ household_id: household.id, user_id: userId, role: 'owner', status: 'accepted' })

    if (memberError) throw memberError
    return this.getCurrentHousehold(userId)
  }

  static findProfileByIdentifier = async (identifier: string): Promise<Profile | null> => {
    const normalized = identifier.trim()
    const { data: profileByUsername, error } = await getSupabaseAdmin()
      .from('profiles')
      .select('*')
      .ilike('username', normalized)
      .maybeSingle()

    if (error) throw error
    if (profileByUsername) return profileByUsername as Profile

    const { data } = await getSupabaseAdmin().auth.admin.listUsers()
    const matchedUser = data.users.find(
      (user) => user.email?.toLowerCase() === normalized.toLowerCase()
    )
    if (!matchedUser) return null

    const { data: profileByEmail, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('*')
      .eq('id', matchedUser.id)
      .maybeSingle()

    if (profileError) throw profileError
    return (profileByEmail as Profile | null) ?? null
  }

  static inviteMember = async (invitedBy: string, identifier: string) => {
    const household = await this.getCurrentHousehold(invitedBy)
    if (!household?.household) {
      throw new Error('Primero tenés que crear un hogar')
    }

    const invitee = await this.findProfileByIdentifier(identifier)
    const normalized = identifier.trim().toLowerCase()

    if (invitee && household.visibleUserIds.includes(invitee.id)) {
      throw new Error('La persona ya pertenece a tu hogar')
    }

    const { data: invite, error } = await getSupabaseAdmin()
      .from('household_invites')
      .insert({
        household_id: household.household.id,
        invited_by: invitedBy,
        invitee_user_id: invitee?.id ?? null,
        invitee_email: invitee ? null : normalized,
      })
      .select('*')
      .single()

    if (error) throw error
    return invite as HouseholdInvite
  }

  static getPendingInvites = async (user: User) => {
    let query = getSupabaseAdmin()
      .from('household_invites')
      .select('*, households(id, name), profiles!household_invites_invited_by_fkey(id, username)')
      .eq('status', 'pending')

    if (user.email) {
      query = query.or(`invitee_user_id.eq.${user.id},invitee_email.eq.${user.email.toLowerCase()}`)
    } else {
      query = query.eq('invitee_user_id', user.id)
    }

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  static acceptInvite = async (user: User, inviteId: string) => {
    const admin = getSupabaseAdmin()
    const { data: invite, error } = await admin
      .from('household_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) throw error
    if (!invite) throw new Error('Invitación no encontrada')

    const emailMatches = user.email && invite.invitee_email === user.email.toLowerCase()
    if (invite.invitee_user_id !== user.id && !emailMatches) {
      throw new Error('La invitación no pertenece al usuario actual')
    }

    const currentHousehold = await this.getCurrentHousehold(user.id)
    if (currentHousehold?.household && currentHousehold.household.id !== invite.household_id) {
      throw new Error('Ya pertenecés a otro hogar')
    }

    const { error: memberError } = await admin
      .from('household_members')
      .upsert({
        household_id: invite.household_id,
        user_id: user.id,
        role: 'member',
        status: 'accepted',
        joined_at: new Date().toISOString(),
      })

    if (memberError) throw memberError

    const { error: inviteError } = await admin
      .from('household_invites')
      .update({
        status: 'accepted',
        invitee_user_id: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', inviteId)

    if (inviteError) throw inviteError
    return this.getCurrentHousehold(user.id)
  }

  static rejectInvite = async (user: User, inviteId: string) => {
    const invites = await this.getPendingInvites(user)
    const canReject = invites.some((invite) => invite.id === inviteId)
    if (!canReject) throw new Error('Invitación no encontrada')

    const { error } = await getSupabaseAdmin()
      .from('household_invites')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', inviteId)

    if (error) throw error
  }

  static leaveHousehold = async (userId: string, memberUserId = userId) => {
    const household = await this.getCurrentHousehold(userId)
    if (!household?.household) return
    if (!household.visibleUserIds.includes(memberUserId)) {
      throw new Error('La persona no pertenece a tu hogar')
    }

    const { error } = await getSupabaseAdmin()
      .from('household_members')
      .delete()
      .eq('household_id', household.household.id)
      .eq('user_id', memberUserId)

    if (error) throw error

    const { data: remaining, error: remainingError } = await getSupabaseAdmin()
      .from('household_members')
      .select('user_id')
      .eq('household_id', household.household.id)

    if (remainingError) throw remainingError
    if (!remaining?.length) {
      await getSupabaseAdmin()
        .from('households')
        .delete()
        .eq('id', household.household.id)
    }
  }
}

export default householdServices
