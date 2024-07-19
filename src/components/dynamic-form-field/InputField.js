// components/InputField.js
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const InputField = ({ label, id, value, onChange, type = "text", placeholder = "" }) => (
  <div className="flex flex-col space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      placeholder={placeholder}
      className="mt-1"
    />
  </div>
);

export default InputField;
