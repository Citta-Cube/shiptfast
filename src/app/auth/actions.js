'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/superbase/server'

export async function login(formData) {
  const supabase = createClient()
  
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData) {
  const supabase = createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', email)
    .single()

  console.log('existingUser:', existingUser)

  if (existingUser) {
    throw new Error('A user with this email already exists')
  }

  const data = { email, password }
  const { error } = await supabase.auth.signUp(data)

  if (error) {
    throw new Error(error.message)
  }

  // Note: You might want to handle email confirmation here if required

  revalidatePath('/', 'layout')
  redirect('/auth/signin?message=Check your email to confirm your account')
}

export async function logout() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error during logout:', error)
    // You might want to handle this error differently
    throw new Error('Failed to logout')
  }

  revalidatePath('/', 'layout')
  redirect('/auth/signin')
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