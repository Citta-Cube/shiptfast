// config/shipmentConfig.js

export const shipmentTypes = {
    SEA: {
      name: 'Sea Freight',
      fields: [
        { key: 'carrier', label: 'Carrier' },
        { key: 'vessel', label: 'Vessel' },
        { key: 'DTHC', label: 'DTHC', format: (value) => `$${value}` },
        { key: 'freeTime', label: 'Free Time', format: (value) => `${value} days` },
      ],
    },
    AIR: {
      name: 'Air Freight',
      fields: [
        { key: 'airline', label: 'Airline' },
        { key: 'AWB', label: 'AWB' },
        { key: 'HAWB', label: 'HAWB' },
      ],
    },
};
  
export const sortOptions = [
  { value: 'net_freight_cost', label: 'Price' },
  { value: 'estimated_time_days', label: 'Est. Time' },
  { value: 'average_rating', label: 'Rating' },
];
  
export const tableColumns = [
  { key: 'agent', label: 'Agent' },
  { key: 'rating', label: 'Rating' },
  { key: 'price', label: 'Price' },
  { key: 'estimatedTime', label: 'Est. Time' },
  { key: 'route', label: 'Route' },
  { key: 'actions', label: 'Actions', align: 'right' },
];