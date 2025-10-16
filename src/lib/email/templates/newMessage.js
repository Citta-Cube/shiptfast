import { layout, cta } from './base'

export default function newMessage({ orderReference, senderName, preview, url }) {
  const title = `New message on ${orderReference}`
  const body = `
    <div style="text-align:center">
      <p style="margin:0 0 12px 0;color:#374151">You have a new message from <strong>${senderName}</strong> regarding order <strong>${orderReference}</strong>.</p>
      ${preview ? `<blockquote style=\"border-left:3px solid #e5e7eb;padding:10px 12px;margin:0 0 12px 0;color:#374151\">${preview}</blockquote>` : ''}
      ${cta(url, 'Reply in app')}
    </div>
  `
  return layout({ title, body })
}
