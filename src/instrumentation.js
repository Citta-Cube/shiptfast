// Next.js instrumentation entry (runs on the server)
// We use this to start a lightweight interval that processes email notifications.

import { processEmailNotifications } from '@/lib/email/processNotifications'

let intervalHandle

export async function register() {
  // Only run in production or when explicitly enabled in dev
  const enable = process.env.ENABLE_EMAIL_SCHEDULER
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd && String(enable).toLowerCase() !== 'true') return

  if (intervalHandle) return

  const everyMs = Number(process.env.EMAIL_SCHEDULE_INTERVAL_MS || 60000) // default: 60s

  intervalHandle = setInterval(async () => {
    try {
      await processEmailNotifications({
        types: ['ORDER_DUE_7_DAYS', 'ORDER_DUE_24_HOURS', 'ORDER_CLOSED']
      })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Email scheduler error:', e)
    }
  }, everyMs)
}
