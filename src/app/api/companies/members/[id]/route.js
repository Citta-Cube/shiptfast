import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req, { params }) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberId = params.id
    const updateData = await req.json()

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get the member to update and verify permissions
    const { data: memberToUpdate, error: memberError } = await supabase
      .from('company_members')
      .select('company_id, user_id, role')
      .eq('id', memberId)
      .eq('is_active', true)
      .single()

    if (memberError || !memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verify the current user has permission to edit members (ADMIN role only)
    const { data: currentMembership, error: membershipError } = await supabase
      .from('company_members')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', memberToUpdate.company_id)
      .eq('is_active', true)
      .single()

    if (membershipError || !currentMembership) {
      return NextResponse.json({ error: 'Company membership not found' }, { status: 404 })
    }

    if (currentMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can edit team members' }, { status: 403 })
    }

    // Prevent editing own record
    if (memberToUpdate.user_id === userId) {
      return NextResponse.json({ error: 'Cannot edit your own record' }, { status: 403 })
    }

    // Remove email from updateData if present (not allowed to edit)
    const { email, user_id, ...allowedUpdates } = updateData

    // Update the member
    const { data: updatedMember, error: updateError } = await supabase
      .from('company_members')
      .update(allowedUpdates)
      .eq('id', memberId)
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        job_title,
        role,
        created_at,
        is_active
      `)
      .single()

    if (updateError) {
      console.error('Error updating member:', updateError)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    return NextResponse.json({ member: updatedMember })

  } catch (error) {
    console.error('Error in PATCH /api/companies/members/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberId = params.id

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get the member to delete and verify permissions
    const { data: memberToDelete, error: memberError } = await supabase
      .from('company_members')
      .select('company_id, user_id, role, first_name, last_name')
      .eq('id', memberId)
      .eq('is_active', true)
      .single()

    if (memberError || !memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verify the current user has permission to delete members (ADMIN role only)
    const { data: currentMembership, error: membershipError } = await supabase
      .from('company_members')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', memberToDelete.company_id)
      .eq('is_active', true)
      .single()

    if (membershipError || !currentMembership) {
      return NextResponse.json({ error: 'Company membership not found' }, { status: 404 })
    }

    if (currentMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete team members' }, { status: 403 })
    }

    // Prevent deleting own record
    if (memberToDelete.user_id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own record' }, { status: 403 })
    }

    // Hard delete the member record from database
    const { error: deleteError } = await supabase
      .from('company_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error deleting member:', deleteError)
      return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Member deleted successfully',
      deletedMember: {
        id: memberId,
        name: `${memberToDelete.first_name} ${memberToDelete.last_name}`
      }
    })

  } catch (error) {
    console.error('Error in DELETE /api/companies/members/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
