import { getAppUrl } from '../resend'

function brandHeader() {
  const brand = 'SHIPTFAST'
  const appUrl = getAppUrl()
  const logoUrl = process.env.EMAIL_LOGO_URL || `${appUrl}/CittaCube.png`
  const hasLogo = !!logoUrl

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 auto">
      <tr>
        <td align="center" style="padding:0 0 24px 0">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
            <tr style="vertical-align: middle">
              <td align="center" style="padding:0 8px 0 0">
                <a href="${appUrl}" target="_blank" rel="noopener" style="text-decoration:none;color:#111827">
                  <span style="
                    font-weight: 800;
                    font-size: 20px;
                    letter-spacing: 0.6px;
                    color: #111827;
                    color-scheme: light dark;
                    -webkit-text-fill-color: currentcolor;
                    vertical-align: middle;
                  ">
                    ${brand}
                  </span>
                </a>
              </td>
              <td align="center" style="padding:0 8px;color:#6b7280;font-size:14px">by</td>
              <td align="center" style="padding:0 0 0 8px">
                ${
                  hasLogo
                    ? `<a href="${appUrl}" target="_blank" rel="noopener" style="text-decoration:none">
                        <img 
                          src="${logoUrl}" 
                          alt="${brand} logo" 
                          width="120"
                          style="
                            height: 144px;
                            width: auto;
                            display: block;
                            border: 0;
                            outline: none;
                            text-decoration: none;
                            border-radius: 4px;
                            -ms-interpolation-mode: bicubic;
                          "
                        />
                      </a>`
                    : `<span style="font-weight:600;font-size:15px;color:#374151">CittaCube</span>`
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

export function layout({ title, body, preheader = '', footerNote = '' }) {
  const safePreheader = preheader || String(title || '').slice(0, 140)

  return `
  <div style="margin:0;padding:0;background:#f6f7fb;color-scheme: light dark;">
    <!-- Hidden Preheader Text -->
    <div style="
      display:none!important;
      visibility:hidden;
      opacity:0;
      color:transparent;
      height:0;
      width:0;
      max-height:0;
      max-width:0;
      overflow:hidden;
      mso-hide:all;
      font-size:1px;
      line-height:1px;
    ">
      ${safePreheader}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;margin:0;padding:0">
      <tr>
        <td align="center" style="padding:28px 12px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:720px;background:transparent">
            <tr>
              <td>
                ${brandHeader()}
              </td>
            </tr>
            <tr>
              <td style="
                background:#ffffff;
                border:1px solid #e5e7eb;
                border-radius:14px;
                padding:0;
                box-shadow:0 1px 2px rgba(0,0,0,0.03);
              ">
                <!-- Card inner -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding:24px 20px 8px 20px">
                      <h1 style="
                        margin:0;
                        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif;
                        font-size:22px;
                        line-height:1.35;
                        letter-spacing:0.2px;
                        color:#111827;
                      ">
                        ${title}
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 20px 0 20px">
                      <div style="height:1px;background:#f1f5f9;opacity:0.9;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 20px 24px 20px;font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif;color:#111827;line-height:1.6">
                      ${body}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:12px 8px 0 8px">
                <p style="
                  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif;
                  font-size:12px;
                  color:#6b7280;
                  margin:10px 0 0 0;
                  text-align:center;
                ">
                  ${footerNote || 'This is an automated message from SHIPTFAST. You can view and manage notifications in the app.'}
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>`
}

export function cta(href, label = 'View in app') {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">
      <tr>
        <td align="center" bgcolor="#111827" style="
          border-radius:10px;
          background:#111827;
        ">
          <a href="${href}" target="_blank" rel="noopener" style="
            display:inline-block;
            padding:12px 18px;
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif;
            font-weight:600;
            font-size:14px;
            color:#ffffff !important;
            text-decoration:none;
            border-radius:10px;
            line-height:1.1;
          " aria-label="${label}" role="button">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `
}