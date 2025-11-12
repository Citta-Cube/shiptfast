-- Company-wide Notifications System SQL Setup for ShipTfast
-- This replaces the per-user notification system to avoid duplicates
-- Each notification is created once per company, users individually mark as read

-- Create notification type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'ORDER_CREATED',
        'ORDER_DUE_7_DAYS',
        'ORDER_DUE_24_HOURS',
        'ORDER_CLOSED',
        'ORDER_CANCELLED',
        'ORDER_VOIDED',
        'ORDER_REASSIGNED',
        'NEW_MESSAGE_EXPORTER',
        'NEW_MESSAGE_FORWARDER',
        'QUOTE_RECEIVED',
        'QUOTE_SELECTED',
        'QUOTE_CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS create_order_notification CASCADE;
DROP FUNCTION IF EXISTS create_message_notification CASCADE;
DROP FUNCTION IF EXISTS create_quote_notification CASCADE;
DROP FUNCTION IF EXISTS check_deadline_notifications CASCADE;

-- Create function to automatically create company-wide notifications for order events
CREATE OR REPLACE FUNCTION create_order_notification(
    p_order_id UUID,
    p_notification_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_sender_company_id UUID DEFAULT NULL,
    p_additional_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
    v_recipient_company_id UUID;
    notification_exists BOOLEAN;
BEGIN
    -- Get order details
    SELECT o.*, e.name as exporter_name, e.id as exporter_id
    INTO order_record
    FROM orders o
    JOIN companies e ON o.exporter_id = e.id
    WHERE o.id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;
    
    -- Determine recipient companies based on notification type
    IF p_notification_type IN ('ORDER_CREATED', 'ORDER_DUE_7_DAYS', 'ORDER_DUE_24_HOURS', 'ORDER_CANCELLED', 'ORDER_VOIDED') THEN
        -- Notify all selected freight forwarder companies (one notification per company)
        FOR v_recipient_company_id IN 
            SELECT DISTINCT osf.freight_forwarder_id
            FROM order_selected_forwarders osf
            WHERE osf.order_id = p_order_id
        LOOP
            -- Check if notification already exists for this company and order
            SELECT EXISTS(
                SELECT 1 FROM notifications n
                WHERE n.recipient_company_id = v_recipient_company_id
                AND n.order_id = p_order_id 
                AND n.type = p_notification_type
                AND n.created_at > NOW() - INTERVAL '1 minute'
            ) INTO notification_exists;
            
            IF NOT notification_exists THEN
                INSERT INTO notifications (
                    recipient_company_id, 
                    type, 
                    title, 
                    message, 
                    order_id,
                    sender_company_id,
                    data,
                    read_by,
                    read_count,
                    created_at,
                    updated_at
                ) VALUES (
                    v_recipient_company_id,
                    p_notification_type,
                    p_title,
                    p_message,
                    p_order_id,
                    p_sender_company_id,
                    p_additional_data,
                    '{}',
                    0,
                    NOW(),
                    NOW()
                );
            END IF;
        END LOOP;
        
    ELSIF p_notification_type IN ('ORDER_CLOSED', 'QUOTE_RECEIVED', 'QUOTE_CANCELLED') THEN
        -- Notify exporter company (one notification per company)
        v_recipient_company_id := order_record.exporter_id;
        
        -- Check if notification already exists
        SELECT EXISTS(
            SELECT 1 FROM notifications n
            WHERE n.recipient_company_id = v_recipient_company_id
            AND n.order_id = p_order_id 
            AND n.type = p_notification_type
            AND n.created_at > NOW() - INTERVAL '1 minute'
        ) INTO notification_exists;
        
        IF NOT notification_exists THEN
            INSERT INTO notifications (
                recipient_company_id, 
                type, 
                title, 
                message, 
                order_id,
                sender_company_id,
                data,
                read_by,
                read_count,
                created_at,
                updated_at
            ) VALUES (
                v_recipient_company_id,
                p_notification_type,
                p_title,
                p_message,
                p_order_id,
                p_sender_company_id,
                p_additional_data,
                '{}',
                0,
                NOW(),
                NOW()
            );
        END IF;
        
    ELSIF p_notification_type = 'QUOTE_SELECTED' THEN
        -- Notify the selected freight forwarder company
        SELECT DISTINCT q.freight_forwarder_id INTO v_recipient_company_id
        FROM quotes q
        JOIN orders o ON o.selected_quote_id = q.id
        WHERE o.id = p_order_id;
        
        IF v_recipient_company_id IS NOT NULL THEN
            -- Check if notification already exists
            SELECT EXISTS(
                SELECT 1 FROM notifications n
                WHERE n.recipient_company_id = v_recipient_company_id
                AND n.order_id = p_order_id 
                AND n.type = p_notification_type
                AND n.created_at > NOW() - INTERVAL '1 minute'
            ) INTO notification_exists;
            
            IF NOT notification_exists THEN
                INSERT INTO notifications (
                    recipient_company_id, 
                    type, 
                    title, 
                    message, 
                    order_id,
                    sender_company_id,
                    data,
                    read_by,
                    read_count,
                    created_at,
                    updated_at
                ) VALUES (
                    v_recipient_company_id,
                    p_notification_type,
                    p_title,
                    p_message,
                    p_order_id,
                    p_sender_company_id,
                    p_additional_data,
                    '{}',
                    0,
                    NOW(),
                    NOW()
                );
            END IF;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create company-wide message notifications
CREATE OR REPLACE FUNCTION create_message_notification(
    p_message_id UUID,
    p_order_id UUID,
    p_notification_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_sender_company_id UUID,
    p_additional_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
    v_recipient_company_id UUID;
    notification_exists BOOLEAN;
BEGIN
    -- Get order details
    SELECT o.*, e.id as exporter_id
    INTO order_record
    FROM orders o
    JOIN companies e ON o.exporter_id = e.id
    WHERE o.id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;
    
    -- Determine recipient companies based on message type
    IF p_notification_type = 'NEW_MESSAGE_EXPORTER' THEN
        -- Notify exporter company
        v_recipient_company_id := order_record.exporter_id;
    ELSIF p_notification_type = 'NEW_MESSAGE_FORWARDER' THEN
        -- Notify freight forwarder companies that are selected for this order
        FOR v_recipient_company_id IN 
            SELECT DISTINCT osf.freight_forwarder_id
            FROM order_selected_forwarders osf
            WHERE osf.order_id = p_order_id
        LOOP
            -- Check if notification already exists
            SELECT EXISTS(
                SELECT 1 FROM notifications n
                WHERE n.recipient_company_id = v_recipient_company_id
                AND n.message_id = p_message_id 
                AND n.type = p_notification_type
                AND n.created_at > NOW() - INTERVAL '1 minute'
            ) INTO notification_exists;
            
            IF NOT notification_exists THEN
                INSERT INTO notifications (
                    recipient_company_id, 
                    type, 
                    title, 
                    message, 
                    order_id,
                    message_id,
                    sender_company_id,
                    data,
                    read_by,
                    read_count,
                    created_at,
                    updated_at
                ) VALUES (
                    v_recipient_company_id,
                    p_notification_type,
                    p_title,
                    p_message,
                    p_order_id,
                    p_message_id,
                    p_sender_company_id,
                    p_additional_data,
                    '{}',
                    0,
                    NOW(),
                    NOW()
                );
            END IF;
        END LOOP;
        RETURN; -- Exit early since we handled multiple companies in loop
    END IF;
    
    -- Handle single company notification (exporter)
    IF v_recipient_company_id IS NOT NULL THEN
        -- Check if notification already exists
        SELECT EXISTS(
            SELECT 1 FROM notifications n
            WHERE n.recipient_company_id = v_recipient_company_id
            AND n.message_id = p_message_id 
            AND n.type = p_notification_type
            AND n.created_at > NOW() - INTERVAL '1 minute'
        ) INTO notification_exists;
        
        IF NOT notification_exists THEN
            INSERT INTO notifications (
                recipient_company_id, 
                type, 
                title, 
                message, 
                order_id,
                message_id,
                sender_company_id,
                data,
                read_by,
                read_count,
                created_at,
                updated_at
            ) VALUES (
                v_recipient_company_id,
                p_notification_type,
                p_title,
                p_message,
                p_order_id,
                p_message_id,
                p_sender_company_id,
                p_additional_data,
                '{}',
                0,
                NOW(),
                NOW()
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create company-wide quote notifications
CREATE OR REPLACE FUNCTION create_quote_notification(
    p_quote_id UUID,
    p_order_id UUID,
    p_notification_type notification_type,
    p_title TEXT,
    p_message TEXT,
    p_sender_company_id UUID,
    p_additional_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
    v_recipient_company_id UUID;
    notification_exists BOOLEAN;
BEGIN
    -- Get order details
    SELECT o.*, e.id as exporter_id
    INTO order_record
    FROM orders o
    JOIN companies e ON o.exporter_id = e.id
    WHERE o.id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;
    
    -- Quote notifications typically go to the exporter company
    v_recipient_company_id := order_record.exporter_id;
    
    -- Check if notification already exists
    SELECT EXISTS(
        SELECT 1 FROM notifications n
        WHERE n.recipient_company_id = v_recipient_company_id
        AND n.quote_id = p_quote_id 
        AND n.type = p_notification_type
        AND n.created_at > NOW() - INTERVAL '1 minute'
    ) INTO notification_exists;
    
    IF NOT notification_exists THEN
        INSERT INTO notifications (
            recipient_company_id, 
            type, 
            title, 
            message, 
            order_id,
            quote_id,
            sender_company_id,
            data,
            read_by,
            read_count,
            created_at,
            updated_at
        ) VALUES (
            v_recipient_company_id,
            p_notification_type,
            p_title,
            p_message,
            p_order_id,
            p_quote_id,
            p_sender_company_id,
            p_additional_data,
            '{}',
            0,
            NOW(),
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check and create deadline notifications (7 days and 24 hours)
CREATE OR REPLACE FUNCTION check_deadline_notifications()
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
    deadline_7d TIMESTAMP;
    deadline_24h TIMESTAMP;
    notification_exists BOOLEAN;
BEGIN
    -- Calculate deadline thresholds
    deadline_7d := NOW() + INTERVAL '7 days';
    deadline_24h := NOW() + INTERVAL '24 hours';
    
    -- Check for orders due in 7 days
    FOR order_record IN 
        SELECT o.id, o.cargo_ready_date, o.quotation_deadline, o.exporter_id
        FROM orders o
        WHERE o.status NOT IN ('COMPLETED', 'CANCELLED', 'VOIDED')
        AND (
            (o.cargo_ready_date BETWEEN NOW() AND deadline_7d) OR
            (o.quotation_deadline BETWEEN NOW() AND deadline_7d)
        )
    LOOP
        -- Check if 7-day notification already sent recently
        SELECT EXISTS(
            SELECT 1 FROM notifications n
            WHERE n.order_id = order_record.id
            AND n.type = 'ORDER_DUE_7_DAYS'
            AND n.created_at > NOW() - INTERVAL '6 hours'
        ) INTO notification_exists;
        
        IF NOT notification_exists THEN
            PERFORM create_order_notification(
                order_record.id,
                'ORDER_DUE_7_DAYS'::notification_type,
                'Order Due in 7 Days',
                'Order is due for completion within the next 7 days',
                order_record.exporter_id,
                jsonb_build_object(
                    'cargo_ready_date', order_record.cargo_ready_date,
                    'quotation_deadline', order_record.quotation_deadline
                )
            );
        END IF;
    END LOOP;
    
    -- Check for orders due in 24 hours
    FOR order_record IN 
        SELECT o.id, o.cargo_ready_date, o.quotation_deadline, o.exporter_id
        FROM orders o
        WHERE o.status NOT IN ('COMPLETED', 'CANCELLED', 'VOIDED')
        AND (
            (o.cargo_ready_date BETWEEN NOW() AND deadline_24h) OR
            (o.quotation_deadline BETWEEN NOW() AND deadline_24h)
        )
    LOOP
        -- Check if 24-hour notification already sent recently
        SELECT EXISTS(
            SELECT 1 FROM notifications n
            WHERE n.order_id = order_record.id
            AND n.type = 'ORDER_DUE_24_HOURS'
            AND n.created_at > NOW() - INTERVAL '2 hours'
        ) INTO notification_exists;
        
        IF NOT notification_exists THEN
            PERFORM create_order_notification(
                order_record.id,
                'ORDER_DUE_24_HOURS'::notification_type,
                'Order Due in 24 Hours',
                'Order is due for completion within the next 24 hours',
                order_record.exporter_id,
                jsonb_build_object(
                    'cargo_ready_date', order_record.cargo_ready_date,
                    'quotation_deadline', order_record.quotation_deadline
                )
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger functions for automatic notifications

-- Trigger function for order creation
CREATE OR REPLACE FUNCTION trigger_order_created_notification()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_order_notification(
        NEW.id,
        'ORDER_CREATED'::notification_type,
        'New Order Created',
        'A new order "' || NEW.reference_number || '" has been created and is available for quotation',
        NEW.exporter_id,
        jsonb_build_object(
            'order_reference', NEW.reference_number,
            'collection_port', NEW.origin_port_id,
            'delivery_port', NEW.destination_port_id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for order status changes
CREATE OR REPLACE FUNCTION trigger_order_status_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'CANCELLED' THEN
            PERFORM create_order_notification(
                NEW.id,
                'ORDER_CANCELLED'::notification_type,
                'Order Cancelled',
                'Order #' || NEW.reference_number || ' has been cancelled',
                NEW.exporter_id,
                jsonb_build_object('order_reference', NEW.reference_number)
            );
        ELSIF NEW.status = 'VOIDED' THEN
            PERFORM create_order_notification(
                NEW.id,
                'ORDER_VOIDED'::notification_type,
                'Order Voided',
                'Order #' || NEW.reference_number || ' has been voided',
                NEW.exporter_id,
                jsonb_build_object('order_reference', NEW.reference_number)
            );
        ELSIF NEW.status = 'COMPLETED' THEN
            PERFORM create_order_notification(
                NEW.id,
                'ORDER_CLOSED'::notification_type,
                'Order Completed',
                'Order #' || NEW.reference_number || ' has been completed',
                NEW.exporter_id,
                jsonb_build_object('order_reference', NEW.reference_number)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for quote selection
CREATE OR REPLACE FUNCTION trigger_quote_selected_notification()
RETURNS TRIGGER AS $$
DECLARE
    quote_record RECORD;
    order_record RECORD;
BEGIN
    -- Handle initial quote selection (first time)
    IF OLD.selected_quote_id IS NULL AND NEW.selected_quote_id IS NOT NULL THEN
        -- Get quote and order details
        SELECT q.*, ff.name as forwarder_name 
        INTO quote_record
        FROM quotes q
        JOIN companies ff ON q.freight_forwarder_id = ff.id
        WHERE q.id = NEW.selected_quote_id;
        
        SELECT o.reference_number INTO order_record
        FROM orders o WHERE o.id = NEW.id;
        
        IF FOUND THEN
            PERFORM create_order_notification(
                NEW.id,
                'QUOTE_SELECTED'::notification_type,
                'Your Quote Selected',
                'Your quote for order #' || order_record.reference_number || ' has been selected',
                quote_record.freight_forwarder_id,
                jsonb_build_object(
                    'order_reference', order_record.reference_number,
                    'quote_id', quote_record.id,
                    'forwarder_name', quote_record.forwarder_name
                )
            );
        END IF;
    
    -- Handle quote reassignment (changing from one quote to another)
    ELSIF OLD.selected_quote_id IS NOT NULL AND NEW.selected_quote_id IS NOT NULL 
          AND OLD.selected_quote_id != NEW.selected_quote_id THEN
        
        -- Get new quote and order details
        SELECT q.*, ff.name as forwarder_name 
        INTO quote_record
        FROM quotes q
        JOIN companies ff ON q.freight_forwarder_id = ff.id
        WHERE q.id = NEW.selected_quote_id;
        
        SELECT o.reference_number INTO order_record
        FROM orders o WHERE o.id = NEW.id;
        
        IF FOUND THEN
            -- Send notification to the newly selected forwarder only
            PERFORM create_order_notification(
                NEW.id,
                'ORDER_REASSIGNED'::notification_type,
                'Order Reassigned to You',
                'Order #' || order_record.reference_number || ' has been reassigned to your company',
                quote_record.freight_forwarder_id,
                jsonb_build_object(
                    'order_reference', order_record.reference_number,
                    'quote_id', quote_record.id,
                    'forwarder_name', quote_record.forwarder_name,
                    'previous_quote_id', OLD.selected_quote_id
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for new messages
CREATE OR REPLACE FUNCTION trigger_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    order_record RECORD;
    sender_company RECORD;
    notification_type_val notification_type;
BEGIN
    -- Get order and sender details
    SELECT o.*, e.name as exporter_name, e.id as exporter_id
    INTO order_record
    FROM orders o
    JOIN companies e ON o.exporter_id = e.id
    WHERE o.id = NEW.order_id;
    
    SELECT c.id as id, c.name, c.type as company_type 
    INTO sender_company
    FROM companies c
    JOIN company_members cm ON cm.company_id = c.id
    WHERE cm.id = NEW.sent_by_user_id;
    
    IF FOUND THEN
        -- Determine notification type based on sender company type
        IF sender_company.company_type = 'EXPORTER'::company_type THEN
            notification_type_val := 'NEW_MESSAGE_FORWARDER'::notification_type;
        ELSE
            notification_type_val := 'NEW_MESSAGE_EXPORTER'::notification_type;
        END IF;
        
        PERFORM create_message_notification(
            NEW.id,
            NEW.order_id,
            notification_type_val,
            'New Message Received',
            'You have received a new message regarding order #' || order_record.reference_number,
            sender_company.id,
            jsonb_build_object(
                'order_reference', order_record.reference_number,
                'sender_name', sender_company.name,
                'message_preview', LEFT(NEW.message, 100)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for notifying a forwarder when they are selected for an order (ORDER_CREATED)
CREATE OR REPLACE FUNCTION trigger_forwarder_selected_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    order_rec RECORD;
    notification_exists BOOLEAN;
BEGIN
    -- Fetch order reference and exporter
    SELECT o.reference_number, o.exporter_id INTO order_rec
    FROM orders o WHERE o.id = NEW.order_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Deduplicate notifications for the same forwarder/order within a short window
    SELECT EXISTS(
        SELECT 1 FROM notifications n
        WHERE n.recipient_company_id = NEW.freight_forwarder_id
          AND n.order_id = NEW.order_id
          AND n.type = 'ORDER_CREATED'
          AND n.created_at > NOW() - INTERVAL '5 minutes'
    ) INTO notification_exists;

    IF NOT notification_exists THEN
        INSERT INTO notifications (
            recipient_company_id,
            type,
            title,
            message,
            order_id,
            sender_company_id,
            data,
            read_by,
            read_count,
            created_at,
            updated_at
        ) VALUES (
            NEW.freight_forwarder_id,
            'ORDER_CREATED',
            'New Order Available',
            'A new order "' || order_rec.reference_number || '" has been created and is available for quotation',
            NEW.order_id,
            order_rec.exporter_id,
            jsonb_build_object(
                'order_reference', order_rec.reference_number
            ),
            '{}',
            0,
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for new quotes
CREATE OR REPLACE FUNCTION trigger_quote_notification()
RETURNS TRIGGER AS $$
DECLARE
    order_record RECORD;
    forwarder_record RECORD;
BEGIN
    -- Get order details
    SELECT o.reference_number INTO order_record
    FROM orders o WHERE o.id = NEW.order_id;
    
    -- Get forwarder details
    SELECT c.name INTO forwarder_record
    FROM companies c WHERE c.id = NEW.freight_forwarder_id;
    
    IF FOUND THEN
        PERFORM create_quote_notification(
            NEW.id,
            NEW.order_id,
            'QUOTE_RECEIVED'::notification_type,
            'New Quote Received',
            'You have received a new quote from ' || forwarder_record.name || ' for order #' || order_record.reference_number,
            NEW.freight_forwarder_id,
            jsonb_build_object(
                'order_reference', order_record.reference_number,
                'forwarder_name', forwarder_record.name,
                'quote_amount', NEW.net_freight_cost
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers

-- Order creation trigger
DROP TRIGGER IF EXISTS order_created_notification ON orders;
CREATE TRIGGER order_created_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_created_notification();

-- Order status change trigger  
DROP TRIGGER IF EXISTS order_status_notification ON orders;
CREATE TRIGGER order_status_notification
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_status_notification();

-- Quote selection trigger
DROP TRIGGER IF EXISTS quote_selection_notification ON orders;
CREATE TRIGGER quote_selection_notification
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_quote_selected_notification();

-- Message notification trigger
DROP TRIGGER IF EXISTS message_notification ON order_messages;
CREATE TRIGGER message_notification
    AFTER INSERT ON order_messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_message_notification();

-- Quote notification trigger
DROP TRIGGER IF EXISTS quote_notification ON quotes;
CREATE TRIGGER quote_notification
    AFTER INSERT ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_quote_notification();

-- Forwarder selected for order trigger (emit ORDER_CREATED per forwarder)
DROP TRIGGER IF EXISTS forwarder_selected_order_notification ON order_selected_forwarders;
CREATE TRIGGER forwarder_selected_order_notification
    AFTER INSERT ON order_selected_forwarders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_forwarder_selected_order_notification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_order_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_message_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_quote_notification TO authenticated;
GRANT EXECUTE ON FUNCTION check_deadline_notifications TO authenticated;

-- Create index for better performance on company notifications
CREATE INDEX IF NOT EXISTS idx_notifications_company_unread 
ON notifications (recipient_company_id, created_at DESC) 
WHERE read_count = 0;

CREATE INDEX IF NOT EXISTS idx_notifications_company_type 
ON notifications (recipient_company_id, type);