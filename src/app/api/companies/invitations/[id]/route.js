import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invitationId = params.id

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // First, get the invitation to verify permissions
    const { data: invitation, error: invitationError } = await supabase
      .from('company_members')
      .select(`
        id,
        company_id,
        is_active
      `)
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Verify the user has permission to cancel invitations (ADMIN or MANAGER role)
    const { data: membership, error: membershipError } = await supabase
      .from('company_members')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', invitation.company_id)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Company membership not found' }, { status: 404 })
    }

    if (!['ADMIN', 'MANAGER'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to cancel invitations' }, { status: 403 })
    }

    // Only allow cancelling pending invitations (is_active = false)
    if (invitation.is_active) {
      return NextResponse.json({ error: 'Cannot cancel accepted invitation' }, { status: 400 })
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('company_members')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Invitation cancelled successfully' })

  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
