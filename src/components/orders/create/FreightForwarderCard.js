'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, CheckCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";


export const FreightForwarderCard = ({ forwarder, isSelected, onSelect }) => {
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
              <AvatarImage src={forwarder.iconurl} alt={forwarder.name} />
              <AvatarFallback>{forwarder.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold truncate mr-2">{forwarder.name}</h3>
                <div className="flex items-center space-x-1">
                  {forwarder.average_rating !== null && (
                    <>
                      <span className="text-sm font-medium">
                        {forwarder.average_rating.toFixed(1)}
                      </span>
                      <Star className="h-4 w-4 text-yellow-400" />
                    </>
                  )}
                  {forwarder.is_verified && (
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
                {forwarder.services?.map(service => (
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

export const FreightForwarderCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-5 w-5" /> {/* Checkbox skeleton */}
          <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar skeleton */}
          <div className="flex-grow space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" /> {/* Name skeleton */}
              <Skeleton className="h-4 w-16" /> {/* Rating skeleton */}
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16" /> {/* Badge skeleton */}
              <Skeleton className="h-5 w-16" /> {/* Badge skeleton */}
              <Skeleton className="h-5 w-16" /> {/* Badge skeleton */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};