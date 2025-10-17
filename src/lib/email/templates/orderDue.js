import { layout, cta } from './base'

export default function orderDue({ orderReference, dueType, date, url }) {
  const title = `Order due ${dueType}`
  const body = `
    <div style="text-align:center">
      <p style="margin:0 0 8px 0;color:#374151">The order <strong>${orderReference}</strong> is due ${dueType}.</p>
      ${date ? `<p style=\"margin:0 0 14px 0;color:#111827\">Deadline: <strong>${date}</strong></p>` : ''}
      ${cta(url, 'Open order')}
    </div>
  `
  return layout({ title, body })
}
