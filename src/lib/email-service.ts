import { Resend } from 'resend'

// Lazy-initialized Resend client to avoid build-time errors
let resendClient: Resend | null = null

/**
 * Get or create the Resend client instance
 * This lazy initialization prevents build-time errors when environment variables aren't available
 */
function getResendClient(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not configured')
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export interface EmailVerificationOptions {
  to: string
  firstName: string
  verificationUrl: string
}

export interface BirthControlReminderOptions {
  to: string
  firstName: string
  reminderType: 'insertion' | 'removal'
}

/**
 * Send birth control reminder email using Resend
 */
export async function sendBirthControlReminder({
  to,
  firstName,
  reminderType,
}: BirthControlReminderOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.EMAIL_FROM_ADDRESS) {
      throw new Error('EMAIL_FROM_ADDRESS environment variable is not configured')
    }

    const resend = getResendClient() // Lazy initialization
    const fromAddress = process.env.EMAIL_FROM_ADDRESS
    const replyToAddress = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM_ADDRESS

    const subject =
      reminderType === 'insertion'
        ? 'Time to insert your birth control ring - Health Tracker'
        : 'Time to remove your birth control ring - Health Tracker'

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      replyTo: replyToAddress,
      subject,
      html: getBirthControlReminderHtml({ firstName, reminderType }),
      text: getBirthControlReminderText({ firstName, reminderType }),
    })

    if (error) {
      console.error('Failed to send birth control reminder:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    console.log('Birth control reminder sent successfully:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('Error sending birth control reminder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Send email verification email using Resend
 */
export async function sendEmailVerification({
  to,
  firstName,
  verificationUrl,
}: EmailVerificationOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.EMAIL_FROM_ADDRESS) {
      throw new Error('EMAIL_FROM_ADDRESS environment variable is not configured')
    }

    const resend = getResendClient() // Lazy initialization
    const fromAddress = process.env.EMAIL_FROM_ADDRESS
    const replyToAddress = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM_ADDRESS

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      replyTo: replyToAddress,
      subject: 'Verify your email address - Health Tracker',
      html: getEmailVerificationHtml({ firstName, verificationUrl }),
      text: getEmailVerificationText({ firstName, verificationUrl }),
    })

    if (error) {
      console.error('Failed to send email verification:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    console.log('Email verification sent successfully:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('Error sending email verification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Generate HTML version of email verification email
 */
function getEmailVerificationHtml({
  firstName,
  verificationUrl,
}: {
  firstName: string
  verificationUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #0f172a;
    }
    .content {
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #0f172a;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #1e293b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Health Tracker</div>
  </div>
  
  <div class="content">
    <h1>Welcome to Health Tracker, ${firstName}!</h1>
    
    <p>Thank you for signing up for Health Tracker. To complete your account setup and start tracking your health, please verify your email address by clicking the button below:</p>
    
    <p style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </p>
    
    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-family: monospace; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
      ${verificationUrl}
    </p>
    
    <div class="warning">
      <strong>Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with Health Tracker, please ignore this email.
    </div>
    
    <p>Once verified, you'll be able to:</p>
    <ul>
      <li>Track your menstrual cycle and symptoms</li>
      <li>Monitor migraine patterns and triggers</li>
      <li>View personalized analytics and insights</li>
      <li>Set up reminders and notifications</li>
    </ul>
    
    <p>If you have any questions or need assistance, feel free to contact our support team.</p>
    
    <p>Welcome to your health journey!</p>
    <p><strong>The Health Tracker Team</strong></p>
  </div>
  
  <div class="footer">
    <p>This email was sent to ${firstName} because you created an account on Health Tracker.</p>
    <p>If you believe this was sent in error, please ignore this email.</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate text version of email verification email
 */
function getEmailVerificationText({
  firstName,
  verificationUrl,
}: {
  firstName: string
  verificationUrl: string
}): string {
  return `
Welcome to Health Tracker, ${firstName}!

Thank you for signing up for Health Tracker. To complete your account setup and start tracking your health, please verify your email address by visiting:

${verificationUrl}

IMPORTANT: This verification link will expire in 24 hours. If you didn't create an account with Health Tracker, please ignore this email.

Once verified, you'll be able to:
• Track your menstrual cycle and symptoms
• Monitor migraine patterns and triggers  
• View personalized analytics and insights
• Set up reminders and notifications

If you have any questions or need assistance, feel free to contact our support team.

Welcome to your health journey!

The Health Tracker Team

---
This email was sent because you created an account on Health Tracker.
If you believe this was sent in error, please ignore this email.
  `.trim()
}

/**
 * Generate HTML version of birth control reminder email
 */
function getBirthControlReminderHtml({
  firstName,
  reminderType,
}: {
  firstName: string
  reminderType: 'insertion' | 'removal'
}): string {
  const isInsertion = reminderType === 'insertion'
  const actionTitle = isInsertion ? 'Insert' : 'Remove'
  const actionMessage = isInsertion
    ? "It's time to insert your birth control ring."
    : "It's time to remove your birth control ring."

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${actionTitle} Your Birth Control Ring</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #0f172a;
    }
    .content {
      margin: 30px 0;
    }
    .reminder-card {
      background-color: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 16px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .reminder-title {
      font-size: 18px;
      font-weight: bold;
      color: #0c4a6e;
      margin-bottom: 8px;
    }
    .instructions {
      margin: 20px 0;
    }
    .instructions ol {
      padding-left: 20px;
    }
    .instructions li {
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .note {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Health Tracker</div>
  </div>
  
  <div class="content">
    <h1>Birth Control Reminder</h1>
    
    <div class="reminder-card">
      <div class="reminder-title">${actionTitle} Your Ring</div>
      <p>Hi ${firstName}! ${actionMessage}</p>
    </div>
    
    
    <div class="note">
      <strong>Remember:</strong> Log this event in your Health Tracker app to keep your cycle predictions accurate and maintain your reminder schedule.
    </div>
    
    <p>If you have any questions about your birth control ring or experience any issues, please consult with your healthcare provider.</p>
    
    <p>Stay healthy!</p>
    <p><strong>The Health Tracker Team</strong></p>
  </div>
  
  <div class="footer">
    <p>This reminder was sent because you have birth control notifications enabled in Health Tracker.</p>
    <p>You can manage your notification preferences in your account settings.</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate text version of birth control reminder email
 */
function getBirthControlReminderText({
  firstName,
  reminderType,
}: {
  firstName: string
  reminderType: 'insertion' | 'removal'
}): string {
  const isInsertion = reminderType === 'insertion'
  const actionTitle = isInsertion ? 'Insert' : 'Remove'
  const actionMessage = isInsertion
    ? "It's time to insert your birth control ring."
    : "It's time to remove your birth control ring."

  return `
Health Tracker - Birth Control Reminder

${actionTitle} Your Ring

Hi ${firstName}! ${actionMessage}

REMEMBER: Log this event in your Health Tracker app to keep your cycle predictions accurate and maintain your reminder schedule.

If you have any questions about your birth control ring or experience any issues, please consult with your healthcare provider.

Stay healthy!

The Health Tracker Team

---
This reminder was sent because you have birth control notifications enabled in Health Tracker.
You can manage your notification preferences in your account settings.
  `.trim()
}
