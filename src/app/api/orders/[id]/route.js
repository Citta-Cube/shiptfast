// src/app/api/orders/[id]/route.js
import { mockOrders } from '@/mockData/detailedOrders';
import { NextResponse } from 'next/server';
import { getOrderById, cancelOrder, voidOrder } from '@/data-access/orders';
import { processEmailNotifications } from '@/lib/email/processNotifications';
import { createClient } from '@/lib/supabase/server';

export async function GET(request, { params }) {
    const id = params.id;
    // const randomIndex = Math.floor(Math.random() * mockOrders.length);
    // const order = mockOrders[randomIndex];
    const order = await getOrderById(id);

    if (order) {
        return NextResponse.json(order);
    } else {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
}

export async function PATCH(request, { params }) {
    const id = params.id;
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action');

    if (action !== 'cancel') {
        return NextResponse.json(
            { error: 'Invalid action. Supported action: cancel' },
            { status: 400 }
        );
    }

    // Get the order's current status before cancelling - store for potential rollback
    let currentOrder;
    try {
        currentOrder = await getOrderById(id);
        if (!currentOrder) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (currentOrder.status === 'CANCELLED') {
            return NextResponse.json(
                { error: 'Order is already cancelled' },
                { status: 400 }
            );
        }

        if (!['cancel', 'void'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Supported actions: cancel, void' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order' },
            { status: 500 }
        );
    }

    // Store original status for rollback
    const originalStatus = currentOrder.status;
    let orderCancelled = false;

    // Helper function to rollback order cancellation
    const rollbackCancellation = async () => {
        if (!orderCancelled) return;
        
        try {
            const supabase = createClient();
            // Restore order status
            await supabase
                .from('orders')
                .update({ 
                    status: originalStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
            
            // Restore quotes that were cancelled (only those that were ACTIVE before)
            await supabase
                .from('quotes')
                .update({ 
                    status: 'ACTIVE',
                    updated_at: new Date().toISOString()
                })
                .eq('order_id', id)
                .eq('status', 'CANCELLED');
        } catch (rollbackError) {
            console.error('CRITICAL: Failed to rollback order cancellation:', rollbackError);
        }
    };

    try {
        // Cancel the order first (this will trigger notifications via DB trigger)
        let cancelledOrder;
        try {
            cancelledOrder = await cancelOrder(id);
        } catch (cancelError) {
            // Check if the error is a UUID error (trigger failure)
            // Even if cancelOrder throws, the order might have been cancelled
            // Verify the actual state
            const verifyOrder = await getOrderById(id);
            if (verifyOrder && verifyOrder.status === 'CANCELLED') {
                // Order was cancelled despite the error - we need to rollback
                orderCancelled = true;
                await rollbackCancellation();
                return NextResponse.json(
                    { 
                        error: 'Order cancellation failed due to trigger error. Changes have been rolled back.',
                        details: cancelError.message || 'Database trigger error'
                    },
                    { status: 500 }
                );
            }
            // Order wasn't cancelled, so just throw the error
            throw cancelError;
        }
        
        // Verify the order was actually cancelled
        const verifyOrder = await getOrderById(id);
        if (!verifyOrder || verifyOrder.status !== 'CANCELLED') {
            // Order wasn't cancelled, something went wrong
            return NextResponse.json(
                { 
                    error: 'Order cancellation did not complete successfully',
                    details: 'Order status was not updated to CANCELLED'
                },
                { status: 500 }
            );
        }
        
        orderCancelled = true; // Mark that cancellation succeeded
        
        // Send email notifications - if this fails, we need to rollback
        let emailResult;
        try {
            emailResult = await processEmailNotifications({ types: ['ORDER_CANCELLED'], orderId: id });
            
            // Check if email processing was successful
            if (!emailResult || !emailResult.success) {
                throw new Error('Email notification processing failed');
            }
        } catch (emailError) {
            console.error('Email dispatch for order cancelled failed:', emailError);
            
            // Rollback the cancellation
            await rollbackCancellation();
            
            return NextResponse.json(
                { 
                    error: 'Failed to send cancellation notifications. Order cancellation has been rolled back.',
                    details: emailError.message 
                },
                { status: 500 }
            );
        }

        // Both operations succeeded
        return NextResponse.json(cancelledOrder);
        let result;
        let notificationType;

        if (action === 'cancel') {
            result = await cancelOrder(id);
            notificationType = 'ORDER_CANCELLED';
        } else if (action === 'void') {
            result = await voidOrder(id);
            notificationType = 'ORDER_VOIDED';
        }

        // Send email immediately for the appropriate notification type
        try {
            await processEmailNotifications({ types: [notificationType], orderId: id })
        } catch (e) {
            console.error(`Email dispatch for ${notificationType} failed:`, e)
        }

        return NextResponse.json(result);
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        
        // Check if order was actually cancelled despite the error
        let actuallyCancelled = false;
        try {
            const verifyOrder = await getOrderById(id);
            actuallyCancelled = verifyOrder && verifyOrder.status === 'CANCELLED';
        } catch (verifyError) {
            console.error('Error verifying order status:', verifyError);
        }
        
        // If order was cancelled but we hit an error, rollback
        if (orderCancelled || actuallyCancelled) {
            orderCancelled = true;
            await rollbackCancellation();
            return NextResponse.json(
                { 
                    error: 'Order cancellation failed during processing. Changes have been rolled back.',
                    details: error.message 
                },
                { status: 500 }
            );
        }
        
        // Error happened before cancellation, so no rollback needed
        if (error.message === 'Order not found') {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }
        
        if (error.message === 'Order is already cancelled') {
            return NextResponse.json(
                { error: 'Order is already cancelled' },
                { status: 400 }
            );
        }
        
        if (error.message === 'Order is already voided') {
            return NextResponse.json(
                { error: 'Order is already voided' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { 
                error: 'Failed to cancel order',
                details: error.message 
            },
            { error: `Failed to ${action} order` },
            { status: 500 }
        );
    }
}
