"use client";

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'

export default function FinalInvoiceUploadDialog({ open, onOpenChange, orderId, quoteId, onUploaded }) {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const onFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['application/pdf','image/png','image/jpeg']
    if (!allowed.includes(f.type)) {
      toast.error('Invalid file type. Please upload PDF or image files.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }
    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('orderId', orderId)
      form.append('quoteId', quoteId)
      const res = await fetch('/api/invoices/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      toast.success('Final invoice uploaded')
      onUploaded?.(data.invoice)
      onOpenChange(false)
      setFile(null)
    } catch (e) {
      toast.error(e.message || 'Failed to upload')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isUploading) onOpenChange(o) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Final Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input type="file" accept=".pdf,image/*" onChange={onFileChange} />
          {file && (
            <div className="text-xs text-muted-foreground">{file.name} • {(file.size/1024/1024).toFixed(2)} MB</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading…</>) : (<><Upload className="mr-2 h-4 w-4"/>Upload</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
