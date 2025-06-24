import React, { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plane, Ship, Check, ChevronsUpDown } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { usePorts } from "@/hooks/usePorts";
import { cn } from "@/lib/utils";

const MAX_PORT_NAME_LENGTH = 30;

const truncatePortName = (name = '', maxLength) => {
  return name.length <= maxLength ? name : `${name.substring(0, maxLength)}...`;
};

const PortSelect = ({ label, id, value, onChange, shipmentType }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { ports = [], isLoading, fetchNextPage, hasNextPage } = usePorts(debouncedSearchTerm, shipmentType?.toUpperCase());

  const handleSelect = useCallback((portId) => {
    const selectedPort = ports.find(port => port.id === portId);
    onChange(id, portId, selectedPort);
    setOpen(false);
  }, [onChange, id, ports]);

  const selectedPort = ports.find(port => port.id === value);

  const renderPortItem = (port) => {
    if (!port || typeof port !== 'object') {
      console.error('Invalid port object:', port);
      return null;
    }
    return (
      <li
        key={port.id}
        className={cn(
          "flex items-center space-x-2 p-2 cursor-pointer hover:bg-accent",
          port.id === value && "bg-accent"
        )}
        onClick={() => handleSelect(port.id)}
      >
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={`https://flagcdn.com/w20/${port.country_code.toLowerCase()}.png`} />
          <AvatarFallback>{port.country_code}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-grow">
          <span className="font-medium">{truncatePortName(port.name, MAX_PORT_NAME_LENGTH)}</span>
          <span className="text-sm text-muted-foreground">{port.port_code}</span>
        </div>
        {port.service === 'AIR' && <Plane className="h-4 w-4 text-blue-500" />}
        {port.service === 'SEA' && <Ship className="h-4 w-4 text-blue-500" />}
        {port.id === value && <Check className="h-4 w-4 ml-2" />}
      </li>
    );
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {selectedPort ? (
              <div className="flex items-center">
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarImage src={`https://flagcdn.com/w20/${selectedPort.country_code.toLowerCase()}.png`} />
                  <AvatarFallback>{selectedPort.country_code}</AvatarFallback>
                </Avatar>
                {truncatePortName(selectedPort.name, MAX_PORT_NAME_LENGTH)}
              </div>
            ) : (
              "Select port..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <div className="p-2">
            <Input
              placeholder="Search ports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : ports.length === 0 ? (
            <div className="text-center p-4 text-sm text-muted-foreground">No ports found.</div>
          ) : (
            <ul className="max-h-[300px] overflow-y-auto">
              {ports.map(renderPortItem)}
            </ul>
          )}
          {hasNextPage && (
            <div className="p-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={fetchNextPage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default React.memo(PortSelect);