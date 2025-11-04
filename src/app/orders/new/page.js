// src/app/orders/new/page.js
'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DynamicFormField from "@/components/dynamic-form-field/DynamicFormField";
import DocumentUploader from '@/components/orders/DocumentUploader';
import PalletizedCargoDetails from '@/components/orders/PalletizedCargoDetails';
import { formConfig } from '@/config/orderFormConfig';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { FreightForwarderCard, FreightForwarderCardSkeleton } from '@/components/orders/create/FreightForwarderCard';
import { Suspense } from 'react';

// Main component
const NewOrderPage = () => {
  const [orderData, setOrderData] = useState({
    orderNumber: '',
    shipmentType: '',
    loadType: '',
    incoterm: '',
    cargoReadyDate: null,
    quotationDeadline: null,
    isUrgent: false,
    note: '',
    noteIsImportant: false,
    originPort: '',
    destinationPort: '',
    grossWeight: '',
    chargeableWeight: '',
    dimensions: '',
    cargoType: '',
    containerType: '',
    palletCBM: '',
    cargoCBM: '',
  deliveryAddress: '',
  // Inland delivery fields
  requireInlandDelivery: false,
  finalDeliveryAddress: '',
  finalDeliveryCity: '',
  finalDeliveryPostalCode: '',
  finalDeliveryCountry: '',
    selectedForwarders: [],
    documents: [],
    palletizedCargo: null,
    exporterId: 'e0912188-4fbd-415e-b5a7-19b35cfbab42'
  });
  const [freightForwarders, setFreightForwarders] = useState([]);
  const [isLoadingForwarders, setIsLoadingForwarders] = useState(false);

  const router = useRouter();

  const handleInputChange = (field, value) => {
    if (field === 'isUrgent') {
      setOrderData(prevData => ({ 
        ...prevData, 
        [field]: value 
      }));
      return;
    }

    if (field === 'quotationDeadline' || field === 'cargoReadyDate') {
      setOrderData(prevData => ({ 
        ...prevData, 
        [field]: value ? new Date(value) : null 
      }));
      return;
    }

    setOrderData(prevData => ({ ...prevData, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one freight forwarder is selected
    if (!orderData.selectedForwarders || orderData.selectedForwarders.length === 0) {
      toast.error("Please select at least one freight forwarder to create the order");
      return;
    }
    
    const formData = new FormData();

    try {
      const orderDetails = {};
      if (orderData.shipmentType === 'AIR') {
        if (orderData.cargoType === 'loose') {
          orderDetails.grossWeight = orderData.grossWeight;
          orderDetails.chargeableWeight = orderData.chargeableWeight;
        } else if (orderData.cargoType === 'palletised') {
          orderDetails.palletizedCargo = orderData.palletizedCargo;
        }
      } else if (orderData.shipmentType === 'SEA') {
        if (orderData.loadType === 'FCL') {
          orderDetails.containerType = orderData.containerType;
        } else if (orderData.loadType === 'LCL') {
          orderDetails.palletCBM = orderData.palletCBM;
          orderDetails.cargoCBM = orderData.cargoCBM;
        }
      }

      // Add common fields
      if (orderData.dimensions) orderDetails.dimensions = orderData.dimensions;
      if (orderData.cargoType) orderDetails.cargoType = orderData.cargoType;

      // Build inland delivery payload
      const finalDeliveryAddress = orderData.requireInlandDelivery
        ? {
            address: orderData.finalDeliveryAddress || null,
            city: orderData.finalDeliveryCity || null,
            postal_code: orderData.finalDeliveryPostalCode || null,
          }
        : null;

      // Update the orderData structure to match the API expectations
      formData.append('orderData', JSON.stringify({
        reference_number: orderData.orderNumber,
        exporter_id: 'e0912188-4fbd-415e-b5a7-19b35cfbab42', // Make sure this is available from user context
        shipment_type: orderData.shipmentType,
        load_type: orderData.loadType,
        incoterm: orderData.incoterm,
        cargo_ready_date: orderData.cargoReadyDate,
        quotation_deadline: orderData.quotationDeadline,
        is_urgent: orderData.isUrgent || false,
        note: orderData.note || null,
        note_is_important: orderData.noteIsImportant || false,
        origin_port_id: orderData.originPort,
        destination_port_id: orderData.destinationPort,
        order_details: orderDetails,
        // New inland delivery fields
        require_inland_delivery: !!orderData.requireInlandDelivery,
        final_delivery_address: finalDeliveryAddress,
        final_destination_country_code: orderData.requireInlandDelivery ? (orderData.finalDeliveryCountry || null) : null,
      }));

      formData.append('selectedForwarderIds', JSON.stringify(orderData.selectedForwarders));

      // Update document handling
      const documentMetadata = orderData.documents.map(doc => ({
        title: doc.title,
        description: doc.description || '',
        metadata: doc.metadata || {}
      }));

      orderData.documents.forEach((doc, index) => {
        formData.append('documents', doc.file);
      });
      formData.append('documentMetadata', JSON.stringify(documentMetadata));

      toast.promise(
        fetch('/api/orders/new', {
          method: 'POST',
          body: formData,
        }), 
        {
          loading: 'Creating order...',
          success: async (response) => {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to create order');
            }
            const result = await response.json();
            const order = result.data.order;
            router.push(`/orders/${order.id}`);
            return `Order successfully created with ID: ${order.id}`;
          },
          error: (error) => error.message || "Failed to create order. Please try again."
        }
      );
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.message || "Failed to create order");
    }
  };

  const handlePalletizedCargoChange = useCallback((palletizedCargoData) => {
    setOrderData(prevData => ({
      ...prevData,
      palletizedCargo: palletizedCargoData,
      grossWeight: palletizedCargoData.totalGrossWeight,
      chargeableWeight: palletizedCargoData.totalChargeableWeight
    }));
  }, []);

  const fetchFreightForwarders = useCallback(async (shipmentType) => {
    try {
      setIsLoadingForwarders(true);
      const params = new URLSearchParams({
        status: 'ACTIVE',
        services: shipmentType || '',
      });
      
      const response = await fetch(`/api/freight-forwarders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch forwarders');
      
      const data = await response.json();
      setFreightForwarders(data);
      // By default, select all loaded forwarders. Users can customize afterwards via UI toggles.
      setOrderData(prev => ({
        ...prev,
        selectedForwarders: Array.isArray(data) ? data.map(f => f.id) : []
      }));
    } catch (error) {
      console.error('Error fetching freight forwarders:', error);
      toast.error("Failed to load freight forwarders");
    } finally {
      setIsLoadingForwarders(false);
    }
  }, []);

  useEffect(() => {
    if (orderData.shipmentType) {
      fetchFreightForwarders(orderData.shipmentType);
    }
  }, [orderData.shipmentType, fetchFreightForwarders]);

  // Render form sections based on configuration
  const renderFormSections = () => {
    return formConfig({ orderData }).map((section, index) => (
      <div key={index} className="space-y-6">
        <h3 className="text-lg font-semibold">{section.section}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.fields.map((field) => {
            // Check if the field should be shown based on dependencies
            const shouldShow = !field.showIf || Object.entries(field.showIf).every(
              ([key, value]) => {
                if (Array.isArray(value)) {
                  // If the showIf value is an array, check if the current value is in the array
                  return value.includes(orderData[key]);
                } else {
                  // Otherwise, check for an exact match
                  return orderData[key] === value;
                }
              }
            );

            if (!shouldShow) return null;

            // Handle fields with dependencies
            let fieldOptions = field.options;
            if (field.dependsOn) {
              fieldOptions = field.options[orderData[field.dependsOn]] || [];
            }

            return (
              <DynamicFormField
                key={field.id}
                field={{ ...field, options: fieldOptions }}
                value={orderData[field.id]}
                onChange={handleInputChange}
                dependentFields={orderData}
              />
            );
          })}
        </div>
        {section.section === 'Shipment Details' && 
         orderData.shipmentType === 'AIR' && 
         orderData.cargoType === 'palletised' && (
          <PalletizedCargoDetails onChange={handlePalletizedCargoChange} />
        )}
      </div>
    ));
  };

  const handleDocumentUpload = (documentData) => {
    setOrderData(prevData => ({
      ...prevData,
      documents: [...prevData.documents, documentData]
    }));
  };

  const handleDocumentRemove = (index) => {
    setOrderData(prevData => ({
      ...prevData,
      documents: prevData.documents.filter((_, i) => i !== index)
    }));
  };


  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div>
        <h1 className="text-2xl font-bold mb-6">Create New Order</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {renderFormSections()}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Freight Forwarders</h3>
              {isLoadingForwarders ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <FreightForwarderCardSkeleton key={i} />
                  ))}
                </div>
              ) : freightForwarders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {freightForwarders.map((forwarder) => (
                    <FreightForwarderCard
                      key={forwarder.id}
                      forwarder={forwarder}
                      isSelected={orderData.selectedForwarders.includes(forwarder.id)}
                      onSelect={(checked) => {
                        const updatedForwarders = checked
                          ? [...orderData.selectedForwarders, forwarder.id]
                          : orderData.selectedForwarders.filter(id => id !== forwarder.id);
                        handleInputChange('selectedForwarders', updatedForwarders);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No freight forwarders available for the selected shipment type.
                </div>
              )}
            </div>

            {/* Document Upload Section */}
            <DocumentUploader
              documents={orderData.documents}
              onUpload={handleDocumentUpload}
              onRemove={handleDocumentRemove}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="w-full sm:w-auto"
                disabled={!orderData.selectedForwarders || orderData.selectedForwarders.length === 0}
              >
                Create Order
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </Suspense>
  );
};

export default NewOrderPage;