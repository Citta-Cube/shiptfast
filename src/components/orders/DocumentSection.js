// @/components/orders/DocumentSection.js
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const DocumentSection = ({ documents, orderId, className }) => {
  const handleUpload = async (event) => {
    // Implement document upload logic
  };

  return (
    <Card className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <div>
          <input
            type="file"
            id="document-upload"
            className="hidden"
            onChange={handleUpload}
            multiple
          />
          <label htmlFor="document-upload">
            <Button variant="outline" as="span">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {documents.map((doc, index) => (
            <li key={index} className="flex justify-between items-center">
              <span>{doc.name}</span>
              <Button variant="outline" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default DocumentSection;