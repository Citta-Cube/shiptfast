import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight } from 'lucide-react';

const TransitRoute = ({ origin, destination, transshipmentPorts }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center justify-center rounded-md bg-secondary px-2 py-1">
        <span className="text-sm font-medium">{origin}</span>
      </div>
      
      {transshipmentPorts && transshipmentPorts.length > 0 && transshipmentPorts.map((port_sequence, index) => (
        <React.Fragment key={index}>
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center rounded-md border border-dashed px-2 py-1">
                  <span className="text-sm font-medium">
                    {port_sequence.port?.port_code || "..."}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{port_sequence.port?.name || "Select a port"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </React.Fragment>
      ))}
      
      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex items-center justify-center rounded-md bg-secondary px-2 py-1">
        <span className="text-sm font-medium">{destination}</span>
      </div>
    </div>
  );
};

export default TransitRoute; 