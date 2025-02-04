'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle, Users, Package, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from 'next/link';
import { FreightServiceTags, FreightStatusIndicator } from "@/components/forwarders/FreightMetadata";

const ForwarderCard = ({ forwarder }) => {
  const defaultIcon = 'https://via.placeholder.com/160?text=' + forwarder.name.charAt(0);

  return (
    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Avatar className="h-16 w-16 flex-shrink-0 rounded-lg">
            <AvatarImage src={forwarder.iconurl || defaultIcon} alt={forwarder.name} />
            <AvatarFallback className="text-lg font-bold">{forwarder.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-right flex-shrink-0">
            <FreightStatusIndicator 
              status={forwarder.relationship?.status} 
              showDot={true}
              size="sm"
            />
          </div>
        </div>
        
        <h3 className="text-lg font-bold mb-2 truncate" title={forwarder.name}>{forwarder.name}</h3>
        
        <div className="flex items-center mb-4">
          <Star className="h-5 w-5 text-yellow-400 mr-1 flex-shrink-0" />
          <span className="text-base font-semibold">{forwarder.average_rating?.toFixed(1) || '0.0'}</span>
          <span className="text-sm text-gray-500 ml-2">({forwarder.total_ratings || 0})</span>
          {forwarder.is_verified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <CheckCircle className="h-5 w-5 text-blue-500 ml-2 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verified Forwarder</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center min-w-0">
            <Users className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <span className="truncate" title={forwarder.email}>{forwarder.email}</span>
          </div>
          <div className="flex items-center min-w-0">
            <Package className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <span className="truncate">{forwarder.total_orders || 0} orders</span>
          </div>
        </div>
        
        <FreightServiceTags 
          services={forwarder.services}
          showIcon={false}
          size="sm"
          className="mb-4"
        />
        
        <Link href={`/forwarders/${forwarder.id}`} passHref>
          <Button variant="default" className="w-full group">
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ForwarderCard;