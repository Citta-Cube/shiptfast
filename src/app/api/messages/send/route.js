import { NextResponse } from 'next/server';
import { sendOrderMessage } from '@/data-access/messages';

export async function POST(request) {
  try {
    const messageData = await request.json();
    const newMessage = await sendOrderMessage(messageData);
    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}