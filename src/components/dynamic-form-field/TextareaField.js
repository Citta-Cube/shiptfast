// components/TextareaField.js
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TextareaField = ({ label, id, value, onChange, placeholder }) => (
  <div className="col-span-full">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      placeholder={placeholder}
      className="mt-1"
    />
  </div>
);

export default TextareaField;