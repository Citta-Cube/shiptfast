import { Resend } from 'resend'

let client

export function getResend() {
  if (client) return client
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable')
  }
  client = new Resend(apiKey)
  return client
}

export function getFromAddress() {
  const name = process.env.SMTP_FROM_NAME || 'ShipTfast Notifications'
  // Allow override for Resend onboarding sender if domain isn't verified
  if (process.env.RESEND_FROM_OVERRIDE) {
    return `${name} <${process.env.RESEND_FROM_OVERRIDE}>`
  }
  if (String(process.env.RESEND_USE_ONBOARDING || '').toLowerCase() === 'true') {
    return `${name} <onboarding@resend.dev>`
  }
  const email = process.env.SMTP_FROM_EMAIL || 'no-reply@shiptfast.example'
  return `${name} <${email}>`
}

export function getAppUrl() {
  // Prefer NEXT_PUBLIC_APP_URL; fallback to VERCEL_URL or localhost
  const url = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000'
  return url.replace(/\/$/, '')
}
