import { createClient } from '@/lib/supabase/server';

const supabase = createClient();

export async function getDocumentById(id) {
  const { data, error } = await supabase
    .from('documents')
    .select('*, companies(*), orders(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createDocument(document) {
  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getDocumentsByOrder(orderId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('order_id', orderId);
  
  if (error) throw error;
  return data;
}

/**
 * Uploads documents to Supabase storage and prepares document metadata
 * @param {File[]} files - Array of files to upload
 * @param {Object[]} documentMetadata - Array of metadata for each file
 * @param {string} entityType - Type of entity ('ORDER' or 'COMPANY')
 * @param {string} [customPath] - Optional custom storage path prefix
 * @returns {Promise<Array>} Array of processed document objects
 */
export async function uploadDocuments(files, documentMetadata = [], entityType, customPath = '') {
  try {
    const documents = await Promise.all(
      files.map(async (file, index) => {
        const metadata = documentMetadata[index] || {};
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${customPath || entityType.toLowerCase()}s/${fileName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload document: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        return {
          title: metadata.title || file.name,
          description: metadata.description || '',
          file_url: publicUrl,
          entity_type: entityType,
          metadata: {
            originalName: file.name,
            size: file.size,
            type: file.type,
            storagePath: filePath,
            ...metadata.additionalInfo
          }
        };
      })
    );

    return { documents, uploadedPaths: documents.map(doc => doc.metadata.storagePath) };
  } catch (error) {
    // Clean up any uploaded files if there's an error
    if (error.uploadedPaths?.length > 0) {
      await supabase.storage
        .from('documents')
        .remove(error.uploadedPaths);
    }
    throw error;
  }
}

export async function deleteDocument(id) {
  // First get the document to get the storage path
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('metadata')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Delete from storage if path exists
  if (document.metadata?.storagePath) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.metadata.storagePath]);

    if (storageError) throw storageError;
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;
}