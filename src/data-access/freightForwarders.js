import { supabase } from '@/lib/superbase';

export async function getForwardersByExporter(exporterId) {
  // First, get forwarders with their relationships
  const { data, error } = await supabase
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
      forwarder_services (
        service
      ),
      forwarder_relationships!forwarder_relationships_forwarder_fkey (
        status,
        blacklist_reason,
        created_at,
        updated_at
      )
    `)
    .eq('type', 'FREIGHT_FORWARDER')
    .eq('forwarder_relationships.exporter_id', exporterId)
    .order('name');

  if (error) throw error;

  // Transform the data to get services as an array and relationship as an object
  return data?.map(forwarder => ({
    ...forwarder,
    services: forwarder.forwarder_services?.map(service => service.service) || [],
    relationship: forwarder.forwarder_relationships?.[0] || null,
    forwarder_services: undefined, // Remove the original services array
    forwarder_relationships: undefined // Remove the original relationships array
  }));
}

export async function getForwardersByService(service) {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      freight_forwarders!inner(*)
    `)
    .eq('type', 'FREIGHT_FORWARDER')
    .contains('freight_forwarders.services', [service]);

  if (error) throw error;
  return data;
}

export async function getForwarderById(forwarderId, exporterId) {
  const { data, error } = await supabase
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
      forwarder_services (
        service
      ),
      forwarder_relationships!forwarder_relationships_forwarder_fkey (
        status,
        blacklist_reason,
        created_at,
        updated_at
      )
    `)
    .eq('id', forwarderId)
    .eq('type', 'FREIGHT_FORWARDER')
    .eq('forwarder_relationships.exporter_id', exporterId)
    .single();

  if (error) throw error;

  // Transform the data similar to getForwardersByExporter
  return data ? {
    ...data,
    services: data.forwarder_services?.map(service => service.service) || [],
    relationship: data.forwarder_relationships?.[0] || null,
    forwarder_services: undefined,
    forwarder_relationships: undefined
  } : null;
}

export async function getForwarderDocuments(forwarderId) {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      description,
      file_url,
      uploaded_by,
      metadata,
      created_at,
      updated_at
    `)
    .eq('entity_type', 'COMPANY')
    .eq('entity_id', forwarderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getForwarderMembers(forwarderId) {
  const { data, error } = await supabase
    .from('company_members')
    .select(`
      id,
      job_title,
      role,
      is_active,
      created_at,
      updated_at,
      user:user_profiles (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .eq('company_id', forwarderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}