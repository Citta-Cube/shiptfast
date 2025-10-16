import { layout, cta } from './base'

export default function orderStatus({ orderReference, status, url }) {
  const title = `Order ${status.toLowerCase()}`
  const body = `
    <div style="text-align:center">
      <p style="margin:0 0 12px 0;color:#374151">Your order <strong>${orderReference}</strong> is ${status.toLowerCase()}.</p>
      ${cta(url, 'View details')}
    </div>
  `
  return layout({ title, body })
}
