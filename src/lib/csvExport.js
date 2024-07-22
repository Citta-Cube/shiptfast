// utils/csvExport.js

export const exportToCSV = (quotations, order) => {
    const sortedQuotations = [...quotations].sort((a, b) => a.price - b.price);
    const headers = ["Agent", "Rating", "Price", "Price Discount", "Estimated Time", "Route"];
    const rows = sortedQuotations.map(q => [
      q.agentCompany,
      q.rating.toFixed(1),
      `$${q.price}`,
      q.priceDiscount ? `${q.priceDiscount}%` : '',
      `${q.estimatedTime} days`,
      `${order.originPort} → ${q.transhipmentPorts ? q.transhipmentPorts.map(p => p.port).join(' → ') + ' → ' : ''}${order.destinationPort}`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${order.orderNumber}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };