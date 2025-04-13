import { createClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
    const { data, error } = await createClient().auth.getUser();
    
    if (error) throw error;
    return data.user;
}