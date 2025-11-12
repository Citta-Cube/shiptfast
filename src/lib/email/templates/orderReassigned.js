import { layout, cta } from './base'

export default function orderReassigned({ orderReference, url }) {
  const title = `Order reassigned to you`
  const body = `
    <div style="text-align:center">
      <p style="margin:0 0 12px 0;color:#374151">Order <strong>${orderReference}</strong> has been reassigned to your company.</p>
      <p style="margin:0 0 12px 0;color:#6b7280;font-size:14px">You are now the selected freight forwarder for this order.</p>
      ${cta(url, 'View order')}
    </div>
  `
  return layout({ title, body })
}