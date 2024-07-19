// components/dynamic-form-field/SelectWithIconsField.js
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SelectWithIconsField = ({ label, id, value, onChange, options }) => (
  <div className="flex flex-col space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    <Select value={value} onValueChange={(value) => onChange(id, value)}>
      <SelectTrigger id={id} className="items-start [&_[data-description]]:hidden">
        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-start gap-3 text-muted-foreground">
              {option.icon}
              <div className="grid gap-0.5">
                <p>
                  <span className="font-medium text-foreground">{option.label}</span>
                </p>
                {option.description && (
                  <p className="text-xs" data-description>
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default SelectWithIconsField;