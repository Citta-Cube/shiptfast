"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Lock,
  Upload,
  CheckCircle2,
  FileText,
  Loader2,
  Calendar,
  User,
  AlertCircle,
  Eye,
  Check,
} from "lucide-react";
import FinalInvoiceUploadDialog from "./FinalInvoiceUploadDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function FinalInvoiceControls({
  order,
  selectedQuote,
  userRole,
  forwarderCompanyOwnsSelected = false,
}) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const canUpload =
    userRole === "forwarder" &&
    forwarderCompanyOwnsSelected &&
    !invoice?.metadata?.locked;
  const canAccept =
    userRole === "exporter" && !!invoice && !invoice?.metadata?.locked;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/invoices/${order.id}`);
        const data = await res.json();
        if (!active) return;
        setInvoice(data.invoice);
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    if (order?.id) load();
    return () => {
      active = false;
    };
  }, [order?.id]);

  const acceptInvoice = async () => {
    setAccepting(true);
    try {
      const res = await fetch("/api/invoices/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept");
      toast.success("Final invoice accepted successfully");
      setInvoice(
        data.invoice || {
          ...invoice,
          metadata: { ...(invoice?.metadata || {}), locked: true },
        }
      );
    } catch (e) {
      toast.error(e.message || "Failed to accept invoice");
    } finally {
      setAccepting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = () => {
    if (invoice?.metadata?.locked) {
      return (
        <Badge
          variant="secondary"
          className="bg-green-500 text-white"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      );
    }
    if (invoice) {
      return (
        <Badge
          variant="secondary"
          className="bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))] border border-[hsl(var(--chart-2))]/20"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-muted text-muted-foreground border-border"
      >
        <FileText className="w-3 h-3 mr-1" />
        Not Uploaded
      </Badge>
    );
  };

  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-all duration-300 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              Final Invoice
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              {userRole === "forwarder"
                ? "Upload and manage the final invoice for this order."
                : "Review and confirm the final invoice from your forwarder."}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            <span className="text-sm">Checking invoice status...</span>
          </div>
        ) : (
          <>
            {!invoice ? (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center space-y-3 bg-muted/30">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    No invoice uploaded yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userRole === "forwarder"
                      ? "Upload the final invoice to proceed"
                      : "Waiting for forwarder to upload the invoice"}
                  </p>
                </div>
                {canUpload && (
                  <Button onClick={() => setOpenDialog(true)} className="mt-4">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Invoice
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Invoice for #{order.reference_number}
                    </h4>
                    {invoice?.metadata?.locked && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {invoice.created_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Uploaded: {formatDate(invoice.created_at)}</span>
                      </div>
                    )}
                    {invoice.uploaded_by && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>By: {invoice.uploaded_by}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(invoice.file_url, "_blank")}
                    className="flex-1 md:flex-none"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Invoice
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = invoice.file_url;
                      link.download = `invoice-${order.reference_number}.pdf`;
                      link.click();
                    }}
                    className="flex-1 md:flex-none"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>

                  {canAccept && (
                    <Button
                      size="sm"
                      onClick={acceptInvoice}
                      disabled={accepting}
                      className={cn(
                        "flex-1 md:flex-none bg-[hsl(var(--chart-1))] hover:bg-[hsl(var(--chart-1))]/90 text-white",
                        accepting && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {accepting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {accepting ? "Accepting..." : "Accept Invoice"}
                    </Button>
                  )}

                  {canUpload && (
                    <Button
                      size="sm"
                      onClick={() => setOpenDialog(true)}
                      className="flex-1 md:flex-none"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Version
                    </Button>
                  )}
                </div>

                {canAccept && (
                  <div className="rounded-lg bg-[hsl(var(--chart-2))]/10 border border-[hsl(var(--chart-2))]/30 p-3">
                    <p className="text-xs text-[hsl(var(--chart-2))] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Please review the invoice carefully before accepting. Once accepted, it will be locked.
                    </p>
                  </div>
                )}
              </div>
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
  );
}
