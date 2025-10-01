'use server'

import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs'

// These actions are no longer needed since Clerk handles auth
// But keeping for any custom logic you might need

export async function getUserInfo() {
  const { userId } = auth()
  return { userId }
}

// Redirect functions for after auth
export async function redirectToDashboard() {
  redirect('/dashboard')
}

export async function redirectToHome() {
  redirect('/')
}