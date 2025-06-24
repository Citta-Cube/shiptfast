'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, PlusIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

// Default fields for each shipment/load type
const DEFAULT_FCL_FIELDS = [
  { key: 'containerCount', label: 'Container Count', required: true },
  { key: 'containerSize', label: 'Container Size (ft)', required: true, options: ['20', '40', '40HC', '45'] },
  { key: 'vesselName', label: 'Vessel Name' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'DTHC', label: 'DTHC (USD)' },
  { key: 'THC', label: 'THC (USD)' },
];

const DEFAULT_LCL_FIELDS = [
  { key: 'minimumCBM', label: 'Minimum CBM', required: true },
  { key: 'ratePerCBM', label: 'Rate per CBM (USD)', required: true },
  { key: 'vesselName', label: 'Vessel Name' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'DTHC', label: 'DTHC (USD)' },
  { key: 'THC', label: 'THC (USD)' },
];

const DEFAULT_AIR_FIELDS = [
  { key: 'volumeWeight', label: 'Volume Weight (kg)', required: true },
  { key: 'chargeableWeight', label: 'Chargeable Weight (kg)', required: true },
  { key: 'airline', label: 'Airline' },
  { key: 'aircraftType', label: 'Aircraft Type' },
  { key: 'FSC', label: 'Fuel Surcharge (USD)' },
  { key: 'SSC', label: 'Security Surcharge (USD)' },
];

// Fields that are managed by the parent form
const SKIP_KEYS = ["containerCount", "containerSize", "minimumCBM", "ratePerCBM", 
                   "volumeWeight", "chargeableWeight"];

const AdditionalDetailsField = ({ 
  details = {}, 
  onChange, 
  shipmentType, 
  loadType 
}) => {
  // Form state for adding new fields
  const [fieldKey, setFieldKey] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [fieldError, setFieldError] = useState('');
  
  // Main details state
  const [additionalDetails, setAdditionalDetails] = useState({});
  const [initialized, setInitialized] = useState(false);

  // Initialize fields based on shipment and load type
  useEffect(() => {
    if (!initialized) {
      // Start with existing details
      let defaultFields = {};
      
      // Apply default fields based on shipment and load type
      if (shipmentType === 'SEA') {
        if (loadType === 'FCL') {
          DEFAULT_FCL_FIELDS.forEach(field => {
            if (!SKIP_KEYS.includes(field.key)) {
              defaultFields[field.key] = details[field.key] || '';
            }
          });
        } else if (loadType === 'LCL') {
          DEFAULT_LCL_FIELDS.forEach(field => {
            if (!SKIP_KEYS.includes(field.key)) {
              defaultFields[field.key] = details[field.key] || '';
            }
          });
        }
      } else if (shipmentType === 'AIR') {
        DEFAULT_AIR_FIELDS.forEach(field => {
          if (!SKIP_KEYS.includes(field.key)) {
            defaultFields[field.key] = details[field.key] || '';
          }
        });
      }
      
      // Add any custom fields from details that aren't in our default lists
      Object.keys(details).forEach(key => {
        if (!defaultFields[key] && !SKIP_KEYS.includes(key)) {
          defaultFields[key] = details[key];
        }
      });
      
      setAdditionalDetails(defaultFields);
      setInitialized(true);
      
      // Notify parent of initial values
      if (onChange) {
        onChange(defaultFields);
      }
    }
  }, [shipmentType, loadType, details, onChange, initialized]);

  // Add a new custom field
  const handleAddField = () => {
    // Validate field key
    if (!fieldKey.trim()) {
      setFieldError('Field name is required');
      return;
    }
    
    // Convert to camelCase
    const camelCaseKey = fieldKey
      .trim()
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, (_, c) => c.toLowerCase());
    
    // Check if field already exists
    if (additionalDetails[camelCaseKey]) {
      setFieldError('Field already exists');
      return;
    }
    
    // Add the new field
    const updatedDetails = {
      ...additionalDetails,
      [camelCaseKey]: fieldValue
    };
    
    // Update state
    setAdditionalDetails(updatedDetails);
    
    // Reset form
    setFieldKey('');
    setFieldValue('');
    setFieldError('');
    
    // Notify parent
    if (onChange) {
      onChange(updatedDetails);
    }
    
    toast.success('Field added successfully');
  };

  // Update value of an existing field
  const handleDetailChange = (key, value) => {
    const updatedDetails = {
      ...additionalDetails,
      [key]: value
    };
    
    setAdditionalDetails(updatedDetails);
    
    // Notify parent
    if (onChange) {
      onChange(updatedDetails);
    }
  };

  // Remove a custom field
  const handleRemoveField = (key) => {
    // Create a copy of the details object
    const newDetails = { ...additionalDetails };
    
    // Remove the field
    delete newDetails[key];
    
    // Update state
    setAdditionalDetails(newDetails);
    
    // Notify parent
    if (onChange) {
      onChange(newDetails);
    }
    
    toast.success('Field removed successfully');
  };

  // Determine if a field is a default field based on shipment and load type
  const isDefaultField = (key) => {
    let defaultFields = [];
    
    if (shipmentType === 'SEA') {
      if (loadType === 'FCL') {
        defaultFields = DEFAULT_FCL_FIELDS.map(field => field.key);
      } else if (loadType === 'LCL') {
        defaultFields = DEFAULT_LCL_FIELDS.map(field => field.key);
      }
    } else if (shipmentType === 'AIR') {
      defaultFields = DEFAULT_AIR_FIELDS.map(field => field.key);
    }
    
    return defaultFields.includes(key);
  };

  // Get label for a field key
  const getFieldLabel = (key) => {
    // Try to find in default field lists
    const allDefaultFields = [...DEFAULT_FCL_FIELDS, ...DEFAULT_LCL_FIELDS, ...DEFAULT_AIR_FIELDS];
    const found = allDefaultFields.find(field => field.key === key);
    
    if (found) {
      return found.label;
    }
    
    // If not found, convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Additional Details</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Add additional details relevant to your quote</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Existing Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(additionalDetails).map(key => (
          <div key={key} className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor={key}>{getFieldLabel(key)}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={key}
                  value={additionalDetails[key]}
                  onChange={(e) => handleDetailChange(key, e.target.value)}
                  placeholder={`Enter ${getFieldLabel(key)}`}
                />
                {!isDefaultField(key) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveField(key)}
                    className="flex-shrink-0"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Custom Field Form */}
      <Card className="border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Add Custom Field</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fieldKey">Field Name</Label>
              <Input
                id="fieldKey"
                value={fieldKey}
                onChange={(e) => {
                  setFieldKey(e.target.value);
                  setFieldError('');
                }}
                placeholder="e.g. Transit Port Fee"
              />
              {fieldError && (
                <p className="text-xs text-destructive">{fieldError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldValue">Value</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="fieldValue"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="e.g. 250"
                />
                <Button
                  type="button" 
                  size="sm"
                  onClick={handleAddField}
                  className="flex-shrink-0"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdditionalDetailsField; 