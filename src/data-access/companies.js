import { createClient } from '@/lib/supabase/server';

export async function getCompanyById(id) {
  const { data, error } = await createClient()
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createCompany(company) {
  const { data, error } = await createClient()
    .from('companies')
    .insert(company)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserCompanyMembership(userId) {  
  const { data, error } = await createClient()
    .from('company_members')
    .select(`
      id,
      companies:company_id (
        id,
        type
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  
  if (error) throw error;
  return data;
}