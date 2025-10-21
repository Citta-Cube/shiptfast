// utils/csvExport.js

export const exportToCSV = (quotations, order) => {
    const sortedQuotations = [...quotations].sort((a, b) => a.net_freight_cost - b.net_freight_cost);
    const headers = ["Agent", "Rating", "Price", "Estimated Time", "Route", "Status"];
    const rows = sortedQuotations.map(q => {
      // Check if this quote is the selected one
      const isSelected = q.id === order.selected_quote_id;
      
      return [
        q.companies.name,
        q.companies.average_rating ? q.companies.average_rating.toFixed(1) : 'N/A',
        `$${q.net_freight_cost.toFixed(2)}`,
        `${q.estimated_time_days} days`,
        `${order.origin_port.name.replace(/,/g, '')} -> ${q.transshipment_ports.length > 0 ? q.transshipment_ports.map(p => p.port.name.replace(/,/g, '')).join(' -> ') + ' -> ' : ''}${order.destination_port.name.replace(/,/g, '')}`,
        isSelected ? 'SELECTED' : 'AVAILABLE'
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${order.reference_number}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
};

export const exportToPDF = (quotations, order) => {
    const sortedQuotations = [...quotations].sort((a, b) => a.net_freight_cost - b.net_freight_cost);
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotations Report - ${order.reference_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .order-info {
              margin-bottom: 30px;
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
            }
            .order-info h3 {
              margin-top: 0;
              color: #2563eb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #2563eb;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .selected {
              background-color: #dcfce7 !important;
              font-weight: bold;
            }
            .status-selected {
              color: #16a34a;
              font-weight: bold;
            }
            .status-available {
              color: #6b7280;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Freight Quotations Report</h1>
            <h2>Order Reference: ${order.reference_number}</h2>
          </div>
          
          <div class="order-info">
            <h3>Order Details</h3>
            <p><strong>Origin:</strong> ${order.origin_port.name}</p>
            <p><strong>Destination:</strong> ${order.destination_port.name}</p>
            <p><strong>Shipment Type:</strong> ${order.shipment_type}</p>
            <p><strong>Load Type:</strong> ${order.load_type}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Rating</th>
                <th>Price</th>
                <th>Estimated Time</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sortedQuotations.map(q => {
                const isSelected = q.id === order.selected_quote_id;
                const route = `${order.origin_port.name} -> ${q.transshipment_ports.length > 0 ? q.transshipment_ports.map(p => p.port.name).join(' -> ') + ' -> ' : ''}${order.destination_port.name}`;
                
                return `
                  <tr class="${isSelected ? 'selected' : ''}">
                    <td>${q.companies.name}</td>
                    <td>${q.companies.average_rating ? q.companies.average_rating.toFixed(1) : 'N/A'}</td>
                    <td>$${q.net_freight_cost.toFixed(2)}</td>
                    <td>${q.estimated_time_days} days</td>
                    <td>${route}</td>
                    <td class="${isSelected ? 'status-selected' : 'status-available'}">
                      ${isSelected ? 'SELECTED' : 'AVAILABLE'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p>Total quotations: ${sortedQuotations.length}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close the window after printing (optional)
        // printWindow.close();
      }, 500);
    };
};