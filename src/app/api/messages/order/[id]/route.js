import { NextResponse } from 'next/server';
import { getOrderMessages, getOrderMessagesForUser } from '@/data-access/messages';
import { auth } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get messages for this user's company
    const messages = await getOrderMessagesForUser(params.id, userId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching order messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}