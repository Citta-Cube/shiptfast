import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/data-access/orders';
import { uploadDocuments } from '@/data-access/document';

const supabase = createClient();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const orderData = JSON.parse(formData.get('orderData'));
    const selectedForwarderIds = JSON.parse(formData.get('selectedForwarderIds'));
    const documentMetadata = JSON.parse(formData.get('documentMetadata') || '[]');
    const files = formData.getAll('documents');

    // Validate required fields
    if (!orderData || !selectedForwarderIds) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that at least one freight forwarder is selected
    if (!Array.isArray(selectedForwarderIds) || selectedForwarderIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one freight forwarder must be selected to create an order' },
        { status: 400 }
      );
    }

    // Process document uploads first
    const { documents, uploadedPaths } = await uploadDocuments(
      files,
      documentMetadata,
      'ORDER',
      `companies/${orderData.exporter_id}/orders/${orderData.reference_number}`
    );

    try {
      // Create order with forwarders and documents
      const result = await createOrder(
        orderData,
        selectedForwarderIds,
        documents // Pass the documents array to createOrder
      );

      return NextResponse.json(
        { 
          success: true, 
          data: result 
        }, 
        { status: 201 }
      );

    } catch (error) {
      // If order creation fails, clean up the uploaded files
      if (uploadedPaths?.length > 0) {
        await supabase.storage
          .from('documents')
          .remove(uploadedPaths);
      }
      throw error;
    }

  } catch (error) {
    console.error('Error creating order:', error);

    // Handle specific error types
    if (error.message.includes('No relationship exists with forwarders')) {
      return NextResponse.json(
        { error: 'Invalid forwarder selection: ' + error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('Inactive relationship with forwarders')) {
      return NextResponse.json(
        { error: 'Inactive forwarder relationship: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order: ' + error.message },
      { status: 500 }
    );
  }
}

// Route segment config for API route
export const maxDuration = 60;