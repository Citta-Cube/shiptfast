// @/components/orders/DocumentSection.js
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText } from 'lucide-react';
import { cn, formatDateTimeToReadable } from '@/lib/utils';

const DocumentSection = ({ documents, orderId, className, showUpload = false }) => {
  return (
    <Card className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold">Documents</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {showUpload ? "Manage your shipping documents and files" : "View shipping documents and files"}
          </p>
        </div>
        {showUpload && (
          <div className="w-full sm:w-auto">
            <input
              type="file"
              id="document-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              multiple
            />
            <label htmlFor="document-upload" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto hover:bg-accent transition-colors" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </span>
              </Button>
            </label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {documents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground bg-muted/5 rounded-lg border border-dashed">
            <Upload className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No documents uploaded yet</p>
            <p className="text-xs mt-1 max-w-[250px]">Upload shipping documents, invoices, or other relevant files</p>
          </div>
        ) : (
          <ul className="divide-y divide-border -mx-6">
            {documents.map((doc) => (
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
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => window.open(doc.file_url, '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSection;