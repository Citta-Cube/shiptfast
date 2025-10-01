import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Testing Clerk invitation for:', email)
    
    const clerk = await clerkClient()
    
    // Test creating an invitation
    const invitationResponse = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    })

    console.log('Test invitation created successfully:', invitationResponse.id)

    return NextResponse.json({ 
      success: true, 
      message: 'Test invitation sent successfully',
      clerkInvitationId: invitationResponse.id,
      email: email
    })

  } catch (error) {
    console.error('Test invitation error:', error)
    return NextResponse.json({ 
      error: 'Failed to send test invitation',
      details: error.message,
      status: error.status
    }, { status: 500 })
  }
}
