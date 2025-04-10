import { NextResponse } from 'next/server';
import { deleteDocument } from '@/data-access/document';
// import { auth } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    // const session = await auth();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // TODO: Check if user has permission to delete document from user session 

    await deleteDocument(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 