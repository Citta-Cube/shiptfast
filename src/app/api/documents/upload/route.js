import { NextResponse } from 'next/server';
import { uploadDocuments, createDocument } from '@/data-access/document';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const description = formData.get('description');
    const entityType = formData.get('entityType');
    const entityId = formData.get('entityId');
    const metadata = JSON.parse(formData.get('metadata'));
    const quoteId = formData.get('quoteId'); // Optional, only for ORDER_QUOTE type

    if (!file || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For ORDER_QUOTE type, verify forwarder ownership
    if (entityType === 'ORDER_QUOTE') {
      if (!quoteId) {
        return NextResponse.json(
          { error: 'Quote ID is required for ORDER_QUOTE entity type' },
          { status: 400 }
        );
      }

      // Get user's company
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyMember) {
        return NextResponse.json(
          { error: 'User is not associated with any company' },
          { status: 403 }
        );
      }

      // Verify the quote belongs to the forwarder
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('freight_forwarder_id, status, order_id')
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        return NextResponse.json(
          { error: 'Quote not found' },
          { status: 404 }
        );
      }

      if (quote.freight_forwarder_id !== companyMember.company_id) {
        return NextResponse.json(
          { error: 'Unauthorized to upload documents for this quote' },
          { status: 403 }
        );
      }

      // Verify quote is selected
      if (quote.status !== 'SELECTED') {
        return NextResponse.json(
          { error: 'Documents can only be uploaded for selected quotes' },
          { status: 400 }
        );
      }

      // Verify order is closed
      const { data: order } = await supabase
        .from('orders')
        .select('status')
        .eq('id', quote.order_id)
        .single();

      if (order?.status !== 'CLOSED') {
        return NextResponse.json(
          { error: 'Documents can only be uploaded for closed orders' },
          { status: 400 }
        );
      }
    }

    // Decide base path based on entity type so structure becomes:
    // documents/orders/{entityId}/{generatedFileBase}/{generatedFileBase}.{ext}
    let customPath = '';
    if (entityType === 'ORDER') {
      customPath = `orders/${entityId}`;
    } else if (entityType === 'COMPANY') {
      customPath = `companies/${entityId}`;
    } else if (entityType === 'ORDER_QUOTE') {
      customPath = `order-quotes/${quoteId}`;
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
      entity_id: entityType === 'ORDER_QUOTE' ? quoteId : entityId,
      uploaded_by: user.id,
      metadata: {
        ...documents[0].metadata,
        ...(entityType === 'ORDER_QUOTE' && { quote_id: quoteId, order_id: entityId })
      }
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