import { supabase } from '@/lib/superbase';

export async function getQuoteById(id) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, orders(*), companies(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createQuote(quote) {
  const { data, error } = await supabase
    .from('quotes')
    .insert(quote)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getQuotesByOrder(orderId) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, companies(*)')
    .eq('order_id', orderId);
  
  if (error) throw error;
  return data;
}