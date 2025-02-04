import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDateTimeToReadable(date, format = 'long') {
  const options = format === 'short' ? {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric', 
    hour: '2-digit',
    minute: '2-digit'
  } : {
    year: 'numeric', 
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return new Date(date).toLocaleDateString('en-US', options);
}

export function formatKeyToReadable(key) {
  return key
    // Split by underscore or camelCase
    .split(/(?=[A-Z])|_/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}