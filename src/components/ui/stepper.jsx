// components/ui/stepper.js
import React from 'react';
import { Check } from 'lucide-react';

export const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                index < currentStep 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : index === currentStep
                  ? 'border-primary text-primary'
                  : 'border-gray-300 text-gray-300'
              }`}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={`mt-2 text-xs ${
              index <= currentStep ? 'text-primary' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div 
              className={`flex-1 h-0.5 ${
                index < currentStep ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};