// utils/csvExport.js

export const exportToCSV = (quotations, order) => {
    const sortedQuotations = [...quotations].sort((a, b) => a.net_freight_cost - b.net_freight_cost);
    const headers = ["Agent", "Rating", "Price", "Estimated Time", "Route"];
    const rows = sortedQuotations.map(q => [
      q.companies.name,
      q.companies.average_rating ? q.companies.average_rating.toFixed(1) : 'N/A',
      `$${q.net_freight_cost.toFixed(2)}`,
      `${q.estimated_time_days} days`,
      `${order.origin_port.name.replace(/,/g, '')} → ${q.transshipment_ports.length > 0 ? q.transshipment_ports.map(p => p.port.name.replace(/,/g, '')).join(' → ') + ' → ' : ''}${order.destination_port.name.replace(/,/g, '')}`
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
      link.setAttribute('download', `${order.reference_number}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
};