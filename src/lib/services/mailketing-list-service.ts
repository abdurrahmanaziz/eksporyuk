/**
 * Mailketing List Service
 * Handles automatic user subscription to Mailketing lists based on role
 */

import { prisma } from '@/lib/prisma'
import { mailketing } from '@/lib/integrations/mailketing'
import { Role } from '@prisma/client'

interface AddToListResult {
  success: boolean
  listsAdded: string[]
  errors: string[]
}

/**
 * Add user to all Mailketing lists configured for their role
 * Called when: user registers, user upgrades membership, role changes
 */
export async function addUserToRoleLists(
  userId: string,
  role: Role,
  options?: {
    isRegistration?: boolean // true if this is initial registration
    isUpgrade?: boolean // true if this is an upgrade
  }
): Promise<AddToListResult> {
  const result: AddToListResult = {
    success: true,
    listsAdded: [],
    errors: []
  }

  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        whatsapp: true,
        role: true,
        mailketingLists: true
      }
    })

    if (!user || !user.email) {
      result.success = false
      result.errors.push('User tidak ditemukan atau tidak memiliki email')
      return result
    }

    // Get active list mappings for this role
    const mappings = await prisma.roleMailketingList.findMany({
      where: {
        role,
        isActive: true,
        ...(options?.isRegistration && { autoAddOnRegister: true }),
        ...(options?.isUpgrade && { autoAddOnUpgrade: true })
      }
    })

    if (mappings.length === 0) {
      console.log(`📋 No Mailketing lists configured for role: ${role}`)
      return result
    }

    console.log(`📧 Adding user ${user.email} to ${mappings.length} Mailketing lists for role: ${role}`)

    // Get current user's mailketing lists
    const currentLists = (user.mailketingLists as string[]) || []

    // Add to each list
    for (const mapping of mappings) {
      try {
        // Skip if user is already in this list
        if (currentLists.includes(mapping.mailketingListId)) {
          console.log(`   ℹ️ User already in list: ${mapping.mailketingListName}`)
          continue
        }

        // Add to Mailketing via API
        const addResult = await mailketing.addToList(
          user.email,
          mapping.mailketingListId,
          {
            name: user.name || undefined,
            phone: user.whatsapp || user.phone || undefined,
            customFields: {
              role: role,
              user_id: userId
            }
          }
        )

        if (addResult.success) {
          result.listsAdded.push(mapping.mailketingListName)
          currentLists.push(mapping.mailketingListId)
          console.log(`   ✅ Added to: ${mapping.mailketingListName}`)
        } else {
          result.errors.push(`Gagal menambahkan ke ${mapping.mailketingListName}: ${addResult.error}`)
          console.error(`   ❌ Failed to add to: ${mapping.mailketingListName}`, addResult.error)
        }
      } catch (listError: any) {
        result.errors.push(`Error pada list ${mapping.mailketingListName}: ${listError.message}`)
        console.error(`   ❌ Error adding to: ${mapping.mailketingListName}`, listError)
      }
    }

    // Update user's mailketingLists in database
    if (result.listsAdded.length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          mailketingLists: currentLists
        }
      })
      console.log(`📧 Updated user mailketingLists: ${currentLists.length} lists`)
    }

    result.success = result.errors.length === 0

  } catch (error: any) {
    console.error('❌ Error in addUserToRoleLists:', error)
    result.success = false
    result.errors.push(error.message)
  }

  return result
}

/**
 * Remove user from all lists of a specific role
 * Called when: user downgrades, role removed
 */
export async function removeUserFromRoleLists(
  userId: string,
  role: Role
): Promise<AddToListResult> {
  const result: AddToListResult = {
    success: true,
    listsAdded: [], // Actually lists removed
    errors: []
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mailketingLists: true }
    })

    if (!user || !user.email) {
      result.success = false
      result.errors.push('User tidak ditemukan')
      return result
    }

    // Get list mappings for this role
    const mappings = await prisma.roleMailketingList.findMany({
      where: { role }
    })

    const currentLists = (user.mailketingLists as string[]) || []
    const listsToRemove = mappings.map(m => m.mailketingListId)

    for (const mapping of mappings) {
      try {
        if (!currentLists.includes(mapping.mailketingListId)) {
          continue // User not in this list
        }

        const removeResult = await mailketing.removeFromList(user.email, mapping.mailketingListId)
        
        if (removeResult.success) {
          result.listsAdded.push(mapping.mailketingListName)
          console.log(`   ✅ Removed from: ${mapping.mailketingListName}`)
        }
      } catch (error: any) {
        result.errors.push(`Error removing from ${mapping.mailketingListName}: ${error.message}`)
      }
    }

    // Update user's lists
    const updatedLists = currentLists.filter(listId => !listsToRemove.includes(listId))
    await prisma.user.update({
      where: { id: userId },
      data: { mailketingLists: updatedLists }
    })

    result.success = result.errors.length === 0

  } catch (error: any) {
    console.error('❌ Error in removeUserFromRoleLists:', error)
    result.success = false
    result.errors.push(error.message)
  }

  return result
}

/**
 * Get all lists a user is subscribed to
 */
export async function getUserLists(userId: string): Promise<{
  success: boolean
  lists: Array<{ id: string; name: string; role?: string }>
  error?: string
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mailketingLists: true }
    })

    if (!user) {
      return { success: false, lists: [], error: 'User tidak ditemukan' }
    }

    const listIds = (user.mailketingLists as string[]) || []
    
    // Get list names from mappings
    const mappings = await prisma.roleMailketingList.findMany({
      where: {
        mailketingListId: { in: listIds }
      }
    })

    const lists = listIds.map(id => {
      const mapping = mappings.find(m => m.mailketingListId === id)
      return {
        id,
        name: mapping?.mailketingListName || id,
        role: mapping?.role
      }
    })

    return { success: true, lists }

  } catch (error: any) {
    return { success: false, lists: [], error: error.message }
  }
}

/**
 * Handle role change/upgrade - adds to new role lists and optionally removes from old
 * This is the main function to call when user role changes (e.g., from payment webhook)
 */
export async function handleRoleChange(
  userId: string,
  newRole: Role,
  oldRole?: Role,
  options?: {
    removeFromOldRoleLists?: boolean // Default: false
  }
): Promise<AddToListResult> {
  console.log(`🔄 Handling role change for user ${userId}: ${oldRole || 'unknown'} → ${newRole}`)

  // Remove from old role lists if requested
  if (options?.removeFromOldRoleLists && oldRole && oldRole !== newRole) {
    console.log(`   📤 Removing from old role lists: ${oldRole}`)
    await removeUserFromRoleLists(userId, oldRole)
  }

  // Add to new role lists
  console.log(`   📥 Adding to new role lists: ${newRole}`)
  return addUserToRoleLists(userId, newRole, { isUpgrade: true })
}

/**
 * Sync all existing users to their role lists
 * Admin utility function
 */
export async function syncAllUsersToLists(): Promise<{
  success: boolean
  processed: number
  added: number
  errors: number
}> {
  const result = { success: true, processed: 0, added: 0, errors: 0 }

  try {
    // Get all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        role: true
      }
    })

    console.log(`📧 Syncing ${users.length} users to Mailketing lists...`)

    for (const user of users) {
      result.processed++
      const addResult = await addUserToRoleLists(user.id, user.role as Role, { isRegistration: true })
      
      if (addResult.listsAdded.length > 0) {
        result.added += addResult.listsAdded.length
      }
      if (addResult.errors.length > 0) {
        result.errors += addResult.errors.length
      }
    }

    result.success = result.errors === 0
    console.log(`✅ Sync complete: ${result.processed} users, ${result.added} list additions, ${result.errors} errors`)

  } catch (error: any) {
    console.error('❌ Error in syncAllUsersToLists:', error)
    result.success = false
  }

  return result
}
