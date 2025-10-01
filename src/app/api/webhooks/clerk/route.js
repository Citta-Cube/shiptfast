import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createClient } from '@/lib/supabase/server'
import { activateCompanyInvitation } from '@/data-access/companies'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req) {
  if (!webhookSecret) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret)

  let evt

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id: clerkUserId, email_addresses, first_name, last_name, public_metadata } = evt.data

    console.log('User created webhook triggered:', {
      clerkUserId,
      email: email_addresses?.[0]?.email_address,
      firstName: first_name,
      lastName: last_name,
      publicMetadata: public_metadata
    })

    try {
      const supabase = createClient()

      // Check if this user was created from an invitation
      if (public_metadata?.companyId && public_metadata?.invitationId) {
        console.log('Processing invitation acceptance:', {
          invitationId: public_metadata.invitationId,
          companyId: public_metadata.companyId,
          clerkUserId
        })

        // Update the existing invitation record with the Clerk user ID and set is_active to true
        try {
          const result = await activateCompanyInvitation(
            public_metadata.invitationId,
            clerkUserId,
            {
              first_name: first_name || public_metadata.firstName,
              last_name: last_name || public_metadata.lastName,
              job_title: public_metadata.jobTitle,
              role: public_metadata.role || 'VIEWER'
            }
          )
          console.log('Successfully activated invitation:', result)
        } catch (updateError) {
          console.error('Error updating invitation record:', updateError)
          console.error('Update error details:', {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details
          })
        }
      } else {
        console.log('User created without invitation metadata, creating basic record')
        // Create a basic company member entry for users not created from invitations
        const { error } = await supabase
          .from('company_members')
          .insert({
            user_id: clerkUserId,
            first_name: first_name,
            last_name: last_name,
            role: 'USER',
            is_active: false, // Set to false until they're assigned to a company
          })

        if (error) {
          console.error('Error creating company member record:', error)
        } else {
          console.log('Created basic company member record for user:', clerkUserId)
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      return new Response('Error processing webhook', { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}