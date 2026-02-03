import * as brevo from '@getbrevo/brevo'
import type { Event } from '@/types/event'
import { formatEventDates, getFirstEventDate, parseEventDates } from './dateUtils'

export interface IHSBConfirmationEmailProps {
  to: string
  name: string
  event: Event
  registrationId: string
  /** Optional PDF attachment (registration certificate) */
  pdfAttachment?: { content: string; name: string }
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
  pdfAttachment,
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
    const firstName = name.split(' ')[0] || name

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed - ${event.title}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <!-- Header with gradient -->
    <tr>
      <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:40px 30px;text-align:center;">
        <div style="font-size:48px;margin-bottom:10px;">✅</div>
        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">You&apos;re Registered!</h1>
        <p style="color:#d1fae5;margin:10px 0 0;font-size:16px;">Your spot has been secured</p>
      </td>
    </tr>
    
    <!-- Main content -->
    <tr>
      <td style="padding:40px 30px;">
        <p style="color:#334155;font-size:18px;margin:0 0 20px;">Dear <strong>${firstName}</strong>,</p>
        
        <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 25px;">
          Thank you for registering! We&apos;re excited to have you join us. Your registration has been confirmed.
        </p>
        
        <!-- Registration ID highlight box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:30px 0;">
          <tr>
            <td style="background:#ecfdf5;border-left:5px solid #10b981;border-radius:0 12px 12px 0;padding:25px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align:center;">
                    <div style="color:#047857;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Your Registration ID</div>
                    <div style="color:#065f46;font-size:28px;font-weight:800;letter-spacing:2px;font-family:monospace;">${registrationId}</div>
                    <p style="color:#047857;font-size:13px;margin:12px 0 0;">Save this ID — you&apos;ll need it for check-in</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Event details card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:12px;margin:25px 0;">
          <tr>
            <td style="padding:25px;">
              <h3 style="color:#1e293b;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 20px;border-bottom:2px solid #e2e8f0;padding-bottom:10px;">Event Details</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;font-size:13px;text-transform:uppercase;">Event</span><br/>
                    <span style="color:#1e293b;font-size:16px;font-weight:600;">${event.title}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;font-size:13px;text-transform:uppercase;">Date</span><br/>
                    <span style="color:#1e293b;font-size:16px;font-weight:600;">${formattedDate}</span>
                  </td>
                </tr>
                ${event.time?.trim() ? `
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;font-size:13px;text-transform:uppercase;">Time</span><br/>
                    <span style="color:#1e293b;font-size:16px;font-weight:600;">${event.time.trim()}</span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#64748b;font-size:13px;text-transform:uppercase;">Venue</span><br/>
                    <span style="color:#1e293b;font-size:16px;font-weight:600;">${venue}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        ${pdfAttachment?.content ? `
        <div style="background:#ecfdf5;border-radius:12px;padding:16px;margin:25px 0;border:1px solid #a7f3d0;">
          <p style="color:#047857;font-size:14px;margin:0;font-weight:500;">
            📎 Your registration card (PDF) is attached to this email. Save it for check-in!
          </p>
        </div>
        ` : ''}

        <!-- Call to action / reminder -->
        <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:12px;padding:20px;margin:25px 0;text-align:center;border:1px solid #bfdbfe;">
          <p style="color:#1e40af;font-size:15px;margin:0;font-weight:500;">
            📅 Add this event to your calendar and we&apos;ll see you there!
          </p>
        </div>
        
        <p style="color:#475569;font-size:16px;line-height:1.7;margin:25px 0 0;">
          If you have any questions, feel free to reach out. We look forward to seeing you!
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background:#f1f5f9;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:14px;margin:0 0 5px;">Best regards,</p>
        <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0;">IHSB Events Team</p>
        <p style="color:#94a3b8;font-size:12px;margin:15px 0 0;">© ${new Date().getFullYear()} IHSB Events. All rights reserved.</p>
      </td>
    </tr>
  </table>
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

    if (pdfAttachment?.content && pdfAttachment?.name) {
      sendSmtpEmail.attachment = [
        {
          content: pdfAttachment.content,
          name: pdfAttachment.name,
        },
      ]
    }

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

export interface AwardeeResultEmailProps {
  to: string
  name: string
  event: Event
  position: number
  /** Category when event has categories */
  category?: string
}

/**
 * Send awardee result notification email (congratulations, position, event details).
 */
export async function sendAwardeeResultEmail({
  to,
  name,
  event,
  position,
  category,
}: AwardeeResultEmailProps): Promise<IHSBEmailResult> {
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
    const positionLabel =
      position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`

    // Dynamic colors and messages based on position
    const getPositionStyle = () => {
      if (position === 1) return { color: '#b45309', bg: '#fef3c7', border: '#f59e0b', emoji: '🥇', medal: 'Gold Medal' }
      if (position === 2) return { color: '#475569', bg: '#f1f5f9', border: '#94a3b8', emoji: '🥈', medal: 'Silver Medal' }
      if (position === 3) return { color: '#9a3412', bg: '#ffedd5', border: '#ea580c', emoji: '🥉', medal: 'Bronze Medal' }
      return { color: '#4f46e5', bg: '#eef2ff', border: '#6366f1', emoji: '🏆', medal: 'Top Performer' }
    }

    const style = getPositionStyle()
    const firstName = name.split(' ')[0]

    const celebratoryMessage = position <= 3
      ? `Your hard work, dedication, and talent have truly paid off! Securing the <strong>${positionLabel} position</strong> is a remarkable achievement that speaks volumes about your abilities.`
      : `Your outstanding performance has earned you a well-deserved spot among the <strong>Top ${position}</strong> participants! This is a fantastic accomplishment that showcases your dedication and skill.`

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations! - Award Result</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <!-- Header with gradient -->
    <tr>
      <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 30px;text-align:center;">
        <div style="font-size:48px;margin-bottom:10px;">${style.emoji}</div>
        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Congratulations!</h1>
        <p style="color:#e0e7ff;margin:10px 0 0;font-size:16px;">You've achieved something amazing!</p>
      </td>
    </tr>
    
    <!-- Main content -->
    <tr>
      <td style="padding:40px 30px;">
        <p style="color:#334155;font-size:18px;margin:0 0 20px;">Dear <strong>${firstName}</strong>,</p>
        
        <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 25px;">
          We are thrilled to share some wonderful news with you! 🎊
        </p>
        
        <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 25px;">
          ${celebratoryMessage}
        </p>
        
        <!-- Position highlight box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:30px 0;">
          <tr>
            <td style="background:${style.bg};border-left:5px solid ${style.border};border-radius:0 12px 12px 0;padding:25px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align:center;">
                    <div style="font-size:36px;margin-bottom:8px;">${style.emoji}</div>
                    <div style="color:${style.color};font-size:32px;font-weight:800;margin-bottom:5px;">${positionLabel} Place</div>
                    <div style="color:${style.color};font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${style.medal}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Event details card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border-radius:12px;margin:25px 0;">
          <tr>
            <td style="padding:25px;">
              <h3 style="color:#1e293b;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 20px;border-bottom:2px solid #e2e8f0;padding-bottom:10px;">Event Details</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;font-size:13px;text-transform:uppercase;">Event</span><br/>
                    <span style="color:#1e293b;font-size:16px;font-weight:600;">${event.title}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;font-size:13px;text-transform:uppercase;">Date</span><br/>
                    <span style="color:#1e293b;font-size:16px;font-weight:600;">${formattedDate}</span>
                  </td>
                </tr>
                ${category?.trim() ? `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;font-size:13px;text-transform:uppercase;">Category</span><br/>
                    <span style="color:#1e293b;font-size:16px;font-weight:600;">${category.trim()}</span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:10px 0;">
                    <span style="color:#64748b;font-size:13px;text-transform:uppercase;">Venue</span><br/>
                    <span style="color:#1e293b;font-size:16px;font-weight:600;">${venue}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Motivational message -->
        <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:12px;padding:20px;margin:25px 0;text-align:center;">
          <p style="color:#92400e;font-size:15px;margin:0;font-style:italic;">
            "Success is not final, failure is not fatal: it is the courage to continue that counts."
          </p>
          <p style="color:#b45309;font-size:13px;margin:10px 0 0;">— Winston Churchill</p>
        </div>
        
        <p style="color:#475569;font-size:16px;line-height:1.7;margin:25px 0 0;">
          Your achievement is a testament to your perseverance and commitment. We are incredibly proud of you and excited to celebrate this milestone together!
        </p>
        
        <p style="color:#475569;font-size:16px;line-height:1.7;margin:20px 0 0;">
          Keep shining and reaching for the stars! ⭐
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background:#f1f5f9;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:14px;margin:0 0 5px;">With warm regards,</p>
        <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0;">IHSB Events Team</p>
        <p style="color:#94a3b8;font-size:12px;margin:15px 0 0;">© ${new Date().getFullYear()} IHSB Events. All rights reserved.</p>
      </td>
    </tr>
  </table>
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
    sendSmtpEmail.subject = `🎉 Congratulations ${firstName}! You secured ${positionLabel} place in ${event.title}!`
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
