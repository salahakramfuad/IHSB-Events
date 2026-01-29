import * as brevo from '@getbrevo/brevo'
import type { Event } from '@/types/event'
import { formatEventDates, getFirstEventDate, parseEventDates } from './dateUtils'

export interface IHSBConfirmationEmailProps {
  to: string
  name: string
  event: Event
  registrationId: string
}

export interface IHSBEmailResult {
  success: boolean
  error?: string
}

/**
 * Send IHSB registration confirmation email (event title, date, venue, name, thank-you).
 */
export async function sendIHSBConfirmationEmail({
  to,
  name,
  event,
  registrationId,
}: IHSBConfirmationEmailProps): Promise<IHSBEmailResult> {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!to?.trim() || !emailRegex.test(to.trim())) {
      return { success: false, error: 'Invalid email address.' }
    }

    const normalizedEmail = to.trim().toLowerCase()

    if (!process.env.BREVO_API_KEY?.trim()) {
      return { success: false, error: 'Email service is not configured (BREVO_API_KEY).' }
    }

    const firstDate = getFirstEventDate(event.date)
    const formattedDate = firstDate ? formatEventDates(parseEventDates(event.date), 'long') : 'TBA'
    const venue = event.venue || event.location || 'TBA'

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Registration Confirmation</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#1a1a1a;">Registration Confirmed</h2>
  <p>Dear ${name},</p>
  <p>Thank you for registering! Your spot has been secured for the following event.</p>
  <p style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:12px 16px;margin:16px 0;"><strong>Your registration ID: ${registrationId}</strong></p>
  <p>Please save this ID for your records. You may need it when checking in at the event.</p>
  <table style="border-collapse:collapse;width:100%;margin:20px 0;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Event</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${event.title}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Date</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${formattedDate}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Venue</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${venue}</td></tr>
    <tr><td style="padding:8px 0;"><strong>Registration ID</strong></td><td style="padding:8px 0;">${registrationId}</td></tr>
  </table>
  <p>We look forward to seeing you. If you have any questions, please contact us.</p>
  <p>Best regards,<br/>IHSB Events</p>
</body>
</html>`

    const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || 'IHSB Events <noreply@example.com>'
    let senderEmail = fromEmail
    let senderName = 'IHSB Events'
    const nameMatch = fromEmail.match(/^(.+?)\s*<(.+?)>$/)
    if (nameMatch) {
      senderName = nameMatch[1].trim()
      senderEmail = nameMatch[2].trim()
    }

    const apiInstance = new brevo.TransactionalEmailsApi()
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY)

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: senderEmail, name: senderName }
    sendSmtpEmail.to = [{ email: normalizedEmail, name }]
    sendSmtpEmail.subject = `Registration Confirmation: ${event.title} - ${registrationId}`
    sendSmtpEmail.htmlContent = emailHtml

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    if (data === null || data === undefined) {
      return { success: false, error: 'Email service returned no response.' }
    }
    if (typeof data === 'object' && 'messageId' in data) {
      return { success: true }
    }
    if (typeof data === 'string') {
      return { success: true }
    }
    return { success: true }
  } catch (error: unknown) {
    const err = error as { response?: { body?: { message?: string } }; message?: string }
    const msg = err.response?.body?.message ?? err.message ?? 'Failed to send email'
    return { success: false, error: String(msg) }
  }
}
