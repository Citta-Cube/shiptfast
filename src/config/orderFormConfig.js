import { Plane, Ship, Container, Boxes } from 'lucide-react';

export const formConfig = ({ orderData }) => [
    { section: 'Basic Info', fields: [
      { id: 'orderNumber', label: 'Order Number', type: 'input', placeholder: 'Enter order number' },
      { 
        id: 'shipmentType', 
        label: 'Shipment Type', 
        type: 'selectWithIcons', 
        options: [
          { 
            value: "AIR", 
            label: "Air Freight", 
            icon: <Plane className="size-5" />,
            description: "Fast shipping for time-sensitive cargo"
          },
          { 
            value: "SEA", 
            label: "Sea Freight", 
            icon: <Ship className="size-5" />,
            description: "Cost-effective for large volume shipments"
          },
        ]
      },
      { 
        id: 'loadType', 
        label: 'Load Type', 
        type: 'selectWithIcons', 
        dependsOn: 'shipmentType', 
        options: {
          'SEA': [
            { 
              value: "FCL", 
              label: "Full Container Load (FCL)", 
              icon: <Container className="size-5" />,
              description: "Exclusive use of an entire container"
            },
            { 
              value: "LCL", 
              label: "Less than Container Load (LCL)", 
              icon: <Boxes className="size-5" />,
              description: "Share container space with other shipments"
            },
          ],
          'AIR': [
            { 
              value: "LCL", 
              label: "Less than Container Load (LCL)", 
              icon: <Boxes className="size-5" />,
              description: "Partial use of aircraft cargo space"
            }
          ]
        }
      },
      { id: 'incoterm', label: 'Incoterm', type: 'select', options: [
        { value: "FOB", label: "FOB" },
        { value: "CFR", label: "CFR" },
        { value: "CIF", label: "CIF" },
        { value: "CIP", label: "CIP" },
        { value: "DPU", label: "DPU" },
        { value: "DAP", label: "DAP" },
        { value: "DDP", label: "DDP" },
      ]},
      { id: 'cargoReadyDate', label: 'Cargo Ready Date', type: 'date' },
      { id: 'quotationDeadline', label: 'Quotation Deadline', type: 'date' },
      { 
        id: 'isUrgent', 
        label: 'Mark as Urgent', 
        type: 'checkbox',
        description: 'Will notify all selected forwarders immediately'
      },
    ]},
    { section: 'Port Selection', fields: [
      { id: 'originPort', label: 'Origin Port', type: 'portSelect', shipmentType: orderData.shipmentType },
      { id: 'destinationPort', label: 'Destination Port', type: 'portSelect', shipmentType: orderData.shipmentType },
    ]},
    { section: 'Shipment Details', fields: [
        { id: 'cargoType', label: 'Cargo Type', type: 'select', options: [
            { value: "loose", label: "Loose" },
            { value: "palletised", label: "Palletised" },
        ], showIf: { shipmentType: 'AIR' } },
        { id: 'grossWeight', label: 'Gross Weight (kg)', type: 'input', inputType: 'number', showIf: { shipmentType: 'AIR', cargoType: 'loose' } },
        { id: 'chargeableWeight', label: 'Chargeable Weight (kg)', type: 'input', inputType: 'number', showIf: { shipmentType: 'AIR', cargoType: 'loose' } },
        { id: 'hsCode', label: 'HS Code', type: 'input', placeholder: 'Enter HS Code', showIf: { cargoType: 'loose', incoterm: ['DDP', 'DAP', 'CPT', 'CIP', 'DPU'] }},
        { id: 'mcQuantity', label: 'Master Case Quantity', type: 'input', inputType: 'number', showIf: { cargoType: 'loose' } },
        { id: 'containerType', label: 'Container Type', type: 'select', options: [
            { value: "20", label: "20'" },
            { value: "40", label: "40'" },
            { value: "40HC", label: "40' HC" },
        ], showIf: { shipmentType: 'SEA', loadType: 'FCL' } },
        { id: 'palletCBM', label: 'Pallet CBM', type: 'input', inputType: 'number', showIf: { shipmentType: 'SEA', loadType: 'LCL' } },
        { id: 'cargoCBM', label: 'Cargo CBM', type: 'input', inputType: 'number', showIf: { shipmentType: 'SEA', loadType: 'LCL' } },
        { id: 'deliveryAddress', label: 'Delivery Address', type: 'textarea', placeholder: 'Enter delivery address', showIf: { incoterm: ['DDP', 'DAP', 'CPT', 'CIP', 'DPU'] } },
    ]},
];