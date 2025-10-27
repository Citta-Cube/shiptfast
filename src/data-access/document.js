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
 * @param {string} entityType - Type of entity ('ORDER' | 'COMPANY' | 'ORDER_QUOTE')
 * @param {string} [customPath] - Optional custom storage path prefix
 * @returns {Promise<Array>} Array of processed document objects
 */
export async function uploadDocuments(files, documentMetadata = [], entityType, customPath = '') {
  try {
    const documents = await Promise.all(
      files.map(async (file, index) => {
        const metadata = documentMetadata[index] || {};
        const fileExt = file.name.split('.').pop();
        const fileBaseName = `${Date.now()}-${crypto.randomUUID()}`;
        const fileName = `${fileBaseName}.${fileExt}`;
        // Base dir (order → orders/, company → companies/, or customPath)
        const baseDir = customPath || `${entityType.toLowerCase()}s`;
        // Final storage path: <baseDir>/<uuid>/<uuid.ext>
        const filePath = `${baseDir}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload document: ${uploadError.message}`);
        }

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
    if (error.uploadedPaths?.length > 0) {
      await supabase.storage.from('documents').remove(error.uploadedPaths);
    }
    throw error;
  }
}

/**
 * Extracts the storage path from a Supabase storage URL
 * @param {string} fileUrl - The public URL of the file
 * @returns {string|null} - The storage path or null if extraction fails
 */
function extractStoragePathFromUrl(fileUrl) {
  try {
    const url = new URL(fileUrl);
    console.log("URL", url);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
    console.log("pathMatch", pathMatch);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Deletes a document + its file from Supabase
 * @param {string} id - document UUID
 */
export async function deleteDocument(id) {
  //  Get document row
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('metadata, file_url')
    .eq('id', id)
    .single();
  
  console.log("Got document row:", document);

  if (fetchError) throw fetchError;
  if (!document) throw new Error("Document not found");

  const storagePath =
    document?.metadata?.storagePath ||
    extractStoragePathFromUrl(document.file_url);

  console.log("storage Path:", storagePath);

  if (!storagePath) {
    throw new Error("No valid storage path found for document");
  }
  
  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([storagePath]);
  
  if (storageError) {
    throw new Error(`Failed to delete file from storage: ${storageError.message}`);
  }

  // Delete DB record
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) {
    throw new Error(`Failed to delete document row: ${dbError.message}`);
  }

  return { success: true, deletedId: id };
}

