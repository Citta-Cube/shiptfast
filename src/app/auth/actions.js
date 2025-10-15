'use server'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { reconcilePendingInvitationsForUser } from '@/data-access/companies'

// These actions are no longer needed since Clerk handles auth
// But keeping for any custom logic you might need

export async function getUserInfo() {
  const { userId } = auth()
  return { userId }
}

// Reconcile pending invitations for a user
export async function reconcileUserInvitations(clerkUserId, primaryEmail) {
  try {
    if (!clerkUserId || !primaryEmail) return { updated: 0 }
    
    const result = await reconcilePendingInvitationsForUser(clerkUserId, primaryEmail)
    return result
  } catch (error) {
    console.error('Failed to reconcile pending invitations:', error)
    return { updated: 0, error: error.message }
  }
}

// Redirect functions for after auth
export async function redirectToDashboard() {
  redirect('/dashboard')
}

export async function redirectToHome() {
  redirect('/')
}