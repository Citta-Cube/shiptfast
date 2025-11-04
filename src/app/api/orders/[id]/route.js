// src/app/api/orders/[id]/route.js
import { mockOrders } from '@/mockData/detailedOrders';
import { NextResponse } from 'next/server';
import { getOrderById, cancelOrder, voidOrder } from '@/data-access/orders';
import { processEmailNotifications } from '@/lib/email/processNotifications';

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
    try {
        const id = params.id;
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (!['cancel', 'void'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Supported actions: cancel, void' },
                { status: 400 }
            );
        }

        // Get the order's current status before cancelling
        const currentOrder = await getOrderById(id);
        if (!currentOrder) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

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
            { error: `Failed to ${action} order` },
            { status: 500 }
        );
    }
}
