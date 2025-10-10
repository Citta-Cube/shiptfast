import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { getPendingInvitations } from '@/data-access/companies'

export async function GET(req, { params }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = params.id

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify the user has permission to view invitations (ADMIN or MANAGER role)
    const { data: membership, error: membershipError } = await supabase
      .from('company_members')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Company membership not found' }, { status: 404 })
    }

    if (!['ADMIN', 'MANAGER'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to view invitations' }, { status: 403 })
    }

    // Get pending invitations
    const invitations = await getPendingInvitations(companyId)

    return NextResponse.json({ invitations })

  } catch (error) {
    console.error('Error fetching pending invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
