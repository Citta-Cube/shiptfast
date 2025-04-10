'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from 'lucide-react';
import { toast } from "sonner";

export function DocumentUploadButton({ onUpload, isUploading }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF, PNG, JPG, or DOC files.");
      return;
    }

    setCurrentFile(file);
    setDocumentTitle(file.name.split('.')[0]); // Set default title as filename
    setIsModalOpen(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async () => {
    if (!documentTitle.trim()) {
      toast.error("Please provide a document title");
      return;
    }

    await onUpload({
      file: currentFile,
      title: documentTitle,
      description: documentDescription,
      metadata: {
        size: currentFile.size,
        fileName: currentFile.name,
        contentType: currentFile.type,
        lastModified: currentFile.lastModified
      }
    });

    setIsModalOpen(false);
    setCurrentFile(null);
    setDocumentTitle('');
    setDocumentDescription('');
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => document.getElementById('file-upload').click()}
          variant="outline"
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Document Title
              </label>
              <Input
                id="title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Add a description for this document"
                rows={3}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Selected file: {currentFile?.name}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 