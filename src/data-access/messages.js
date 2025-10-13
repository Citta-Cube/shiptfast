import { createClient } from '@/lib/supabase/server';

// Helper function to get company member info from Clerk user ID
async function getCompanyMemberFromClerkId(clerkUserId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('company_members')
    .select('id, company_id')
    .eq('user_id', clerkUserId)
    .eq('is_active', true)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getOrderMessages(orderId) {
  const supabase = createClient();
  
  // Get messages with company and user details
  const { data: messages, error } = await supabase
    .from('order_messages')
    .select(`
      *,
      sender_company:sender_company_id (
        id,
        name,
        type
      ),
      to_company:to_company_id (
        id,
        name,
        type
      ),
      sent_by:sent_by_user_id (
        id,
        user_id,
        first_name,
        last_name
      )
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return messages || [];
}

export async function sendOrderMessage(messageData) {
  const supabase = createClient();
  
  // Get sender's company member info
  const senderMember = await getCompanyMemberFromClerkId(messageData.sender_id);
  if (!senderMember) {
    throw new Error('Could not find sender company member');
  }
  
  // messageData.to_company_id should now contain the target company ID
  if (!messageData.to_company_id) {
    throw new Error('Target company ID is required');
  }
  
  const { data: message, error } = await supabase
    .from('order_messages')
    .insert({
      order_id: messageData.order_id,
      sender_company_id: senderMember.company_id,
      to_company_id: messageData.to_company_id,
      sent_by_user_id: senderMember.id,
      message: messageData.message
    })
    .select(`
      *,
      sender_company:sender_company_id (
        id,
        name,
        type
      ),
      to_company:to_company_id (
        id,
        name,
        type
      ),
      sent_by:sent_by_user_id (
        id,
        user_id,
        first_name,
        last_name
      )
    `)
    .single();
  
  if (error) throw error;
  return message;
}

export async function getOrderForwarders(orderId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('order_selected_forwarders')
    .select(`
      freight_forwarder_id,
      companies:freight_forwarder_id (
        id,
        name,
        type
      )
    `)
    .eq('order_id', orderId);
  
  if (error) throw error;
  return data;
}

export async function getOrderExporter(orderId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      exporter_id,
      companies:exporter_id (
        id,
        name,
        type
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (error) throw error;
  return data;
}

// New function to get messages for a specific company member
// This shows messages where the user's company is involved (either as sender or recipient)
export async function getOrderMessagesForUser(orderId, clerkUserId) {
  const supabase = createClient();
  
  // First get the user's company
  const userMember = await getCompanyMemberFromClerkId(clerkUserId);
  if (!userMember) {
    throw new Error('User company membership not found');
  }
  
  // Get messages where the user's company is either sender or recipient
  const { data: messages, error } = await supabase
    .from('order_messages')
    .select(`
      *,
      sender_company:sender_company_id (
        id,
        name,
        type
      ),
      to_company:to_company_id (
        id,
        name,
        type
      ),
      sent_by:sent_by_user_id (
        id,
        user_id,
        first_name,
        last_name
      )
    `)
    .eq('order_id', orderId)
    .or(`sender_company_id.eq.${userMember.company_id},to_company_id.eq.${userMember.company_id}`)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return messages || [];
}

// Function to get all company members who should see the messages
export async function getCompanyMembers(companyId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('company_members')
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      job_title,
      role
    `)
    .eq('company_id', companyId)
    .eq('is_active', true);
  
  if (error) throw error;
  return data || [];
}