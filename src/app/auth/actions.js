'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInAction(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !user) {
    // Return error instead of redirecting
    return {
      error: error?.message || "Invalid email or password",
    };
  }

  // Only redirect on successful login
  return redirect('/dashboard')
}

export async function signUpAction(formData) {
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
    return {
      error: error.message
    };
  }

  // Redirect to a confirmation page or login
  return redirect('/auth/confirmation')
}

export async function signOutAction() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return {
      error: error.message
    };
  }
  
  return redirect('/')
}

export async function forgotPasswordAction(formData) {
  const supabase = createClient()
  
  const email = formData.get('email')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  if (error) {
    return {
      error: error.message
    };
  }

  // If successful, return a success message
  return { 
    success: true,
    message: 'Password reset email sent. Check your inbox.' 
  }
}