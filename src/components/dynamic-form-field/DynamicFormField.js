// src/components/dynamic-form-field/DynamicFormField.js
import React from 'react';
import InputField from './InputField';
import SelectField from './SelectField';
import DatePickerField from './DatePickerField';
import PortSelect from './PortSelect';
import TextareaField from './TextareaField';
import SelectWithIconsField from './SelectWithIconsField';
import CheckboxField from './CheckboxField';

const DynamicFormField = ({ field, value, onChange, dependentFields }) => {
  switch (field.type) {
    case 'input':
      return <InputField {...field} value={value} onChange={onChange} />;
    case 'select':
      return <SelectField {...field} value={value} onChange={onChange} />;
    case 'selectWithIcons':
      return <SelectWithIconsField {...field} value={value} onChange={onChange} />;
    case 'date':
      return <DatePickerField {...field} value={value} onChange={onChange} />;
    case 'portSelect':
      return <PortSelect {...field} value={value} onChange={onChange} />;
    case 'textarea':
      return <TextareaField {...field} value={value} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxField {...field} checked={value} onCheckedChange={(checked) => onChange(field.id, checked)} />;
    default:
      return null;
  }
};

export default DynamicFormField;