'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { ClockIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, AlertCircleIcon, CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon } from 'lucide-react';
import TransshipmentPortManager from './TransshipmentPortManager';
import AdditionalDetailsField from './AdditionalDetailsField';
import TransitRoute from './TransitRoute';

const QuoteSubmissionForm = ({ 
  orderId, 
  forwarderId, 
  existingQuote = null,
  allQuotes = [],
  shipmentType, // 'AIR' or 'SEA'
  loadType,     // 'FCL', 'LCL', 'FTL', etc.
  originPort,   // For displaying transit route
  destinationPort // For displaying transit route
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState(existingQuote ? 'view' : 'new');
  const [editMode, setEditMode] = useState(false);
  
  // Set initial form state - use existing quote data if available, or set defaults
  const [formData, setFormData] = useState({
    netFreightCost: existingQuote?.net_freight_cost || '',
    estimatedTimeDays: existingQuote?.estimated_time_days || '',
    validityPeriodDays: existingQuote?.validity_period_days || '30',
    notes: existingQuote?.note || '',
    // Sea freight specific fields
    containerCount: existingQuote?.quote_details?.containerCount || '1',
    containerSize: existingQuote?.quote_details?.containerSize || '20',
    // Air freight specific fields
    volumeWeight: existingQuote?.quote_details?.volumeWeight || '',
    chargeableWeight: existingQuote?.quote_details?.chargeableWeight || '',
    // LCL specific fields
    minimumCBM: existingQuote?.quote_details?.minimumCBM || '',
    ratePerCBM: existingQuote?.quote_details?.ratePerCBM || '',
    // Additional details
    additionalDetails: existingQuote?.quote_details || {},
    // Transshipment ports
    transshipmentPorts: existingQuote?.transshipment_ports || []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTransshipmentPortsChange = (ports) => {
    setFormData({
      ...formData,
      transshipmentPorts: ports
    });
  };

  const handleAdditionalDetailsChange = (details) => {
    setFormData({
      ...formData,
      additionalDetails: details
    });
  };

  const handleCancelQuote = async () => {
    if (!existingQuote?.id) return;
    
    try {
      setIsCancelling(true);
      
      const response = await fetch(`/api/forwarders/quotes/${existingQuote.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Quote cancelled successfully');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to cancel quote');
      }
    } catch (error) {
      toast.error('An error occurred while cancelling the quote');
      console.error(error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.netFreightCost || !formData.estimatedTimeDays || !formData.validityPeriodDays) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Build quote details based on shipment and load type
      const quoteDetails = { ...formData.additionalDetails };
      
      if (shipmentType === 'SEA') {
        if (loadType === 'FCL') {
          quoteDetails.containerCount = formData.containerCount;
          quoteDetails.containerSize = formData.containerSize;
        } else if (loadType === 'LCL') {
          quoteDetails.minimumCBM = formData.minimumCBM;
          quoteDetails.ratePerCBM = formData.ratePerCBM;
        }
      } else if (shipmentType === 'AIR') {
        quoteDetails.volumeWeight = formData.volumeWeight;
        quoteDetails.chargeableWeight = formData.chargeableWeight;
      }
      
      const quoteData = {
        orderId,
        forwarderId,
        netFreightCost: parseFloat(formData.netFreightCost),
        estimatedTimeDays: parseInt(formData.estimatedTimeDays),
        validityPeriodDays: parseInt(formData.validityPeriodDays),
        notes: formData.notes,
        quoteDetails,
        transshipmentPorts: formData.transshipmentPorts
      };
      
      let url = '/api/forwarders/quotes';
      let method = 'POST';
      
      // If editing an existing quote, use PATCH method with quote ID
      if (editMode && existingQuote?.id) {
        url = `/api/forwarders/quotes/${existingQuote.id}`;
        method = 'PATCH';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(editMode ? 'Quote updated successfully' : 'Quote submitted successfully');
        setEditMode(false);
        setActiveTab('view');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to submit quote');
      }
    } catch (error) {
      toast.error('An error occurred while submitting the quote');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuoteStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'SELECTED':
        return <Badge className="bg-blue-500">Selected</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-amber-500">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Generate the appropriate form fields based on shipment type and load type
  const renderConditionalFields = () => {
    if (shipmentType === 'SEA') {
      if (loadType === 'FCL') {
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="containerCount">Container Count*</Label>
                <Input
                  id="containerCount"
                  name="containerCount"
                  type="number"
                  placeholder="1"
                  min="1"
                  value={formData.containerCount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="containerSize">Container Size*</Label>
                <Select 
                  value={formData.containerSize} 
                  onValueChange={(value) => handleSelectChange('containerSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select container size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20ft</SelectItem>
                    <SelectItem value="40">40ft</SelectItem>
                    <SelectItem value="40HC">40ft HC</SelectItem>
                    <SelectItem value="45">45ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );
      } else if (loadType === 'LCL') {
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumCBM">Minimum CBM*</Label>
                <Input
                  id="minimumCBM"
                  name="minimumCBM"
                  type="number"
                  placeholder="1"
                  step="0.01"
                  min="0.01"
                  value={formData.minimumCBM}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ratePerCBM">Rate per CBM (USD)*</Label>
                <Input
                  id="ratePerCBM"
                  name="ratePerCBM"
                  type="number"
                  placeholder="35.00"
                  step="0.01"
                  min="0"
                  value={formData.ratePerCBM}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </>
        );
      }
    } else if (shipmentType === 'AIR') {
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volumeWeight">Volume Weight (kg)*</Label>
              <Input
                id="volumeWeight"
                name="volumeWeight"
                type="number"
                placeholder="100"
                step="0.01"
                min="0"
                value={formData.volumeWeight}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chargeableWeight">Chargeable Weight (kg)*</Label>
              <Input
                id="chargeableWeight"
                name="chargeableWeight"
                type="number"
                placeholder="120"
                step="0.01"
                min="0"
                value={formData.chargeableWeight}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </>
      );
    }
    
    return null;
  };

  // Render the quotes history list
  const renderQuoteHistory = () => {
    if (!allQuotes || allQuotes.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No quote history available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {allQuotes.map((quote, index) => (
          <Card key={quote.id} className={`overflow-hidden ${existingQuote?.id === quote.id ? 'border-primary border-2' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-md flex items-center gap-2">
                    Quote #{allQuotes.length - index} {renderQuoteStatusBadge(quote.status)}
                  </CardTitle>
                  <CardDescription>
                    Submitted {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                  </CardDescription>
                </div>
                {quote.status === 'ACTIVE' && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFormData({
                          netFreightCost: quote.net_freight_cost,
                          estimatedTimeDays: quote.estimated_time_days,
                          validityPeriodDays: quote.validity_period_days,
                          notes: quote.note || '',
                          ...(quote.quote_details || {}),
                          additionalDetails: quote.quote_details || {},
                          transshipmentPorts: quote.transshipment_ports || []
                        });
                        setEditMode(true);
                        setActiveTab('edit');
                      }}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <TrashIcon className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Quote</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this quote? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, keep quote</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleCancelQuote}
                            disabled={isCancelling}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isCancelling ? 'Cancelling...' : 'Yes, cancel quote'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Net Freight Cost:</span>
                  <p className="font-medium">${quote.net_freight_cost}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Estimated Delivery:</span>
                  <p className="font-medium">{quote.estimated_time_days} days</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Validity Period:</span>
                  <p className="font-medium">{quote.validity_period_days} days</p>
                </div>
                
                {/* Display transit route if there are transshipment ports */}
                {quote.transshipment_ports && quote.transshipment_ports.length > 0 && (
                  <div className="col-span-2 mt-4 mb-2">
                    <span className="text-sm text-muted-foreground">Transit Route:</span>
                    <div className="mt-2 bg-muted/40 p-3 rounded-md">
                      <TransitRoute 
                        origin={originPort} 
                        destination={destinationPort}
                        transshipmentPorts={quote.transshipment_ports} 
                      />
                    </div>
                  </div>
                )}
                
                {quote.quote_details && Object.keys(quote.quote_details).length > 0 && (
                  <div className="col-span-2 mt-2">
                    <span className="text-sm text-muted-foreground">Additional Details:</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {Object.entries(quote.quote_details).map(([key, value]) => {
                        // Skip container-specific fields that are already displayed elsewhere
                        if (["containerCount", "containerSize", "minimumCBM", "ratePerCBM", 
                            "volumeWeight", "chargeableWeight"].includes(key)) {
                          return null;
                        }
                        return (
                          <div key={key}>
                            <span className="text-xs text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <p className="text-sm">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {quote.note && (
                  <div className="col-span-2 mt-2">
                    <span className="text-sm text-muted-foreground">Notes:</span>
                    <p className="text-sm mt-1">{quote.note}</p>
                  </div>
                )}
              </div>
              
              {quote.quote_amendments && quote.quote_amendments.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm font-medium">Price Amendments:</span>
                  <div className="space-y-2 mt-2">
                    {quote.quote_amendments.map((amendment, i) => (
                      <div key={i} className="flex items-center text-sm">
                        <span className="text-muted-foreground mr-2">
                          {formatDistanceToNow(new Date(amendment.created_at), { addSuffix: true })}:
                        </span>
                        <span className="text-red-500 line-through mr-1">${amendment.previous_net_freight_cost}</span>
                        <ArrowRightIcon className="h-3 w-3 mx-1" />
                        <span className="text-green-500">${amendment.new_net_freight_cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // If there is no existing quote and canEdit is false, show the form
  const showNewQuoteForm = !existingQuote || editMode;

  return (
    <Tabs 
      defaultValue={activeTab} 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="view">View Quotes</TabsTrigger>
        <TabsTrigger value={editMode ? "edit" : "new"} disabled={existingQuote?.status !== 'ACTIVE' && existingQuote !== null && !editMode}>
          {!existingQuote ? "New Quote" : editMode ? "Edit Quote" : "Update Quote"}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="view" className="mt-4">
        {renderQuoteHistory()}
      </TabsContent>
      
      <TabsContent value={editMode ? "edit" : "new"} className="mt-4">
        {showNewQuoteForm ? (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>{editMode ? 'Update Quote' : 'New Quote'}</CardTitle>
                <CardDescription>
                  {editMode 
                    ? 'Modify your existing quote. Only price changes will be tracked in amendments.'
                    : 'Submit a new quote for this order'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="netFreightCost">Net Freight Cost (USD)*</Label>
                  <Input
                    id="netFreightCost"
                    name="netFreightCost"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.netFreightCost}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                {renderConditionalFields()}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedTimeDays">Estimated Delivery Time (Days)*</Label>
                    <Input
                      id="estimatedTimeDays"
                      name="estimatedTimeDays"
                      type="number"
                      placeholder="3"
                      min="1"
                      value={formData.estimatedTimeDays}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="validityPeriodDays">Validity Period (Days)*</Label>
                    <Input
                      id="validityPeriodDays"
                      name="validityPeriodDays"
                      type="number"
                      placeholder="30"
                      min="1"
                      value={formData.validityPeriodDays}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Transshipment Ports Section */}
                <TransshipmentPortManager
                  transshipmentPorts={formData.transshipmentPorts}
                  onChange={handleTransshipmentPortsChange}
                  originPort={originPort}
                  destinationPort={destinationPort}
                  shipmentType={shipmentType}
                  orderId={orderId}
                  quoteId={existingQuote?.id}
                />
                
                <Separator />
                
                {/* Additional Details Section */}
                <AdditionalDetailsField 
                  details={formData.additionalDetails}
                  onChange={handleAdditionalDetailsChange}
                  shipmentType={shipmentType}
                  loadType={loadType}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Enter any additional details about your quote..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                {editMode && (
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setEditMode(false);
                      setActiveTab('view');
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto sm:flex-1"
                >
                  {isSubmitting 
                    ? 'Submitting...' 
                    : editMode 
                      ? 'Update Quote' 
                      : 'Submit Quote'
                  }
                </Button>
              </CardFooter>
            </Card>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">This quote cannot be edited in its current state.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default QuoteSubmissionForm; 