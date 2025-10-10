import mockOrders from '@/mockData/orders';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllOrders } from '@/data-access/orders';

const supabase = createClient();

export async function GET() {
  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}


export async function POST(req) {
  try {
    const formData = await req.formData();
    const orderData = JSON.parse(formData.get('orderData'));
    const selectedForwarders = JSON.parse(formData.get('selectedForwarders'));
    const documentMetadata = JSON.parse(formData.get('documentMetadata'));
    const files = formData.getAll('documents');

    // Upload documents to Supabase storage
    // const uploadedDocuments = await Promise.all(files.map(async (file, index) => {
    //   const fileName = `${Date.now()}-${file.name}`;
    //   const { data, error } = await supabase.storage
    //     .from('order-documents')
    //     .upload(fileName, file);

    //   if (error) throw error;

    //   const { data: publicUrlData } = supabase.storage
    //     .from('order-documents')
    //     .getPublicUrl(fileName);

    //   return {
    //     title: documentMetadata[index].title || file.name,
    //     description: documentMetadata[index].description || '',
    //     fileUrl: publicUrlData.publicUrl
    //   };
    // }));

    // // Start a Supabase transaction
    // const { data, error } = await supabase.rpc('create_order_with_documents_and_forwarders', {
    //   p_order_data: orderData,
    //   p_documents: uploadedDocuments,
    //   p_selected_forwarders: selectedForwarders,
    // });

    // if (error) throw error;

    return NextResponse.json({ success: true, orderId: data.order_id }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}