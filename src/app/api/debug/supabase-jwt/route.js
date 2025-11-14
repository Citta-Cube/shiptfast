// src/app/api/debug/supabase-jwt/route.js
import { NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req) {
  try {
    const { getToken, userId } = getAuth(req)
    const token = await getToken?.({ template: 'supabase' })
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'No Clerk JWT. Ensure you are signed in and the "supabase" JWT template exists.' },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      }
    )

    // 1) Echo back the server-seen JWT claims from Postgres
    const { data: claimsRows, error: claimsError } = await supabase
      .rpc('http_get_jwt_claims')

    // Fallback if helper function not present: query current_setting directly
    let claims = claimsRows
    if (claimsError) {
      const { data: raw, error: rawErr } = await supabase
        .from('pg_temp').select('*').limit(0) // noop to keep client warm
      // Use a raw SQL fetch via /rest/v1/rpc is not simple; try a small SQL via "rpc" workaround
      // If the helper is missing, instruct the user below.
      claims = null
    }

    // 2) Attempt to read current user row via RLS from company_members
    const { data: meMember, error: meError } = await supabase
      .from('company_members')
      .select('id, user_id, company_id, role, is_active')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      ok: true,
      clerkUserId: userId,
      // If http_get_jwt_claims exists, it will be returned; otherwise null with guidance
      jwtClaims: claims,
      companyMember: meMember,
      errors: {
        claimsError: claimsError?.message || null,
        meError: meError?.message || null,
      },
      guidance: !claims ? 'Optional: create a helper function http_get_jwt_claims() in SQL to return current_setting(\'request.jwt.claims\', true).' : undefined,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}


