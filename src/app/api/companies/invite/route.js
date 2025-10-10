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

    // Check if user already exists in the company
    const { data: existingMember, error: existingError } = await supabase
      .from('company_members')
      .select('id, is_active')
      .eq('company_id', companyId)
      .eq('email', email) // Check by email field
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Error checking existing membership' }, { status: 500 })
    }

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this company' }, { status: 400 })
    }

    // Create invitation record in company_members with is_active = false
    const invitation = await createCompanyInvitation(companyId, {
      email: email, // Store email in email field
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
