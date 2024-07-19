// src/app/api/orders/[id]/route.js
import { mockOrders } from '@/mockData/detailedOrders';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    // const id = params.id;
    // const order = mockOrders.find(order => order.id === id);
    const randomIndex = Math.floor(Math.random() * mockOrders.length);
    const order = mockOrders[randomIndex];

    if (order) {
        return NextResponse.json(order);
    } else {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
}
