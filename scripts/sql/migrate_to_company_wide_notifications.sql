-- Migration script to convert existing per-user notifications to company-wide notifications
-- This script consolidates duplicate notifications and removes the recipient_id dependency

-- Step 1: Create backup of existing notifications (optional but recommended)
-- CREATE TABLE notifications_backup AS SELECT * FROM notifications;

-- Step 2: Check if old schema exists and migrate if needed
DO $$ 
DECLARE
    has_old_schema BOOLEAN := FALSE;
BEGIN
    -- Check if old columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'recipient_id'
    ) INTO has_old_schema;
    
    IF has_old_schema THEN
        -- Create temporary table for consolidated notifications (old schema exists)
        CREATE TEMP TABLE notifications_consolidated AS
        WITH grouped_notifications AS (
          -- Group notifications by company, type, order, quote, message and created time (within 5 minutes)
          SELECT 
            recipient_company_id,
            type,
            title,
            message,
            order_id,
            quote_id,
            message_id,
            sender_company_id,
            data,
            -- Take the earliest created_at for each group
            MIN(created_at) as created_at,
            MIN(updated_at) as updated_at,
            -- Collect all users who had this notification
            array_agg(DISTINCT recipient_id) as all_recipients,
            -- Collect users who read it
            array_agg(DISTINCT CASE WHEN is_read THEN recipient_id END) FILTER (WHERE is_read) as read_recipients,
            -- Count how many read it
            COUNT(CASE WHEN is_read THEN 1 END) as read_count,
            -- Group notifications created within 5 minutes of each other
            date_trunc('minute', created_at) + 
            INTERVAL '5 minutes' * FLOOR(EXTRACT(epoch FROM created_at - date_trunc('hour', created_at))/300) as time_group
          FROM notifications
          GROUP BY 
            recipient_company_id, 
            type, 
            title, 
            message, 
            order_id, 
            quote_id, 
            message_id, 
            sender_company_id, 
            data,
            time_group
        )
        SELECT 
          gen_random_uuid() as id,
          recipient_company_id,
          type,
          title,
          message,
          order_id,
          quote_id,
          message_id,
          sender_company_id,
          data,
          COALESCE(read_recipients, '{}') as read_by,
          COALESCE(read_count, 0) as read_count,
          created_at,
          updated_at
        FROM grouped_notifications;

        -- Clear existing notifications table
        TRUNCATE TABLE notifications;

        -- Insert consolidated notifications
        INSERT INTO notifications (
          id,
          recipient_company_id,
          type,
          title,
          message,
          order_id,
          quote_id,
          message_id,
          sender_company_id,
          data,
          read_by,
          read_count,
          created_at,
          updated_at
        )
        SELECT 
          id,
          recipient_company_id,
          type,
          title,
          message,
          order_id,
          quote_id,
          message_id,
          sender_company_id,
          data,
          read_by,
          read_count,
          created_at,
          updated_at
        FROM notifications_consolidated;
        
        -- Clean up temporary table
        DROP TABLE notifications_consolidated;
        
        RAISE NOTICE 'Migrated existing notifications from old schema to company-wide format';
    ELSE
        RAISE NOTICE 'Table already uses company-wide schema, skipping data migration';
    END IF;
END $$;

-- Step 5: Update the notifications table structure if not already done
-- Remove old columns if they still exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' AND column_name = 'recipient_id') THEN
    ALTER TABLE notifications DROP COLUMN recipient_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    ALTER TABLE notifications DROP COLUMN is_read;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
    ALTER TABLE notifications DROP COLUMN read_at;
  END IF;
END $$;

-- Step 6: Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'read_by') THEN
    ALTER TABLE notifications ADD COLUMN read_by TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'read_count') THEN
    ALTER TABLE notifications ADD COLUMN read_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Step 7: Update indexes for the new structure
DROP INDEX IF EXISTS idx_notifications_recipient_unread;
DROP INDEX IF EXISTS idx_notifications_recipient_company;
DROP INDEX IF EXISTS idx_notifications_read_by;

-- Create new indexes optimized for company-wide notifications
CREATE INDEX IF NOT EXISTS idx_notifications_company_created 
ON notifications (recipient_company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_company_type 
ON notifications (recipient_company_id, type);

CREATE INDEX IF NOT EXISTS idx_notifications_read_by 
ON notifications USING GIN (read_by);

-- Create index for unread notifications per company
CREATE INDEX IF NOT EXISTS idx_notifications_company_unread 
ON notifications (recipient_company_id, created_at DESC) 
WHERE read_count = 0;

-- Step 8: Update RLS policies for company-wide access
DROP POLICY IF EXISTS "Users can view their company notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their company notifications" ON notifications;

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create updated RLS policies
CREATE POLICY "Users can view their company notifications" ON notifications
    FOR SELECT USING (
        recipient_company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = (SELECT auth.jwt() ->> 'sub')
        )
    );

CREATE POLICY "Users can update their company notifications" ON notifications
    FOR UPDATE USING (
        recipient_company_id IN (
            SELECT company_id FROM company_members 
            WHERE user_id = (SELECT auth.jwt() ->> 'sub')
        )
    );

-- Add the missing SQL functions from notifications_company_wide.sql

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS user_has_read_notification(UUID, TEXT);
DROP FUNCTION IF EXISTS mark_notification_read_by_user(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_unread_notifications(TEXT, UUID);
DROP FUNCTION IF EXISTS get_user_company_notifications(TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_company_notifications(TEXT, UUID);

-- Function to check if a user has read a notification
CREATE OR REPLACE FUNCTION user_has_read_notification(notification_id UUID, user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    read_by_array TEXT[];
BEGIN
    SELECT read_by INTO read_by_array
    FROM notifications
    WHERE id = notification_id;
    
    RETURN user_id = ANY(read_by_array);
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read by a specific user
CREATE OR REPLACE FUNCTION mark_notification_read_by_user(notification_id UUID, user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_read_by TEXT[];
    new_read_count INTEGER;
BEGIN
    -- Get current read_by array
    SELECT read_by INTO current_read_by
    FROM notifications
    WHERE id = notification_id;
    
    -- Check if user already read this notification
    IF user_id = ANY(current_read_by) THEN
        RETURN FALSE; -- Already read
    END IF;
    
    -- Add user to read_by array and increment count
    UPDATE notifications 
    SET 
        read_by = array_append(read_by, user_id),
        read_count = read_count + 1,
        updated_at = NOW()
    WHERE id = notification_id;
    
    RETURN TRUE; -- Successfully marked as read
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notifications for a user in their company
CREATE OR REPLACE FUNCTION get_user_unread_notifications(user_id TEXT, company_id UUID)
RETURNS TABLE (
    id UUID,
    type notification_type,
    title TEXT,
    message TEXT,
    order_id UUID,
    quote_id UUID,
    message_id UUID,
    sender_company_id UUID,
    data JSONB,
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
        n.data,
        n.created_at,
        n.updated_at
    FROM notifications n
    WHERE 
        n.recipient_company_id = company_id
        AND NOT (user_id = ANY(n.read_by))
    ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all notifications for a user in their company (read and unread)
CREATE OR REPLACE FUNCTION get_user_company_notifications(user_id TEXT, company_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    type notification_type,
    title TEXT,
    message TEXT,
    order_id UUID,
    quote_id UUID,
    message_id UUID,
    sender_company_id UUID,
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
        n.data,
        (user_id = ANY(n.read_by)) as is_read_by_user,
        n.read_count,
        n.created_at,
        n.updated_at
    FROM notifications n
    WHERE n.recipient_company_id = company_id
    ORDER BY n.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions for the new functions
GRANT EXECUTE ON FUNCTION user_has_read_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read_by_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_unread_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_notifications TO authenticated;

-- Compatibility: no-op email notification function to satisfy existing triggers
-- Some legacy triggers may call send_email_notification(text, uuid, uuid)
-- Define a safe no-op to prevent runtime errors during order creation
CREATE OR REPLACE FUNCTION send_email_notification(event_type TEXT, target_id UUID, company_id UUID)
RETURNS VOID AS $$
BEGIN
  -- No-op: logging for observability; integrate real email provider later if needed
  RAISE NOTICE 'send_email_notification: type=%, target_id=%, company_id=%', event_type, target_id, company_id;
END;
$$ LANGUAGE plpgsql;

-- Verification queries
-- Check the consolidated notifications
SELECT 
  'Consolidated notifications count' as metric,
  COUNT(*) as value
FROM notifications;

SELECT 
  'Average read count per notification' as metric,
  ROUND(AVG(read_count), 2) as value
FROM notifications;

SELECT 
  'Notifications by type' as metric,
  type,
  COUNT(*) as count
FROM notifications
GROUP BY type
ORDER BY count DESC;

-- Check for any orphaned notifications (companies that don't exist)
SELECT 
  'Orphaned notifications' as metric,
  COUNT(*) as value
FROM notifications n
LEFT JOIN companies c ON n.recipient_company_id = c.id
WHERE c.id IS NULL;

ANALYZE notifications;

-- Migration completed successfully
SELECT 'Migration completed successfully! Notifications are now company-wide.' as status;