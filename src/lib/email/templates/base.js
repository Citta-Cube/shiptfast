import { getAppUrl } from '../resend'
function brandHeader() {
  const brand = 'ShipTfast'
  const logoUrl = process.env.EMAIL_LOGO_URL || `${getAppUrl()}/CittaCube.png`
  const hasLogo = !!logoUrl
  return `
    <div style="text-align:center;margin-bottom:20px;">
      ${hasLogo
        ? `<img src="${logoUrl}" alt="${brand} logo" style="height:36px;width:auto;display:inline-block;" />`
        : `<div style="font-weight:700;font-size:18px;letter-spacing:0.5px;">${brand}</div>`}
    </div>
  `
}

export function layout({ title, body }) {
  return `
  <div style="margin:0;padding:0;background:#f6f7fb;">
    <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;line-height:1.6;color:#111827;max-width:720px;margin:0 auto;padding:28px 16px;">
      ${brandHeader()}
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:28px 24px;box-shadow:0 1px 2px rgba(0,0,0,0.03)">
        <h1 style="font-size:22px;line-height:1.3;text-align:center;margin:0 0 12px 0;letter-spacing:0.2px">${title}</h1>
        <div style="height:1px;background:#f1f5f9;margin:14px 0 20px 0"></div>
        ${body}
      </div>
      <p style="font-size:12px;color:#6b7280;margin-top:14px;text-align:center">This is an automated message from ShipTfast. You can view this in the app.</p>
    </div>
  </div>`
}

export function cta(href, label = 'View in app') {
  return `<a href="${href}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">${label}</a>`
}
