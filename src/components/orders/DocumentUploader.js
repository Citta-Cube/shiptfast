import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Upload, FileText, FileImage, FileArchive } from 'lucide-react';
import { toast } from "sonner";

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return <FileText className="h-6 w-6 text-blue-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
      return <FileImage className="h-6 w-6 text-blue-500" />;
    case 'zip':
    case 'rar':
      return <FileArchive className="h-6 w-6 text-blue-500" />;
    default:
      return <FileText className="h-6 w-6 text-gray-500" />;
  }
};

const DocumentUploader = ({ documents, onUpload, onRemove }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setCurrentFile(file);
      setIsModalOpen(true);
    }
  };

  const handleModalSubmit = () => {
    if (!documentTitle.trim()) {
      toast.error("Please provide a document title");
      return;
    }

    toast.success("Document added successfully");
    onUpload({
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

  const handleRemoveDocument = (index) => {
    onRemove(index);
    toast.success("Document removed");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG or DOCX (MAX. 10MB)</p>
            </div>
            <input 
              id="dropzone-file" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.docx"
            />
          </label>
        </div>
        {documents.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Uploaded Documents:</h4>
            <ul className="space-y-2">
              {documents.map((doc, index) => (
                <li key={index} className="flex items-center justify-between p-3 rounded-lg shadow-sm">
                  <div className="flex items-start space-x-3">
                    {getFileIcon(doc.file.name)}
                    <div>
                      <span className="text-sm font-medium">{doc.title}</span>
                      <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <span>{doc.file.name}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.metadata.size)}</span>
                        <span>•</span>
                        <span>{doc.metadata.contentType}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDocument(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right">
                Title
              </label>
              <Input
                id="title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right">
                Description
              </label>
              <Textarea
                id="description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleModalSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentUploader;