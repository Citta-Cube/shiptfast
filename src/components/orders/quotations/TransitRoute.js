import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TransitRoute = ({ order, quotation }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">{order.originPort}</span>
      {quotation.transhipmentPorts && quotation.transhipmentPorts.map((port, index) => (
        <React.Fragment key={index}>
          <span className="text-sm">→</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="text-sm font-medium">{port.port}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated Time: {port.estimatedTime}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </React.Fragment>
      ))}
      <span className="text-sm">→</span>
      <span className="text-sm font-medium">{order.destinationPort}</span>
    </div>
  );
};

export default TransitRoute;