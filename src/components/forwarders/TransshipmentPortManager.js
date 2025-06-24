'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, PlusIcon, XIcon, ArrowRightIcon, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PortSelect from '@/components/dynamic-form-field/PortSelect';

// Single sortable transshipment port item
const SortablePort = ({ port, index, onRemove, shipmentType }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: port.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center space-x-2 p-2 border rounded-md bg-background shadow-sm"
    >
      <div className="cursor-move" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="truncate font-medium">
          {port.port?.name || port.portName || "Port Name Pending..."}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {port.port?.port_code || port.portCode || "Port Code Pending..."}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(port.id)}
          className="h-8 w-8"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const TransshipmentPortManager = ({ 
  transshipmentPorts = [], 
  onChange, 
  originPort, 
  destinationPort,
  shipmentType,
  orderId,
  quoteId
}) => {
  // Simplify state management
  const [ports, setPorts] = useState([]);
  const [selectedPortId, setSelectedPortId] = useState('');
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [portDetails, setPortDetails] = useState(null);
  
  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );
  
  // Initialize ports from props once
  useEffect(() => {
    if (!initialized && transshipmentPorts.length > 0) {
      const initialPorts = transshipmentPorts.map(tp => ({
        id: tp.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        port: tp.port,
        portId: tp.port?.id || tp.port_id,
        portName: tp.port?.name,
        portCode: tp.port?.port_code,
        sequenceNumber: tp.sequence_number || 0
      }));
      
      // Sort ports by sequence number
      const sortedPorts = [...initialPorts].sort((a, b) => 
        (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
      );
      
      setPorts(sortedPorts);
    }
    setInitialized(true);
  }, [transshipmentPorts, initialized]);
  
  // Handle port selection
  const handlePortChange = (_, portId, portDetails) => {
    setSelectedPortId(portId);
    setError('');
    
    // Store port details if provided
    if (portDetails) {
      // We'll use these details when adding a port
      setPortDetails(portDetails);
    }
  };
  
  // Handle adding a new port
  const handleAddPort = () => {
    if (!selectedPortId) {
      setError('Please select a port');
      return;
    }
    
    // Check if port is already in the list
    if (ports.some(p => p.portId === selectedPortId)) {
      setError('This port is already in the route');
      return;
    }
    
    // Calculate next sequence number
    const nextSequence = ports.length > 0 
      ? Math.max(...ports.map(p => p.sequenceNumber || 0)) + 1 
      : 1;
    
    // Create new port object
    const newPort = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portId: selectedPortId,
      port: portDetails, // Use the stored port details
      portName: portDetails?.name || '',
      portCode: portDetails?.port_code || '',
      sequenceNumber: nextSequence
    };
    
    // Add port to list
    const updatedPorts = [...ports, newPort];
    setPorts(updatedPorts);
    
    // Reset form
    setSelectedPortId('');
    setPortDetails(null);
    setError('');
    
    // Notify parent
    if (onChange) onChange(updatedPorts);
    
    toast.success('Port added to route');
  };
  
  // Handle removing a port
  const handleRemovePort = (portId) => {
    // Filter out the removed port
    const updatedPorts = ports.filter((port) => port.id !== portId);
    
    // Update sequence numbers to ensure consistency
    const resequencedPorts = updatedPorts.map((port, index) => ({
      ...port,
      sequenceNumber: index + 1
    }));
    
    setPorts(resequencedPorts);
    
    // Notify parent
    if (onChange) onChange(resequencedPorts);
    
    toast.success('Port removed from route');
  };
  
  // Handle drag end (reordering)
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = ports.findIndex((port) => port.id === active.id);
      const newIndex = ports.findIndex((port) => port.id === over.id);
      
      // Move the port in the array
      const updatedPorts = arrayMove(ports, oldIndex, newIndex);
      
      // Update sequence numbers to match new order
      const resequencedPorts = updatedPorts.map((port, index) => ({
        ...port,
        sequenceNumber: index + 1
      }));
      
      setPorts(resequencedPorts);
      
      // Notify parent
      if (onChange) onChange(resequencedPorts);
    }
  };
  
  // Rendering helper - shows a preview of the entire route
  const renderRoutePreview = () => {
    if (!originPort || !destinationPort) return null;
    
    return (
      <div className="mt-2 p-3 border rounded-md bg-muted/30">
        <div className="text-sm font-medium mb-2">Route Preview</div>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <span className="px-2 py-1 bg-primary/10 rounded-md">
            {typeof originPort === 'object' ? 
              (originPort.port_code || originPort.name) : 
              originPort}
          </span>
          
          {ports.length > 0 && (
            <>
              <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
              {ports.map((port, index) => (
                <React.Fragment key={port.id}>
                  <span className="px-2 py-1 bg-muted rounded-md">
                    {port.port?.port_code || port.portCode || "..."}
                  </span>
                  {index < ports.length - 1 && (
                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
              <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          
          <span className="px-2 py-1 bg-primary/10 rounded-md">
            {typeof destinationPort === 'object' ? 
              (destinationPort.port_code || destinationPort.name) : 
              destinationPort}
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Transshipment Ports</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Add ports where cargo will be transferred during transit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {renderRoutePreview()}
      
      {/* List of transshipment ports */}
      {ports.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext
            items={ports.map(port => port.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {ports.map((port, index) => (
                <SortablePort
                  key={port.id}
                  port={port}
                  index={index}
                  onRemove={handleRemovePort}
                  shipmentType={shipmentType}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      
      {/* Add new port */}
      <Card className="border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Add Transshipment Port</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PortSelect
              id="transshipment_port"
              label="Select Port"
              value={selectedPortId}
              onChange={handlePortChange}
              shipmentType={shipmentType}
            />
            
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            
            <Button
              type="button" 
              size="sm"
              onClick={handleAddPort}
              className="w-full"
              disabled={!selectedPortId}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add to Route
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {ports.length > 0 && (
        <div className="text-sm text-muted-foreground italic">
          Drag and drop to reorder ports based on the actual route.
        </div>
      )}
    </div>
  );
};

export default TransshipmentPortManager;