import { NextResponse } from 'next/server';
import { uploadDocuments, createDocument } from '@/data-access/document';
// import { auth } from '@/lib/auth';

export async function POST(request) {
  try {
    // const session = await auth();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // TODO: Check if user has permission to upload document from user session 

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const description = formData.get('description');
    const entityType = formData.get('entityType');
    const entityId = formData.get('entityId');
    const metadata = JSON.parse(formData.get('metadata'));

    if (!file || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Decide base path based on entity type so structure becomes:
    // documents/orders/{entityId}/{generatedFileBase}/{generatedFileBase}.{ext}
    let customPath = '';
    if (entityType === 'ORDER') {
      customPath = `orders/${entityId}`;
    } else if (entityType === 'COMPANY') {
      customPath = `companies/${entityId}`;
    } else if (entityType) {
      customPath = `${entityType.toLowerCase()}s/${entityId}`;
    }

    // Upload file to storage
    const { documents } = await uploadDocuments(
      [file],
      [{
        title,
        description,
        additionalInfo: metadata
      }],
      entityType,
      customPath
    );

    // Create document record in database
    const document = await createDocument({
      title,
      description,
      file_url: documents[0].file_url,
      entity_type: entityType,
      entity_id: entityId,
      uploaded_by: "18a93a72-0b03-493f-9e93-caa7ed124ec7",
      metadata: documents[0].metadata
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
} 