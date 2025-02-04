import { useState, useCallback, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';

export const useOrderForm = ({ freightForwarders }) => {
  const router = useRouter();
  const [orderData, setOrderData] = useState({
    orderNumber: '',
    shipmentType: '',
    loadType: '',
    incoterm: '',
    cargoReadyDate: null,
    quotationDeadline: null,
    isUrgent: false,
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
    selectedForwarders: [],
    documents: [],
    palletizedCargo: null,
  });

  const handleInputChange = useCallback((field, value) => {
    setOrderData(prevData => {
      const newData = { ...prevData, [field]: value };

      // Reset dependent fields when shipmentType changes
      if (field === 'shipmentType') {
        newData.loadType = '';
        newData.cargoType = '';
        newData.containerType = '';
        newData.grossWeight = '';
        newData.chargeableWeight = '';
        newData.palletCBM = '';
        newData.cargoCBM = '';
        newData.palletizedCargo = null;
      }

      // Reset dependent fields when loadType changes
      if (field === 'loadType') {
        newData.containerType = '';
        newData.palletCBM = '';
        newData.cargoCBM = '';
      }

      // Reset delivery address when incoterm changes
      if (field === 'incoterm' && !['DDP', 'DAP', 'CPT', 'CIP', 'DPU'].includes(value)) {
        newData.deliveryAddress = '';
      }

      return newData;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderDetails = {};
      if (orderData.shipmentType === 'air') {
        if (orderData.cargoType === 'loose') {
          orderDetails.grossWeight = orderData.grossWeight;
          orderDetails.chargeableWeight = orderData.chargeableWeight;
        } else if (orderData.cargoType === 'palletised') {
          orderDetails.palletizedCargo = orderData.palletizedCargo;
        }
      } else if (orderData.shipmentType === 'sea') {
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
      if (['DDP', 'DAP', 'CPT', 'CIP', 'DPU'].includes(orderData.incoterm)) {
        orderDetails.deliveryAddress = orderData.deliveryAddress;
      }

      formData.append('orderData', JSON.stringify({
        referenceNumber: orderData.orderNumber,
        shipmentType: orderData.shipmentType,
        loadType: orderData.loadType,
        incoterm: orderData.incoterm,
        cargoReadyDate: orderData.cargoReadyDate,
        quotationDeadline: orderData.quotationDeadline,
        isUrgent: orderData.isUrgent,
        originPortId: orderData.originPort,
        destinationPortId: orderData.destinationPort,
        orderDetails: orderDetails,
      }));
      formData.append('selectedForwarders', JSON.stringify(orderData.selectedForwarders));

       // Append document files and metadata
       const documentMetadata = [];
       orderData.documents.forEach((doc, index) => {
         formData.append('documents', doc.file);
         documentMetadata.push({
           title: doc.title,
           description: doc.description
         });
       });
       formData.append('documentMetadata', JSON.stringify(documentMetadata));

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();
      toast({
        title: "Order Created",
        description: `Order successfully created with ID: ${result.orderId}`,
      });
      router.push(`/orders/${result.orderId}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
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

  const handleDocumentUpload = useCallback((documentData) => {
    setOrderData(prevData => ({
      ...prevData,
      documents: [...prevData.documents, documentData]
    }));
  }, []);

  const handleDocumentRemove = useCallback((index) => {
    setOrderData(prevData => ({
      ...prevData,
      documents: prevData.documents.filter((_, i) => i !== index)
    }));
  }, []);

  useEffect(() => {
    if (orderData.shipmentType) {
      const relevantForwarders = freightForwarders
        .filter(ff => ff.services.includes(orderData.shipmentType))
        .map(ff => ff.id);
      setOrderData(prevData => ({
        ...prevData,
        selectedForwarders: relevantForwarders
      }));
    }
  }, [orderData.shipmentType]);

  return {
    orderData,
    handleInputChange,
    handleSubmit,
    handlePalletizedCargoChange,
    handleDocumentUpload,
    handleDocumentRemove,
  };
};

export default useOrderForm;
