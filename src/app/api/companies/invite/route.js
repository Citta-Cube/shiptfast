import { NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { createCompanyInvitation } from '@/data-access/companies'

export async function POST(req) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId, email, firstName, lastName, jobTitle, role } = await req.json()

    if (!companyId || !email) {
      return NextResponse.json({ error: 'Company ID and email are required' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify the user has permission to invite members (ADMIN or MANAGER role)
    const { data: membership, error: membershipError } = await supabase
      .from('company_members')
      .select('role, companies:company_id(id, name)')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Company membership not found' }, { status: 404 })
    }

    if (!['ADMIN', 'MANAGER'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to invite members' }, { status: 403 })
    }

    // First, see if this email already belongs to an existing Clerk user
    let targetClerkUser = null
    try {
      const clerk = await clerkClient()
      // getUserList with email filter; if SDK differs, this will throw and we fall back to invitation flow
      const usersRes = await clerk.users.getUserList({ emailAddress: [email] })
      const usersArr = Array.isArray(usersRes?.data) ? usersRes.data : Array.isArray(usersRes) ? usersRes : []
      targetClerkUser = usersArr[0] || null
    } catch (e) {
      // Non-fatal: if lookup fails, we proceed with invitation flow
      console.warn('Clerk user lookup failed, proceeding with invite flow:', e?.message || e)
    }

    // If the email maps to an existing Clerk user, handle membership directly to avoid duplicate insertions
    if (targetClerkUser?.id) {
      // Check if that user is already a member of this company
      const { data: existingByUser, error: existingByUserError } = await supabase
        .from('company_members')
        .select('id, is_active')
        .eq('company_id', companyId)
        .eq('user_id', targetClerkUser.id)
        .single()

      if (existingByUserError && existingByUserError.code !== 'PGRST116') {
        console.error('Error checking existing membership by user_id:', existingByUserError)
        return NextResponse.json({ error: 'Error checking existing membership' }, { status: 500 })
      }

      if (existingByUser && existingByUser.is_active) {
        return NextResponse.json({ error: 'User is already a member of this company' }, { status: 409 })
      }

      if (existingByUser && !existingByUser.is_active) {
        // There is an inactive row for the same user_id; promote it to active and update details
        const { error: activateError } = await supabase
          .from('company_members')
          .update({
            is_active: true,
            first_name: firstName || targetClerkUser.firstName || null,
            last_name: lastName || targetClerkUser.lastName || null,
            job_title: jobTitle || null,
            role: role || 'VIEWER'
          })
          .eq('id', existingByUser.id)

        if (activateError) {
          console.error('Error activating existing inactive membership:', activateError)
          return NextResponse.json({ error: 'Failed to activate existing membership' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Existing invitation activated. User is now a member.' })
      }

      // No existing row — add the user directly as an active member (no email invitation needed)
      const { data: inserted, error: insertMemberError } = await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: targetClerkUser.id,
          first_name: firstName || targetClerkUser.firstName || null,
          last_name: lastName || targetClerkUser.lastName || null,
          job_title: jobTitle || null,
          role: role || 'VIEWER',
          is_active: true
        })
        .select()
        .single()

      if (insertMemberError) {
        // Handle race-condition duplicate gracefully
        if (insertMemberError.code === '23505') {
          return NextResponse.json({ error: 'User is already a member of this company' }, { status: 409 })
        }
        console.error('Error adding existing Clerk user as member:', insertMemberError)
        return NextResponse.json({ error: 'Failed to add user as member' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'User added as a company member', memberId: inserted.id })
    }

    // If no Clerk user exists for this email, prevent duplicate pending invitations by email (if such a column exists)
    try {
      const { data: existingInvite, error: existingInviteError } = await supabase
        .from('company_members')
        .select('id, is_active')
        .eq('company_id', companyId)
        .eq('email', email)
        .single()

      if (existingInvite && !existingInvite.is_active) {
        return NextResponse.json({ error: 'This email has already been invited to the company' }, { status: 409 })
      }

      if (existingInvite && existingInvite.is_active) {
        return NextResponse.json({ error: 'User is already a member of this company' }, { status: 409 })
      }

      if (existingInviteError && existingInviteError.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Error checking existing invitations' }, { status: 500 })
      }
    } catch (e) {
      // If the table doesn't have an email column, skip this check
      console.warn('Skipping duplicate-invite-by-email check (email column may not exist):', e?.message || e)
    }

    // Create invitation record in company_members with is_active = false
    const invitation = await createCompanyInvitation(companyId, {
      // Store email both in a dedicated column (if exists) and in user_id for pending invites
      user_id: email,
      email: email,
      first_name: firstName || null,
      last_name: lastName || null,
      job_title: jobTitle || null,
      role: role || 'VIEWER'
    })

    // Send invitation via Clerk
    try {
      const clerk = await clerkClient()
      console.log('Creating Clerk invitation for:', email)
      
      const invitationResponse = await clerk.invitations.createInvitation({
        emailAddress: email,
        publicMetadata: {
          companyId: companyId,
          companyName: membership.companies.name,
          role: role || 'VIEWER',
          jobTitle: jobTitle || null,
          firstName: firstName || null,
          lastName: lastName || null,
          invitationId: invitation.id
        }
      })

      console.log('Clerk invitation created successfully:', invitationResponse.id)

      return NextResponse.json({ 
        success: true, 
        message: 'Invitation sent successfully',
        invitationId: invitation.id,
        clerkInvitationId: invitationResponse.id
      })
    } catch (clerkError) {
      console.error('Clerk invitation error:', clerkError)
      console.error('Error details:', {
        message: clerkError.message,
        status: clerkError.status,
        errors: clerkError.errors
      })
      
      // Clean up the invitation record if Clerk fails
      await supabase
        .from('company_members')
        .delete()
        .eq('id', invitation.id)

      return NextResponse.json({ 
        error: 'Failed to send invitation via email service',
        details: clerkError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Invitation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
