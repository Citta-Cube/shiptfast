'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, ArrowRightIcon, ArrowLeftIcon, DollarSignIcon, ShipIcon, FileTextIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import TransshipmentPortManager from './TransshipmentPortManager';
import AdditionalDetailsField from './AdditionalDetailsField';
import { Progress } from '@/components/ui/progress';

// Form steps
const STEPS = [
  { id: 'basic', title: 'Basic Details', icon: <DollarSignIcon className="h-4 w-4" /> },
  { id: 'route', title: 'Route Details', icon: <ShipIcon className="h-4 w-4" /> },
  { id: 'additional', title: 'Additional Details', icon: <FileTextIcon className="h-4 w-4" /> }
];

// Default additional details based on shipment type and load type
const DEFAULT_ADDITIONAL_DETAILS = {
  SEA: {
    FCL: {
      DTHC: '',
      THC: '',
      vesselName: '',
      carrier: '',
      freeTime: '',
      demurrage: '',
    },
    LCL: {
      DTHC: '',
      THC: '',
      vesselName: '',
      carrier: '',
      freeTime: '',
      originHandling: '',
      destinationHandling: '',
      consolidationFee: '',
      deconsolidationFee: '',
    }
  },
  AIR: {
    GENERAL: {
      airline: '',
      aircraftType: '',
      FSC: '',
      SSC: '',
      AWBFee: '',
      handlingFee: '',
      screeningFee: '',
      pickupFee: '',
      deliveryFee: '',
    }
  }
};

const QuoteForm = ({ 
  orderId, 
  forwarderId, 
  existingQuote = null,
  shipmentType, 
  loadType,
  originPort,
  destinationPort,
  onSuccess
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  
  // Initialize form data with existing quote or defaults
  const [formData, setFormData] = useState({
    // Basic pricing details
    netFreightCost: existingQuote?.net_freight_cost || '',
    estimatedTimeDays: existingQuote?.estimated_time_days || '',
    validityPeriodDays: existingQuote?.validity_period_days || '30',
    notes: existingQuote?.note || '',
    
    // Route details
    transshipmentPorts: existingQuote?.transshipment_ports || [],
    
    // Additional details based on shipment type
    additionalDetails: existingQuote?.quote_details || 
      (shipmentType === 'AIR' 
        ? DEFAULT_ADDITIONAL_DETAILS.AIR.GENERAL 
        : DEFAULT_ADDITIONAL_DETAILS.SEA[loadType])
  });

  // Handle input changes for basic fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle changes for additional details
  const handleAdditionalDetailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      additionalDetails: {
        ...prev.additionalDetails,
        [field]: value
      }
    }));
  };

  // Validate the current step
  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 0) {
      // Validate basic details
      if (!formData.netFreightCost) {
        newErrors.netFreightCost = 'Net freight cost is required';
      } else if (isNaN(formData.netFreightCost) || parseFloat(formData.netFreightCost) <= 0) {
        newErrors.netFreightCost = 'Net freight cost must be a positive number';
      }
      
      if (!formData.estimatedTimeDays) {
        newErrors.estimatedTimeDays = 'Estimated delivery time is required';
      } else if (isNaN(formData.estimatedTimeDays) || parseInt(formData.estimatedTimeDays) <= 0) {
        newErrors.estimatedTimeDays = 'Estimated delivery time must be a positive number';
      }
      
      if (!formData.validityPeriodDays) {
        newErrors.validityPeriodDays = 'Validity period is required';
      } else if (isNaN(formData.validityPeriodDays) || parseInt(formData.validityPeriodDays) <= 0) {
        newErrors.validityPeriodDays = 'Validity period must be a positive number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = (e) => {
    e.preventDefault(); // Prevent form submission
    
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast.error('Please correct the errors before proceeding');
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare quote details
      const quoteDetails = {
        ...formData.additionalDetails
      };
      
      // Format transshipment ports
      const formattedTransshipmentPorts = formData.transshipmentPorts.map((port, index) => ({
        port_id: port.portId,
        sequence_number: port.sequenceNumber || index + 1
      }));
      
      const quoteData = {
        orderId,
        forwarderId,
        netFreightCost: parseFloat(formData.netFreightCost),
        estimatedTimeDays: parseInt(formData.estimatedTimeDays),
        validityPeriodDays: parseInt(formData.validityPeriodDays),
        notes: formData.notes,
        quoteDetails,
        transshipmentPorts: formattedTransshipmentPorts
      };
      
      // Determine API endpoint and method
      let url = '/api/forwarders/quotes';
      let method = 'POST';
      
      if (existingQuote?.id) {
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
        router.refresh();
        if (onSuccess) onSuccess();
        toast.success('Quote submitted successfully');
      } else {
        toast.error('Failed to submit quote', {
          description: data.error || 'Something went wrong'
        });
      }
    } catch (error) {
      toast.error('An error occurred', {
        description: 'There was a problem submitting your quote'
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Details
        return (
          <div className="space-y-6">
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
                className={errors.netFreightCost ? 'border-destructive' : ''}
              />
              {errors.netFreightCost && (
                <p className="text-destructive text-sm">{errors.netFreightCost}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedTimeDays">Estimated Time (Days)*</Label>
                <Input
                  id="estimatedTimeDays"
                  name="estimatedTimeDays"
                  type="number"
                  placeholder="3"
                  min="1"
                  value={formData.estimatedTimeDays}
                  onChange={handleInputChange}
                  className={errors.estimatedTimeDays ? 'border-destructive' : ''}
                />
                {errors.estimatedTimeDays && (
                  <p className="text-destructive text-sm">{errors.estimatedTimeDays}</p>
                )}
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
                  className={errors.validityPeriodDays ? 'border-destructive' : ''}
                />
                {errors.validityPeriodDays && (
                  <p className="text-destructive text-sm">{errors.validityPeriodDays}</p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 1: // Route Details
        return (
          <div className="space-y-4">
            <TransshipmentPortManager
              transshipmentPorts={formData.transshipmentPorts}
              onChange={(ports) => setFormData(prev => ({ ...prev, transshipmentPorts: ports }))}
              originPort={originPort}
              destinationPort={destinationPort}
              shipmentType={shipmentType}
              orderId={orderId}
              quoteId={existingQuote?.id}
            />
          </div>
        );
      
      case 2: // Additional Details
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.additionalDetails).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                    {key === 'DTHC' && ' (USD)'}
                    {key === 'THC' && ' (USD)'}
                    {key === 'FSC' && ' (USD)'}
                    {key === 'SSC' && ' (USD)'}
                  </Label>
                  <Input
                    id={key}
                    name={key}
                    type={key.includes('Time') || key.includes('Fee') ? 'number' : 'text'}
                    placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').trim()}`}
                    value={value}
                    onChange={(e) => handleAdditionalDetailChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Enter any additional notes about your quote..."
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <form onSubmit={currentStep === STEPS.length - 1 ? handleSubmit : handleNextStep} className="space-y-6">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="mr-2">{step.icon}</div>
              <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      {/* Step content */}
      {renderStepContent()}
      
      {/* Navigation buttons */}
      <div className="flex justify-between pt-6">
        {currentStep > 0 && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handlePrevStep}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        
        <div className="ml-auto">
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {currentStep === STEPS.length - 1 ? (
              isSubmitting ? "Submitting..." : "Submit Quote"
            ) : (
              <>
                Next Step
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default QuoteForm; 