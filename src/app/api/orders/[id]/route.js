// src/app/api/orders/[id]/route.js
import { mockOrders } from '@/mockData/detailedOrders';
import { NextResponse } from 'next/server';
import { getOrderById, cancelOrder } from '@/data-access/orders';

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

        if (action !== 'cancel') {
            return NextResponse.json(
                { error: 'Invalid action. Supported action: cancel' },
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

        const cancelledOrder = await cancelOrder(id);
        // Notifications are created by DB triggers; no manual dispatch here

        return NextResponse.json(cancelledOrder);
        
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

        return NextResponse.json(
            { error: 'Failed to cancel order' },
            { status: 500 }
        );
    }
}
