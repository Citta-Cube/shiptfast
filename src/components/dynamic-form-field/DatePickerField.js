// components/DatePickerField.js
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { format } from "date-fns";

const DatePickerField = ({ label, id, value, onChange }) => (
  <div className="flex flex-col space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className="w-full justify-start text-left font-normal mt-1"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => onChange(id, date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>
);

export default DatePickerField;