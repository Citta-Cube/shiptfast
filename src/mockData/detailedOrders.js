// @/mockData/detailedOrders.js
export const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'open',
    shipmentDate: '2024-08-15',
    shipmentType: 'sea',
    loadType: 'FCL',
    startPort: 'Shanghai',
    endPort: 'Los Angeles',
    originPort: "CNSHA",
    originCountryCode: "CN",
    destinationPort: "USLA",
    destinationCountryCode: "US",
    incoterm: 'FOB',
    containerType: '40\'',
    documents: [
      { name: 'Invoice.pdf', url: '/mock-url/invoice.pdf' },
      { name: 'Packing List.pdf', url: '/mock-url/packing-list.pdf' }
    ],
    quotations: [
      {
        agentId: 'agent1',
        rating: 3.8,
        agentCompany: 'Fast Shipping Co.',
        price: 2500,
        estimatedTime: 25,
        amendments: 1,
        transhipmentPorts: [
          { port: 'Singapore', estimatedTime: '2 days' },
          { port: 'Panama', estimatedTime: '1 day' }
        ],
        carrier: 'Maersk',
        vessel: 'Emma Maersk',
        netFreight: 2000,
        DTHC: 300,
        freeTime: '7 days'
      },
      {
        agentId: 'agent2',
        rating: 4.2,
        agentCompany: 'EcoFreight Solutions',
        price: 2300,
        estimatedTime: 28,
        amendments: 0,
        transhipmentPorts: [
          { port: 'Busan', estimatedTime: '1 day' }
        ],
        carrier: 'MSC',
        vessel: 'MSC Oscar',
        netFreight: 1800,
        DTHC: 250,
        freeTime: '5 days'
      }
    ],
    timeline: [
      { type: 'Order Created', content: 'Order was created', date: '2024-07-01T10:00:00Z' },
      { type: 'Bidding Opened', content: 'Bidding opened for freight agents', date: '2024-07-02T09:00:00Z' }
    ]
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    status: 'pending',
    shipmentDate: '2024-09-01',
    shipmentType: 'air',
    loadType: 'LCL',
    startPort: 'Hong Kong',
    endPort: 'Paris',
    originPort: "HKHKG",
    originCountryCode: "HK",
    destinationPort: "FRGAU",
    destinationCountryCode: "FR",
    incoterm: 'CIF',
    grossWeight: 500,
    chargeableWeight: 600,
    dimensions: '100x80x120',
    cargoType: 'Palletized',
    documents: [
      { name: 'Air Waybill.pdf', url: '/mock-url/air-waybill.pdf' }
    ],
    quotations: [
      {
        agentId: 'agent3',
        rating: 4.5,
        agentCompany: 'Swift Air Cargo',
        price: 3500,
        estimatedTime: 3,
        amendments: 2,
        transhipmentPorts: [
          { port: 'Dubai', estimatedTime: '6 hours' }
        ],
        airline: 'Lufthansa',
        AWB: 'AWB123456',
        HAWB: 'HAWB789012'
      },
      {
        agentId: 'agent4',
        rating: 3.1,
        agentCompany: 'Global Air Express',
        price: 3800,
        estimatedTime: 2,
        amendments: 0,
        transhipmentPorts: [],
        airline: 'Emirates',
        AWB: 'AWB654321',
        HAWB: 'HAWB098765'
      }
    ],
    timeline: [
      { type: 'Order Created', content: 'Order was created', date: '2024-08-01T14:30:00Z' },
      { type: 'Bidding Closed', content: 'Bidding closed for freight agents', date: '2024-08-10T18:00:00Z' }
    ]
  }
];