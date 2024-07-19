// components/SelectField.js
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SelectField = ({ label, id, value, onChange, options }) => (
  <div className="flex flex-col space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    <Select value={value} onValueChange={(value) => onChange(id, value)}>
      <SelectTrigger id={id} className="mt-1">
        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default SelectField;