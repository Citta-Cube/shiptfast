"use client";

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Lock, Upload } from 'lucide-react'
import FinalInvoiceUploadDialog from './FinalInvoiceUploadDialog'
import { toast } from 'sonner'

/**
 * Props:
 * - order: order object (id, reference_number, selected_quote_id)
 * - selectedQuote: quote object or null
 * - userRole: 'exporter' | 'forwarder'
 * - forwarderCompanyOwnsSelected: boolean (for forwarder screens)
 */
export default function FinalInvoiceControls({ order, selectedQuote, userRole, forwarderCompanyOwnsSelected = false }) {
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)

  const canUpload = userRole === 'forwarder' && forwarderCompanyOwnsSelected && !invoice?.metadata?.locked
  const canAccept = userRole === 'exporter' && !!invoice && !invoice?.metadata?.locked

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/invoices/${order.id}`)
        const data = await res.json()
        if (!active) return
        setInvoice(data.invoice)
      } catch (e) {
        // ignore
      } finally {
        if (active) setLoading(false)
      }
    }
    if (order?.id) load()
    return () => { active = false }
  }, [order?.id])

  const acceptInvoice = async () => {
    try {
      const res = await fetch('/api/invoices/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept')
      toast.success('Final invoice accepted')
      setInvoice(data.invoice || { ...invoice, metadata: { ...(invoice?.metadata||{}), locked: true } })
    } catch (e) {
      toast.error(e.message || 'Failed to accept')
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Final Invoice</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 items-center">
        {loading ? (
          <div className="text-sm text-muted-foreground">Checking invoice…</div>
        ) : (
          <>
            {!invoice && userRole === 'exporter' && (
              <div className="text-sm text-muted-foreground">No invoice uploaded yet.</div>
            )}

            {invoice && (
              <>
                <Button variant="secondary" size="sm" onClick={() => window.open(invoice.file_url, '_blank')}>
                  <Download className="h-4 w-4 mr-2"/> View / Download
                </Button>
                {invoice?.metadata?.locked && (
                  <span className="inline-flex items-center text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 mr-1"/> Locked
                  </span>
                )}
              </>
            )}

            {canUpload && (
              <Button size="sm" onClick={() => setOpenDialog(true)}>
                <Upload className="h-4 w-4 mr-2"/> Upload Final Invoice
              </Button>
            )}

            {canAccept && (
              <Button size="sm" onClick={acceptInvoice}>
                Accept Final Invoice
              </Button>
            )}
          </>
        )}

        <FinalInvoiceUploadDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          orderId={order.id}
          quoteId={selectedQuote?.id || order.selected_quote_id}
          onUploaded={(inv) => setInvoice(inv)}
        />
      </CardContent>
    </Card>
  )
}
