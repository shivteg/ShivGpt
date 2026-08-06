/**
 * Email Notification Service for ShivGpt (SAI)
 * Handles rate limit warnings and 1-hour reset notification emails.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const { to, subject, html, text } = options;

  console.log(`[EmailService] Attempting to send email to ${to} | Subject: "${subject}"`);

  // 1. Resend API Integration
  const resendApiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'ShivGpt SAI <noreply@resend.dev>',
          to: [to],
          subject: subject,
          html: html,
          text: text,
        }),
      });

      if (res.ok) {
        console.log(`[EmailService] ✅ Email successfully sent via Resend API to ${to}`);
        return true;
      } else {
        const errText = await res.text();
        console.warn(`[EmailService] ⚠️ Resend API error:`, errText);
      }
    } catch (err) {
      console.error(`[EmailService] Resend fetch exception:`, err);
    }
  }

  // 2. SendGrid API Integration
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.EMAIL_FROM || 'noreply@shivgpt.com', name: 'ShivGpt SAI' },
          subject: subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (res.ok || res.status === 202) {
        console.log(`[EmailService] ✅ Email successfully sent via SendGrid API to ${to}`);
        return true;
      }
    } catch (err) {
      console.error(`[EmailService] SendGrid fetch exception:`, err);
    }
  }

  // 3. Fallback Logging for Server Logs / Dev
  console.log(`[EmailService] ✉️ [MOCK EMAIL SENT TO ${to}]`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);

  return true;
};

/**
 * Send immediate email when user exceeds 432 tokens / 1 hr limit
 */
export const sendRateLimitExceededEmail = async (userEmail: string): Promise<boolean> => {
  const targetUrl = 'https://shiv-gpt-two.vercel.app';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #171717; color: #f5f5f5; border: 1px solid #333; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #f97316, #d97706); border-radius: 12px; line-height: 48px; font-size: 24px; color: #fff; font-weight: bold;">⚡</div>
        <h2 style="color: #ffedd5; margin-top: 12px; font-size: 22px; font-weight: 700;">Rate Limit Exceeded - ShivGpt</h2>
      </div>

      <div style="background: #262626; border-left: 4px solid #f97316; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 15px; color: #fed7aa; line-height: 1.6;">
          ⚠️ <strong>Rate limit exceeded!</strong> You must try again after 1 hour.
        </p>
      </div>

      <p style="font-size: 14px; color: #d4d4d4; line-height: 1.6; margin-bottom: 20px;">
        You have reached your allocated quota of <strong>432 tokens / 1 hour</strong> on ShivGpt (SAI). Your limit will automatically reset in 60 minutes.
      </p>

      <p style="font-size: 13px; color: #a3a3a3; line-height: 1.5; margin-bottom: 28px;">
        We will automatically send you another email as soon as your 1-hour wait period is over.
      </p>

      <div style="text-align: center; border-top: 1px solid #333; pt-24px; padding-top: 20px;">
        <a href="${targetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ea580c, #d97706); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px;">Visit ShivGpt SAI →</a>
        <p style="font-size: 11px; color: #737373; margin-top: 16px;">ShivGpt (SAI) System Notification &bull; <a href="${targetUrl}" style="color: #f97316; text-decoration: none;">shiv-gpt-two.vercel.app</a></p>
      </div>
    </div>
  `;

  const text = `Rate limit exceeded - ShivGpt (SAI)

Rate limit exceeded! You must try again after 1 hour.
You have reached your quota of 432 tokens / 1 hour. Your limit will automatically reset in 60 minutes.

We will send you another email as soon as your 1-hour wait is finished.
ShivGpt SAI Link: ${targetUrl}`;

  return await sendEmail({
    to: userEmail,
    subject: '⚠️ Rate Limit Exceeded - ShivGpt (SAI)',
    html,
    text,
  });
};

/**
 * Send email when 1-hour wait period is finished
 */
export const sendRateLimitResetEmail = async (userEmail: string): Promise<boolean> => {
  const targetUrl = 'https://shiv-gpt-two.vercel.app';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #171717; color: #f5f5f5; border: 1px solid #333; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; line-height: 48px; font-size: 24px; color: #fff; font-weight: bold;">🎉</div>
        <h2 style="color: #ecfdf5; margin-top: 12px; font-size: 22px; font-weight: 700;">Wait is Over - ShivGpt (SAI)</h2>
      </div>

      <div style="background: #064e3b; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 15px; color: #a7f3d0; line-height: 1.6;">
          🚀 <strong>Finally wait is over now use SAI link- <a href="${targetUrl}" style="color: #34d399; font-weight: bold; text-decoration: underline;">shiv-gpt-two.vercel.app</a></strong>
        </p>
      </div>

      <p style="font-size: 14px; color: #d4d4d4; line-height: 1.6; margin-bottom: 28px;">
        Your 1-hour rate limit window has expired and your token quota of <strong>432 tokens / 1 hour</strong> has been fully restored. You can resume chatting with SAI now!
      </p>

      <div style="text-align: center; border-top: 1px solid #333; padding-top: 20px;">
        <a href="${targetUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">Open ShivGpt (SAI) Now →</a>
        <p style="font-size: 11px; color: #737373; margin-top: 16px;">ShivGpt (SAI) &bull; <a href="${targetUrl}" style="color: #10b981; text-decoration: none;">shiv-gpt-two.vercel.app</a></p>
      </div>
    </div>
  `;

  const text = `Finally wait is over now use SAI link- shiv-gpt-two.vercel.app

Your 1-hour rate limit window has expired and your 432 tokens / 1 hr quota is restored!
Open SAI now: https://shiv-gpt-two.vercel.app`;

  return await sendEmail({
    to: userEmail,
    subject: '🎉 Finally wait is over - Use SAI link shiv-gpt-two.vercel.app',
    html,
    text,
  });
};
