import { NextResponse } from 'next/server';
import { uploadDocuments, createDocument } from '@/data-access/document';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = createAdminClient();

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

    // Resolve uploader's company_members.id that relates to the target entity for better auditability
    const { data: memberships, error: memberErr } = await supabase
      .from('company_members')
      .select('id, company_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (memberErr || !memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'No active company membership' }, { status: 403 });
    }

    let uploaderMembershipId = memberships[0].id; // fallback to first active membership

    async function resolveMembershipId() {
      // Prefer membership that matches the entity's owning company
      if (entityType === 'COMPANY') {
        const match = memberships.find(m => String(m.company_id) === String(entityId));
        if (match) return match.id;
      }
      if (entityType === 'ORDER') {
        const { data: order } = await supabase
          .from('orders')
          .select('exporter_id, selected_quote_id')
          .eq('id', entityId)
          .single();
        if (order) {
          let match = memberships.find(m => String(m.company_id) === String(order.exporter_id));
          if (match) return match.id;
          if (order.selected_quote_id) {
            const { data: quote } = await supabase
              .from('quotes')
              .select('freight_forwarder_id')
              .eq('id', order.selected_quote_id)
              .single();
            if (quote) {
              match = memberships.find(m => String(m.company_id) === String(quote.freight_forwarder_id));
              if (match) return match.id;
            }
          }
        }
      }
      if (entityType === 'ORDER_QUOTE') {
        const { data: quote } = await supabase
          .from('quotes')
          .select('freight_forwarder_id, order_id')
          .eq('id', entityId)
          .single();
        if (quote) {
          let match = memberships.find(m => String(m.company_id) === String(quote.freight_forwarder_id));
          if (match) return match.id;
          const { data: order } = await supabase
            .from('orders')
            .select('exporter_id')
            .eq('id', quote.order_id)
            .single();
          if (order) {
            match = memberships.find(m => String(m.company_id) === String(order.exporter_id));
            if (match) return match.id;
          }
        }
      }
      return uploaderMembershipId;
    }

    uploaderMembershipId = await resolveMembershipId();

    // Upload file to storage
    const { documents } = await uploadDocuments(
      [file],
      [{
        title,
        description,
        additionalInfo: metadata
      }],
      entityType,
      customPath,
      supabase
    );

    // Create document record in database
    const document = await createDocument({
      title,
      description,
      file_url: documents[0].file_url,
      entity_type: entityType,
      entity_id: entityId,
      uploaded_by: uploaderMembershipId,
      metadata: documents[0].metadata
    }, supabase);

    return NextResponse.json(document);
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
} 