import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TransitRoute = ({ origin, destination, transshipmentPorts }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">{origin}</span>
      {transshipmentPorts && transshipmentPorts.map((port_sequence, index) => (
        <React.Fragment key={index}>
          <span className="text-sm">→</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="text-sm font-medium">{port_sequence.port.port_code}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{port_sequence.port.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </React.Fragment>
      ))}
      <span className="text-sm">→</span>
      <span className="text-sm font-medium">{destination}</span>
    </div>
  );
};

export default TransitRoute;