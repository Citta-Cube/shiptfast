import { layout, cta } from './base'

export default function orderCreated({ exporterName, orderReference, url }) {
  const title = `New order available`
  const body = `
    <div style="text-align:center">
      <p style="margin:0 0 8px 0;color:#374151">A new order from <strong>${exporterName}</strong> is available for quotation.</p>
      <p style="margin:0 0 14px 0;color:#111827">Order reference: <strong>${orderReference}</strong></p>
      ${cta(url, 'Review order')}
      <p style="font-size:12px;color:#9ca3af;margin-top:10px">It may take a moment for updates to appear in the portal.</p>
    </div>
  `
  return layout({ title, body })
}
