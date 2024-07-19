'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DynamicFormField from "@/components/dynamic-form-field/DynamicFormField";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Star, Upload, X, CheckCircle, Plane, Ship, Box, Boxes, Container } from 'lucide-react';


const FreightForwarderCard = ({ forwarder, isSelected, onSelect }) => {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Checkbox
              id={`ff-${forwarder.id}`}
              checked={isSelected}
              onCheckedChange={onSelect}
              className="h-5 w-5"
            />
            <Avatar className="h-10 w-10">
              <AvatarImage src={forwarder.logo} alt={forwarder.name} />
              <AvatarFallback>{forwarder.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold truncate mr-2">{forwarder.name}</h3>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">{forwarder.rating.toFixed(1)}</span>
                  <Star className="h-4 w-4 text-yellow-400" />
                  {forwarder.isVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Verified Forwarder</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {forwarder.services.map(service => (
                  <Badge key={service} variant="secondary" className="capitalize text-xs px-2 py-0.5">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
};    

const DocumentUploader = ({ documents, onUpload, onRemove }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-opacity-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">PDF, PNG, JPG or DOCX (MAX. 10MB)</p>
          </div>
          <input id="dropzone-file" type="file" className="hidden" multiple onChange={onUpload} />
        </label>
      </div>
      {documents.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold mb-2">Uploaded Documents:</h4>
          <ul className="space-y-2">
            {documents.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
);


// Main component
const NewOrderPage = () => {
  const [orderData, setOrderData] = useState({
    orderNumber: '',
    shipmentType: '',
    loadType: '',
    incoterm: '',
    cargoReadyDate: null,
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
    documents: []
  });


  const handleInputChange = (field, value) => {
    setOrderData(prevData => ({ ...prevData, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(orderData);
    // Submit order data to API and handle response
  };

  // Mock data for ports and freight forwarders (in a real app, fetch from API)
  const ports = [
    { code: "CNSHA", name: "Shanghai", country: "China", countryCode: "CN" },
    { code: "USLA", name: "Los Angeles", country: "United States", countryCode: "US" },
  ];

  const freightForwarders = [
    { id: 1, name: "Global Logistics", rating: 4.5, services: ["air", "sea"], isVerified: true },
    { id: 2, name: "SeaWay Express", rating: 4.2, services: ["sea"], isVerified: false },
    { id: 3, name: "AirCargo Solutions", rating: 4.8, services: ["air"], isVerified: true },
  ];

  // Configuration for form fields
  const formConfig = [
    { section: 'Basic Info', fields: [
      { id: 'orderNumber', label: 'Order Number', type: 'input', placeholder: 'Enter order number' },
      { 
        id: 'shipmentType', 
        label: 'Shipment Type', 
        type: 'selectWithIcons', 
        options: [
          { 
            value: "air", 
            label: "Air Freight", 
            icon: <Plane className="size-5" />,
            description: "Fast shipping for time-sensitive cargo"
          },
          { 
            value: "sea", 
            label: "Sea Freight", 
            icon: <Ship className="size-5" />,
            description: "Cost-effective for large volume shipments"
          },
        ]
      },
      { 
        id: 'loadType', 
        label: 'Load Type', 
        type: 'selectWithIcons', 
        dependsOn: 'shipmentType', 
        options: {
          'sea': [
            { 
              value: "FCL", 
              label: "Full Container Load (FCL)", 
              icon: <Container className="size-5" />,
              description: "Exclusive use of an entire container"
            },
            { 
              value: "LCL", 
              label: "Less than Container Load (LCL)", 
              icon: <Boxes className="size-5" />,
              description: "Share container space with other shipments"
            },
          ],
          'air': [
            { 
              value: "LCL", 
              label: "Less than Container Load (LCL)", 
              icon: <Boxes className="size-5" />,
              description: "Partial use of aircraft cargo space"
            }
          ]
        }
      },
      { id: 'incoterm', label: 'Incoterm', type: 'select', options: [
        { value: "EXW", label: "EXW" },
        { value: "FOB", label: "FOB" },
        { value: "CIF", label: "CIF" },
        { value: "DAP", label: "DAP" },
        { value: "DDP", label: "DDP" },
      ]},
      { id: 'cargoReadyDate', label: 'Cargo Ready Date', type: 'date' },
    ]},
    { section: 'Port Selection', fields: [
      { id: 'originPort', label: 'Origin Port', type: 'portSelect', ports: ports },
      { id: 'destinationPort', label: 'Destination Port', type: 'portSelect', ports: ports },
    ]},
    { section: 'Shipment Details', fields: [
        { id: 'cargoType', label: 'Cargo Type', type: 'select', options: [
            { value: "loose", label: "Loose" },
            { value: "palletised", label: "Palletised" },
        ], showIf: { shipmentType: 'air' } },
        { id: 'grossWeight', label: 'Gross Weight (kg)', type: 'input', inputType: 'number', showIf: { shipmentType: 'air' } },
        { id: 'chargeableWeight', label: 'Chargeable Weight (kg)', type: 'input', inputType: 'number', showIf: { shipmentType: 'air' } },
        { id: 'dimensions', label: 'Dimensions (LxWxH)', type: 'input', placeholder: 'e.g., 100x80x120', showIf: { shipmentType: 'air' } },
        { id: 'containerType', label: 'Container Type', type: 'select', options: [
            { value: "20", label: "20'" },
            { value: "40", label: "40'" },
            { value: "40HC", label: "40' HC" },
        ], showIf: { shipmentType: 'sea', loadType: 'FCL' } },
        { id: 'palletCBM', label: 'Pallet CBM', type: 'input', inputType: 'number', showIf: { shipmentType: 'sea', loadType: 'LCL' } },
        { id: 'cargoCBM', label: 'Cargo CBM', type: 'input', inputType: 'number', showIf: { shipmentType: 'sea', loadType: 'LCL' } },
        { id: 'deliveryAddress', label: 'Delivery Address', type: 'textarea', placeholder: 'Enter delivery address' },
    ]},
  ];

  // Render form sections based on configuration
  const renderFormSections = () => {
    return formConfig.map((section, index) => (
      <div key={index} className="space-y-6">
        <h3 className="text-lg font-semibold">{section.section}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.fields.map((field) => {
            // Check if the field should be shown based on dependencies
            const shouldShow = !field.showIf || Object.entries(field.showIf).every(
              ([key, value]) => orderData[key] === value
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
      </div>
    ));
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    setOrderData(prevData => ({
      ...prevData,
      documents: [...prevData.documents, ...files]
    }));
  };

  const handleDocumentRemove = (index) => {
    setOrderData(prevData => ({
      ...prevData,
      documents: prevData.documents.filter((_, i) => i !== index)
    }));
  };


  return (
    <div>
        <h1 className="text-2xl font-bold mb-6">Create New Order</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {renderFormSections()}

            {/* Freight Forwarder Selection Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Freight Forwarders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {freightForwarders
                  .filter(ff => ff.services.includes(orderData.shipmentType))
                  .map((forwarder) => (
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
            </div>

            {/* Document Upload Section */}
            <DocumentUploader
              documents={orderData.documents}
              onUpload={handleDocumentUpload}
              onRemove={handleDocumentRemove}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" className="w-full sm:w-auto">
                Create Order
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewOrderPage;