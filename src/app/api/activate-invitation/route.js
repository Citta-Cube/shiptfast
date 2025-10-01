import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { activateCompanyInvitation } from '@/data-access/companies'

export async function POST(req) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invitationId, userData } = await req.json()

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 })
    }

    console.log('Manually activating invitation:', {
      invitationId,
      clerkUserId: userId,
      userData
    })

    const result = await activateCompanyInvitation(
      invitationId,
      userId,
      userData || {}
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation activated successfully',
      data: result
    })

  } catch (error) {
    console.error('Manual activation error:', error)
    return NextResponse.json({ 
      error: 'Failed to activate invitation',
      details: error.message
    }, { status: 500 })
  }
}
