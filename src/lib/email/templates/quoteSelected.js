import { layout, cta } from './base'

export default function quoteSelected({ orderReference, url }) {
  const title = `Your quote was selected`
  const body = `
    <div style="text-align:center">
      <p style="margin:0 0 12px 0;color:#374151">Your quote for order <strong>${orderReference}</strong> has been selected.</p>
      ${cta(url, 'View order')}
    </div>
  `
  return layout({ title, body })
}
