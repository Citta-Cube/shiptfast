// config/shipmentConfig.js

export const shipmentTypes = {
    air: {
      name: 'Air Freight',
      fields: [
        { key: 'airline', label: 'Airline' },
        { key: 'AWB', label: 'AWB' },
        { key: 'HAWB', label: 'HAWB' },
      ],
    },
    sea: {
      name: 'Sea Freight',
      fields: [
        { key: 'carrier', label: 'Carrier' },
        { key: 'vessel', label: 'Vessel' },
        { key: 'DTHC', label: 'DTHC', format: (value) => `$${value}` },
        { key: 'freeTime', label: 'Free Time' },
      ],
    },
  };
  
  export const sortOptions = [
    { value: 'price', label: 'Price' },
    { value: 'time', label: 'Est. Time' },
    { value: 'rating', label: 'Rating' },
  ];
  
  export const tableColumns = [
    { key: 'agent', label: 'Agent' },
    { key: 'rating', label: 'Rating' },
    { key: 'price', label: 'Price' },
    { key: 'estimatedTime', label: 'Est. Time' },
    { key: 'route', label: 'Route' },
    { key: 'actions', label: 'Actions', align: 'right' },
  ];