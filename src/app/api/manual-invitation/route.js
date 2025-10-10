import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req) {
  try {
    const { email, firstName, lastName } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Manually sending invitation to:', email)
    
    const clerk = await clerkClient()
    
    // Create invitation with minimal metadata
    const invitationResponse = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        firstName: firstName || '',
        lastName: lastName || '',
        manualInvitation: true,
        timestamp: new Date().toISOString()
      }
    })

    console.log('Manual invitation created:', invitationResponse.id)

    // Get the invitation details
    const invitationDetails = await clerk.invitations.getInvitation(invitationResponse.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Manual invitation sent',
      invitationId: invitationResponse.id,
      email: email,
      status: invitationDetails.status,
      createdAt: invitationDetails.createdAt,
      // Include the invitation URL if available
      invitationUrl: invitationDetails.url || 'Check Clerk Dashboard for invitation URL'
    })

  } catch (error) {
    console.error('Manual invitation error:', error)
    return NextResponse.json({ 
      error: 'Failed to send manual invitation',
      details: error.message,
      status: error.status
    }, { status: 500 })
  }
}
