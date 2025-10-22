import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create the enhanced notifications function
    const supabase = createClient();
    
    const enhancedFunctionSQL = `
    CREATE OR REPLACE FUNCTION get_user_company_notifications_enhanced(user_id TEXT, company_id UUID, limit_count INTEGER DEFAULT 50)
    RETURNS TABLE (
        id UUID,
        type notification_type,
        title TEXT,
        message TEXT,
        order_id UUID,
        quote_id UUID,
        message_id UUID,
        sender_company_id UUID,
        sender_company_name TEXT,
        order_reference_number TEXT,
        data JSONB,
        is_read_by_user BOOLEAN,
        read_count INTEGER,
        created_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            n.id,
            n.type,
            n.title,
            n.message,
            n.order_id,
            n.quote_id,
            n.message_id,
            n.sender_company_id,
            sc.name as sender_company_name,
            o.reference_number as order_reference_number,
            n.data,
            (user_id = ANY(n.read_by)) as is_read_by_user,
            n.read_count,
            n.created_at,
            n.updated_at
        FROM notifications n
        LEFT JOIN companies sc ON n.sender_company_id = sc.id
        LEFT JOIN orders o ON n.order_id = o.id
        WHERE n.recipient_company_id = company_id
        ORDER BY n.created_at DESC
        LIMIT limit_count;
    END;
    $$ LANGUAGE plpgsql;
    
    GRANT EXECUTE ON FUNCTION get_user_company_notifications_enhanced TO authenticated;
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql: enhancedFunctionSQL });
    
    if (error) {
      console.error('Error creating enhanced function:', error);
      return NextResponse.json({ 
        error: 'Failed to create enhanced function', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Enhanced notifications function created successfully' 
    });
    
  } catch (error) {
    console.error('Error in setup enhanced notifications:', error);
    return NextResponse.json(
      { error: 'Failed to setup enhanced notifications' },
      { status: 500 }
    );
  }
}