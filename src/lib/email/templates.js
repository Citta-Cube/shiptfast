function layout({ title, body }) {
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;line-height:1.6;color:#111825">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px 0">${title}</h1>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px">
        ${body}
      </div>
      <p style="font-size:12px;color:#6b7280;margin-top:16px">This is an automated message from ShipTfast. You can view this in the app.</p>
    </div>
  </div>`
}

function cta(href, label = 'View in app') {
  return `<a href="${href}" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:10px 14px;border-radius:8px">${label}</a>`
}

export function orderCreated({ exporterName, orderReference, url }) {
  const title = `New order available: ${orderReference}`
  const body = `
    <p>A new order from <strong>${exporterName}</strong> is available for quotation.</p>
    <p>Order reference: <strong>${orderReference}</strong></p>
    <p>${cta(url, 'Review order')}</p>
  `
  return layout({ title, body })
}

export function orderDue({ orderReference, dueType, date, url }) {
  const title = `Order due ${dueType}: ${orderReference}`
  const body = `
    <p>The order <strong>${orderReference}</strong> is due ${dueType}.</p>
    ${date ? `<p>Deadline: <strong>${date}</strong></p>` : ''}
    <p>${cta(url, 'Open order')}</p>
  `
  return layout({ title, body })
}

export function orderStatus({ orderReference, status, url }) {
  const title = `Order ${status.toLowerCase()}: ${orderReference}`
  const body = `
    <p>Your order <strong>${orderReference}</strong> is ${status.toLowerCase()}.</p>
    <p>${cta(url, 'View details')}</p>
  `
  return layout({ title, body })
}

export function quoteReceived({ orderReference, forwarderName, amount, currency, url }) {
  const title = `New quote from ${forwarderName}`
  const body = `
    <p>You received a new quote from <strong>${forwarderName}</strong> for order <strong>${orderReference}</strong>.</p>
    ${amount ? `<p>Quoted: <strong>${amount} ${currency || ''}</strong></p>` : ''}
    <p>${cta(url, 'Compare quotes')}</p>
  `
  return layout({ title, body })
}

export function quoteSelected({ orderReference, url }) {
  const title = `Your quote was selected`
  const body = `
    <p>Your quote for order <strong>${orderReference}</strong> has been selected.</p>
    <p>${cta(url, 'View order')}</p>
  `
  return layout({ title, body })
}

export function quoteCancelled({ orderReference, forwarderName, url }) {
  const title = `Quote cancelled`
  const body = `
    <p>A quote from <strong>${forwarderName || 'forwarder'}</strong> for order <strong>${orderReference}</strong> has been cancelled.</p>
    <p>${cta(url, 'View order')}</p>
  `
  return layout({ title, body })
}

export function newMessage({ orderReference, senderName, preview, url }) {
  const title = `New message on ${orderReference}`
  const body = `
    <p>You have a new message from <strong>${senderName}</strong> regarding order <strong>${orderReference}</strong>.</p>
    ${preview ? `<blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#374151">${preview}</blockquote>` : ''}
    <p>${cta(url, 'Reply in app')}</p>
  `
  return layout({ title, body })
}