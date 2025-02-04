// src/app/api/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { getOrderDocuments } from '@/data-access/orders';

export async function GET(request, { params }) {
    const id = params.id;
    const documents = await getOrderDocuments(id);

    if (documents) {
        return NextResponse.json(documents);
    } else {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
}
