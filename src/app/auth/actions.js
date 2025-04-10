'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/dashboard')
}

export async function signup(formData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const name = formData.get('name')

  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  // Redirect to a confirmation page or login
  redirect('/auth/confirmation')
}

export async function logout() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
  
  redirect('/')
}

export async function forgotPassword(formData) {
  const supabase = createClient()
  
  const email = formData.get('email')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }

  // If successful, return a message
  return { message: 'Password reset email sent. Check your inbox.' }
}