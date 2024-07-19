// components/PortSelect.js
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const PortSelect = ({ label, id, value, onChange, ports }) => (
  <div className="flex flex-col space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    <Select value={value} onValueChange={(value) => onChange(id, value)}>
      <SelectTrigger id={id} className="mt-1">
        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {ports.map((port) => (
          <SelectItem key={port.code} value={port.code}>
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={`https://flagcdn.com/w20/${port.countryCode.toLowerCase()}.png`} />
                <AvatarFallback>{port.countryCode}</AvatarFallback>
              </Avatar>
              {port.name}, {port.country}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default PortSelect;