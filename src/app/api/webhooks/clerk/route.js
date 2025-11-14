import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createClient } from '@/lib/supabase/server'
import { activateCompanyInvitation } from '@/data-access/companies'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

// Svix requires Node.js runtime
export const runtime = 'nodejs'

export async function POST(req) {
  if (!webhookSecret) {
    console.error('❌ CLERK_WEBHOOK_SECRET not found in environment variables')
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Read headers directly from the request to ensure we get the original values
  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ Missing required svix headers')
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Read the raw body for signature verification
  const body = await req.text()

  

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
    console.error('❌ Error verifying webhook signature:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  

  if (eventType === 'user.created') {
    const { id: clerkUserId, email_addresses, first_name, last_name, public_metadata } = evt.data

    

    try {
      console.log('🔗 Creating Supabase client...')
      const supabase = createClient()
      console.log('✅ Supabase client created successfully')

      // Check if this user was created from an invitation
      if (public_metadata?.companyId && public_metadata?.invitationId) {
        console.log('📧 Processing invitation acceptance:', {
          invitationId: public_metadata.invitationId,
          companyId: public_metadata.companyId,
          clerkUserId,
          userData: {
            first_name: first_name || public_metadata.firstName,
            last_name: last_name || public_metadata.lastName,
            job_title: public_metadata.jobTitle,
            role: public_metadata.role || 'VIEWER'
          }
        })

        // Update the existing invitation record with the Clerk user ID and set is_active to true
        try {
          console.log('🔄 Calling activateCompanyInvitation...')
          const result = await activateCompanyInvitation(
            public_metadata.invitationId,
            clerkUserId,
            {
              first_name: first_name || public_metadata.firstName,
              last_name: last_name || public_metadata.lastName,
              job_title: public_metadata.jobTitle,
              role: public_metadata.role || 'VIEWER'
            },
            true
          )
          console.log('✅ Successfully activated invitation in Supabase:', {
            invitationId: result.id,
            userId: result.user_id,
            isActive: result.is_active,
            role: result.role,
            companyId: result.company_id
          })
        } catch (updateError) {
          console.error('❌ Error updating invitation record:', updateError)
          console.error('📊 Update error details:', {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint
          })
          throw updateError // Re-throw to be caught by outer try-catch
        }
      } else {
        console.log('👤 User created without invitation metadata, creating basic record')
        console.log('📝 User data to insert:', {
          user_id: clerkUserId,
          first_name: first_name,
          last_name: last_name,
          role: 'USER',
          is_active: false
        })
        
        // Create a basic company member entry for users not created from invitations
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminSupabase = createAdminClient()

        const { data: insertData, error } = await adminSupabase
          .from('company_members')
          .insert({
            user_id: clerkUserId,
            first_name: first_name,
            last_name: last_name,
            role: 'USER',
            is_active: false, // Set to false until they're assigned to a company
          })
          .select()

        if (error) {
          console.error('❌ Error creating company member record:', error)
          console.error('📊 Insert error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          throw error // Re-throw to be caught by outer try-catch
        } else {
          console.log('✅ Created basic company member record in Supabase:', {
            recordId: insertData?.[0]?.id,
            userId: insertData?.[0]?.user_id,
            isActive: insertData?.[0]?.is_active,
            role: insertData?.[0]?.role
          })
        }
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error)
      console.error('📊 Full error object:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      })
      return new Response('Error processing webhook', { status: 500 })
    }
  } else {
    console.log('ℹ️ Unhandled webhook event type:', eventType)
  }

  console.log('✅ Webhook processing completed successfully at:', new Date().toISOString())
  return NextResponse.json({ received: true })
}