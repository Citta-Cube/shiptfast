import { clerkClient } from '@clerk/nextjs/server'

/**
 * Delete a user from Clerk
 * @param {string} clerkUserId - The Clerk user ID to delete
 * @returns {Promise<Object>} - Result of the deletion operation
 */
export async function deleteClerkUser(clerkUserId) {
  console.log('🗑️ [deleteClerkUser] Starting Clerk user deletion:', {
    clerkUserId,
    timestamp: new Date().toISOString()
  })

  if (!clerkUserId) {
    const error = new Error('Clerk user ID is required')
    console.error('❌ [deleteClerkUser] Error:', error.message)
    throw error
  }

  try {
    console.log('🔗 [deleteClerkUser] Creating Clerk client...')
    const clerk = await clerkClient()
    console.log('✅ [deleteClerkUser] Clerk client created successfully')

    console.log('🔄 [deleteClerkUser] Attempting to delete user from Clerk...')
    const deletedUser = await clerk.users.deleteUser(clerkUserId)
    
    console.log('✅ [deleteClerkUser] Successfully deleted user from Clerk:', {
      deletedUserId: deletedUser.id,
      deletedAt: new Date().toISOString(),
      wasDeleted: deletedUser.deleted
    })

    return {
      success: true,
      deletedUserId: deletedUser.id,
      deletedAt: new Date().toISOString(),
      wasDeleted: deletedUser.deleted
    }

  } catch (error) {
    console.error('❌ [deleteClerkUser] Error deleting user from Clerk:', error)
    console.error('📊 [deleteClerkUser] Error details:', {
      message: error.message,
      status: error.status,
      errors: error.errors,
      clerkUserId
    })

    // Re-throw the error with additional context
    const enhancedError = new Error(`Failed to delete user from Clerk: ${error.message}`)
    enhancedError.originalError = error
    enhancedError.clerkUserId = clerkUserId
    throw enhancedError
  }
}

/**
 * Check if a user exists in Clerk before attempting deletion
 * @param {string} clerkUserId - The Clerk user ID to check
 * @returns {Promise<boolean>} - Whether the user exists
 */
export async function checkClerkUserExists(clerkUserId) {
  console.log('🔍 [checkClerkUserExists] Checking if user exists in Clerk:', {
    clerkUserId,
    timestamp: new Date().toISOString()
  })

  if (!clerkUserId) {
    console.log('⚠️ [checkClerkUserExists] No Clerk user ID provided')
    return false
  }

  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(clerkUserId)
    
    console.log('✅ [checkClerkUserExists] User exists in Clerk:', {
      userId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    })
    
    return true
  } catch (error) {
    if (error.status === 404) {
      console.log('ℹ️ [checkClerkUserExists] User not found in Clerk (404):', clerkUserId)
      return false
    }
    
    console.error('❌ [checkClerkUserExists] Error checking user existence:', error)
    console.error('📊 [checkClerkUserExists] Error details:', {
      message: error.message,
      status: error.status,
      clerkUserId
    })
    
    // If it's not a 404, re-throw the error
    throw error
  }
}
