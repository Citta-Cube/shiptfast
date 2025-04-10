// @/components/orders/DocumentSection.js
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText } from 'lucide-react';
import { cn, formatDateTimeToReadable } from '@/lib/utils';
import { DocumentUploadButton } from './DocumentUploadButton';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

const DocumentSection = ({ 
  documents, 
  entityId, 
  entityType, // 'ORDER' or 'COMPANY'
  className, 
  canUpload = false,
  canDelete = false // New prop to control delete permissions
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localDocuments, setLocalDocuments] = useState(documents || []);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const handleUpload = async (documentData) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('title', documentData.title);
      formData.append('description', documentData.description);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      formData.append('metadata', JSON.stringify(documentData.metadata));

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const newDocument = await response.json();
      setLocalDocuments(prev => [...prev, newDocument]);
      toast.success("Document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (documentId) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');

      setLocalDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success("Document removed successfully");
    } catch (error) {
      toast.error("Failed to remove document");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');

      setLocalDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete document");
    } finally {
      setDocumentToDelete(null);
    }
  };

  return (
    <>
      <Card className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold">Documents</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your shipping documents and files
            </p>
          </div>
          {canUpload && (
            <DocumentUploadButton
              onUpload={handleUpload}
              isUploading={isUploading}
            />
          )}
        </CardHeader>
        <CardContent>
          {localDocuments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground bg-muted/5 rounded-lg border border-dashed">
              <Upload className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No documents uploaded yet</p>
              <p className="text-xs mt-1 max-w-[250px]">Upload shipping documents, invoices, or other relevant files</p>
            </div>
          ) : (
            <ul className="divide-y divide-border -mx-6">
              {localDocuments.map((doc) => (
                <li key={doc.id} className="hover:bg-muted/5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6">
                    <div className="flex-1 min-w-0 pr-4 mb-3 sm:mb-0">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{doc.title}</h4>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {doc.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground inline-flex items-center">
                              <span className="inline-block w-2 h-2 rounded-full bg-primary/50 mr-2"></span>
                              Added {formatDateTimeToReadable(doc.created_at, "short")}
                            </span>
                            {doc.metadata?.size && (
                              <span className="text-xs text-muted-foreground inline-flex items-center">
                                <span className="inline-block w-2 h-2 rounded-full bg-primary/50 mr-2"></span>
                                {(doc.metadata.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="w-full sm:w-auto"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocumentToDelete(doc)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentSection;