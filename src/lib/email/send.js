import { getResend, getFromAddress, getAppUrl } from './resend'
import * as T from './templates'
import { createAdminClient } from '@/lib/supabase/admin'

// Resolve recipient: use only the company's email on public.companies
async function getCompanyEmail(companyId) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('companies')
    .select('email')
    .eq('id', companyId)
    .single()
  return data?.email || null
}

// Build a deep link to the app
function orderLink(orderId) {
  return `${getAppUrl()}/orders/${orderId}`
}

export async function sendEmailForNotification(n) {
  const resend = getResend()
  const from = getFromAddress()

  // Identify recipients by recipient_company_id
  const companyEmail = await getCompanyEmail(n.recipient_company_id)
  if (!companyEmail) return { skipped: true, reason: 'no-company-email' }

  // Craft subject and html per type
  const orderRef = n.data?.order_reference || n.data?.orderReference || n.data?.order || n.message?.match(/#?(\w[-\w]+)/)?.[0] || 'Order'
  const url = n.order_id ? orderLink(n.order_id) : getAppUrl()

  let subject = n.title || 'Notification from ShipTfast'
  let html = `<p>${n.message}</p>`

  switch (n.type) {
    case 'ORDER_CREATED':
      subject = `New order: ${orderRef}`
      html = T.orderCreated({ exporterName: n.data?.exporter_name || n.data?.exporterName || 'Exporter', orderReference: orderRef, url })
      break
    case 'ORDER_DUE_7_DAYS':
      subject = `Order due in 7 days: ${orderRef}`
      html = T.orderDue({ orderReference: orderRef, dueType: 'in 7 days', date: n.data?.quotation_deadline || n.data?.cargo_ready_date, url })
      break
    case 'ORDER_DUE_24_HOURS':
      subject = `Order due in 24 hours: ${orderRef}`
      html = T.orderDue({ orderReference: orderRef, dueType: 'in 24 hours', date: n.data?.quotation_deadline || n.data?.cargo_ready_date, url })
      break
    case 'ORDER_CLOSED':
      subject = `Order completed: ${orderRef}`
      html = T.orderStatus({ orderReference: orderRef, status: 'COMPLETED', url })
      break
    case 'ORDER_CANCELLED':
      subject = `Order cancelled: ${orderRef}`
      html = T.orderStatus({ orderReference: orderRef, status: 'CANCELLED', url })
      break
    case 'QUOTE_RECEIVED':
      subject = `New quote received for ${orderRef}`
      html = T.quoteReceived({ orderReference: orderRef, forwarderName: n.data?.forwarder_name, amount: n.data?.quote_amount, currency: n.data?.currency, url })
      break
    case 'QUOTE_SELECTED':
      subject = `Your quote was selected for ${orderRef}`
      html = T.quoteSelected({ orderReference: orderRef, url })
      break
    case 'QUOTE_CANCELLED':
      subject = `Quote cancelled for ${orderRef}`
      html = T.quoteCancelled({ orderReference: orderRef, forwarderName: n.data?.forwarder_name, url })
      break
    case 'NEW_MESSAGE_EXPORTER':
    case 'NEW_MESSAGE_FORWARDER':
      subject = `New message on ${orderRef}`
      html = T.newMessage({ orderReference: orderRef, senderName: n.data?.sender_name || 'Partner', preview: n.data?.message_preview, url })
      break
  }

  // Send
  await resend.emails.send({
    from,
    to: [companyEmail],
    subject,
    html
  })

  return { sent: true, to: [companyEmail] }
}
