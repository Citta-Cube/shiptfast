import { layout, cta } from './base'

export default function quoteCancelled({ orderReference, forwarderName, url }) {
  const title = `Quote cancelled`
  const body = `
    <div style="text-align:center">
      <p style="margin:0 0 12px 0;color:#374151">A quote from <strong>${forwarderName || 'forwarder'}</strong> for order <strong>${orderReference}</strong> has been cancelled.</p>
      ${cta(url, 'View order')}
    </div>
  `
  return layout({ title, body })
}
