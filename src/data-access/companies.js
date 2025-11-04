import { createClient } from '@/lib/supabase/server'

export async function getCompanyById(id) {
  const { data, error } = await createClient()
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createCompany(company) {
  const { data, error } = await createClient()
    .from('companies')
    .insert(company)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getUserCompanyMembership(clerkUserId) {  
  // const supabase = createClient();
  // const { data, error } = await supabase.rpc('debug_jwt');
  // console.log('JWT payload from DB:', data);

  const { data, error } = await createClient()
    .from('company_members')
    .select(`
      id,
      first_name,
      last_name,
      job_title,
      role,
      companies:company_id (
        id,
        name,
        type,
        website,
        email,
        phone,
        address,
        description,
        business_registration_number,
        vat_number,
        created_at,
        is_verified,
        average_rating,
        total_ratings
      )
    `)
    .eq('user_id', clerkUserId)
    .eq('is_active', true)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createUserCompanyMembership(clerkUserId, companyId, membershipData) {
  const { data, error } = await createClient()
    .from('company_members')
    .insert({
      user_id: clerkUserId,
      company_id: companyId,
      ...membershipData
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateUserCompanyMembership(clerkUserId, updateData) {
  const { data, error } = await createClient()
    .from('company_members')
    .update(updateData)
    .eq('user_id', clerkUserId)
    .eq('is_active', true)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getCompanyMembers(companyId, excludeUserId = null) {
  let query = createClient()
    .from('company_members')
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
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('role', { ascending: false })
    .order('created_at', { ascending: true })

  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Reconcile any pending invitations that match the current Clerk user email.
// This ensures that if the webhook didn't run, we still promote the pending
// invitation row (stored with email as user_id) to the real Clerk user id and
// set is_active = true.
export async function reconcilePendingInvitationsForUser(clerkUserId, primaryEmail) {
  if (!clerkUserId || !primaryEmail) return { updated: 0 }

  const supabase = createClient()

  // Find any pending invitations where we temporarily stored email in user_id
  const { data: pending, error: findError } = await supabase
    .from('company_members')
    .select('id')
    .eq('user_id', primaryEmail)
    .eq('is_active', false)

  if (findError) {
    throw findError
  }

  if (!pending || pending.length === 0) return { updated: 0 }

  const ids = pending.map(p => p.id)

  const { data, error } = await supabase
    .from('company_members')
    .update({ user_id: clerkUserId, is_active: true })
    .in('id', ids)
    .select('id')

  if (error) throw error

  return { updated: data?.length || 0 }
}

export async function createCompanyInvitation(companyId, invitationData) {
  const { data, error } = await createClient()
    .from('company_members')
    .insert({
      company_id: companyId,
      ...invitationData,
      is_active: false // Invitations start as inactive
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function activateCompanyInvitation(invitationId, clerkUserId, userData) {
  console.log('🔄 [activateCompanyInvitation] Starting invitation activation:', {
    invitationId,
    clerkUserId,
    userData,
    timestamp: new Date().toISOString()
  })

  console.log('🔗 [activateCompanyInvitation] Creating Supabase client...')
  const supabase = createClient()
  console.log('✅ [activateCompanyInvitation] Supabase client created')

  console.log('📝 [activateCompanyInvitation] Update data to be sent:', {
    user_id: clerkUserId,
    is_active: true,
    ...userData
  })

  const { data, error } = await supabase
    .from('company_members')
    .update({
      user_id: clerkUserId,
      is_active: true,
      ...userData
    })
    .eq('id', invitationId)
    .select()
    .single()
  
  if (error) {
    console.error('❌ [activateCompanyInvitation] Error activating invitation:', error)
    console.error('📊 [activateCompanyInvitation] Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      invitationId,
      clerkUserId
    })
    throw error
  }
  
  console.log('✅ [activateCompanyInvitation] Successfully activated invitation in Supabase:', {
    recordId: data.id,
    userId: data.user_id,
    isActive: data.is_active,
    role: data.role,
    companyId: data.company_id,
    firstName: data.first_name,
    lastName: data.last_name,
    jobTitle: data.job_title,
    updatedAt: data.updated_at
  })
  
  return data
}

export async function getPendingInvitations(companyId) {
  const { data, error } = await createClient()
    .from('company_members')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      job_title,
      role,
      created_at
    `)
    .eq('company_id', companyId)
    .eq('is_active', false)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function updateCompanyMember(memberId, updateData) {
  const { data, error } = await createClient()
    .from('company_members')
    .update(updateData)
    .eq('id', memberId)
    .eq('is_active', true)
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
  
  if (error) throw error
  return data
}

export async function deleteCompanyMember(memberId) {
  // First get the member data before deletion
  const { data: memberData, error: fetchError } = await createClient()
    .from('company_members')
    .select('id, first_name, last_name')
    .eq('id', memberId)
    .single()
  
  if (fetchError) throw fetchError
  
  // Then permanently delete the record
  const { error: deleteError } = await createClient()
    .from('company_members')
    .delete()
    .eq('id', memberId)
  
  if (deleteError) throw deleteError
  return memberData
}

export async function getExportersByForwarder(forwarderId) {
  const { data, error } = await createClient()
    .from('companies')
    .select(`
      id,
      name,
      iconurl,
      email,
      phone,
      website,
      address,
      description,
      is_verified,
      average_rating,
      total_ratings,
      total_orders,
      forwarder_relationships!forwarder_relationships_exporter_fkey (
        status,
        blacklist_reason,
        created_at,
        updated_at
      )
    `)
    .eq('type', 'EXPORTER')
    .eq('forwarder_relationships.forwarder_id', forwarderId)
    .order('name');

  if (error) throw error;

  // Transform the data to get relationship as an object
  return data?.map(exporter => ({
    ...exporter,
    relationship: exporter.forwarder_relationships?.[0] || null,
    forwarder_relationships: undefined // Remove the original relationships array
  }));
}

/**
 * Check if a rating exists for a specific order and forwarder
 * @param {string} orderId - The order ID
 * @param {string} raterCompanyId - The company ID of the rater
 * @returns {Promise<Object|null>} - Existing rating or null
 */
export async function getExistingRating(orderId, raterCompanyId) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('company_ratings')
      .select('*')
      .eq('order_id', orderId)
      .eq('rater_company_id', raterCompanyId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error checking existing rating:', error);
    throw error;
  }
}

/**
 * Get all ratings received by a company
 * @param {string} companyId - The company ID to get ratings for
 * @returns {Promise<Array>} - Array of ratings
 */
export async function getCompanyRatings(companyId) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('company_ratings')
      .select(`
        *,
        rater_company:rater_company_id (
          id,
          name,
          type
        )
      `)
      .eq('ratee_company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching company ratings:', error);
    throw error;
  }
}