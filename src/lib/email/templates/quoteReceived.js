import { layout, cta } from './base'

export default function quoteReceived({ orderReference, forwarderName, amount, currency, url }) {
  const title = `New quote received`
  const body = `
    <div style="text-align:center">
      <p style="margin:0 0 8px 0;color:#374151">You received a new quote from <strong>${forwarderName}</strong> for order <strong>${orderReference}</strong>.</p>
      ${amount ? `<p style=\"margin:0 0 14px 0;color:#111827\">Quoted: <strong>${amount} ${currency || ''}</strong></p>` : ''}
      ${cta(url, 'Compare quotes')}
    </div>
  `
  return layout({ title, body })
}
