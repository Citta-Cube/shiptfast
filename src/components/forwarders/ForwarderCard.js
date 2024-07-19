'use client'

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, CheckCircle, Users, Package, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from 'next/link';

const ForwarderCard = ({ forwarder }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'blacklisted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage src={forwarder.logo} alt={forwarder.name} />
            <AvatarFallback className="text-lg font-bold">{forwarder.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-right">
            <div className="flex flex-row justify-center items-center	">
              <Badge variant="outline" className="capitalize mr-2">
                {forwarder.status}
              </Badge>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(forwarder.status)} ml-auto`} />
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2 truncate">{forwarder.name}</h3>
        
        <div className="flex items-center mb-4">
          <Star className="h-5 w-5 text-yellow-400 mr-1" />
          <span className="text-lg font-semibold">{forwarder.rating.toFixed(1)}</span>
          <span className="text-sm text-gray-500 ml-2">({forwarder.ordersCompleted-223})</span>
          {forwarder.isVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <CheckCircle className="h-5 w-5 text-blue-500 ml-2" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verified Forwarder</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <span>{forwarder.employees} employees</span>
          </div>
          <div className="flex items-center">
            <Package className="h-5 w-5 text-gray-400 mr-2" />
            <span>{forwarder.ordersCompleted} orders</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {forwarder.services.map(service => (
            <Badge key={service} variant="secondary" className="capitalize">
              {service}
            </Badge>
          ))}
        </div>
        
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