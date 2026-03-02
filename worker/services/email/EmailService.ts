// worker/services/email/EmailService.ts
import { EmailMessage } from "cloudflare:email";

export interface EmailEnv {
	SEND_EMAIL: SendEmail;
	DB: D1Database;
}

const FROM_ADDRESS = "noreply@designai.dev";
const FROM_NAME = "DesignAI";
const OTP_EXPIRY_MINUTES = 15;

// Build a raw MIME message without external dependencies
function buildMimeEmail(
	to: string,
	subject: string,
	htmlBody: string,
): string {
	const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	const lines = [
		`From: ${FROM_NAME} <${FROM_ADDRESS}>`,
		`To: ${to}`,
		`Subject: ${subject}`,
		`MIME-Version: 1.0`,
		`Content-Type: multipart/alternative; boundary="${boundary}"`,
		``,
		`--${boundary}`,
		`Content-Type: text/html; charset=UTF-8`,
		`Content-Transfer-Encoding: 7bit`,
		``,
		htmlBody,
		``,
		`--${boundary}--`,
	];
	return lines.join('\r\n');
}

// ---- OTP Generator -----------------------------------------------------------
function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---- Core Send Helper --------------------------------------------------------
async function sendEmail(
	env: EmailEnv,
	to: string,
	subject: string,
	html: string,
): Promise<void> {
	const rawEmail = buildMimeEmail(to, subject, html);
	const message = new EmailMessage(FROM_ADDRESS, to, rawEmail);
	await env.SEND_EMAIL.send(message);
}

// ---- Email Templates ---------------------------------------------------------
function otpEmailTemplate(otp: string, expiryMinutes: number): string {
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; padding: 40px; background: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a; }
    .logo { font-size: 24px; font-weight: 700; color: #a855f7; margin-bottom: 24px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    p { color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background: #0f0f0f; border: 1px solid #3f3f46; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #a855f7; font-family: monospace; }
    .expiry { font-size: 13px; color: #71717a; margin-top: 12px; }
    .footer { font-size: 12px; color: #52525b; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✦ DesignAI</div>
    <h1>Verify your email address</h1>
    <p>Enter this code to complete your sign-in. It expires in ${expiryMinutes} minutes.</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="expiry">Expires in ${expiryMinutes} minutes</div>
    </div>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <div class="footer">DesignAI &mdash; AI-powered web app builder</div>
  </div>
</body>
</html>`;
}

// ---- Public API --------------------------------------------------------------
export async function sendOTPEmail(
	env: EmailEnv,
	to: string,
): Promise<{ otp: string }> {
	const otp = generateOTP();
	const html = otpEmailTemplate(otp, OTP_EXPIRY_MINUTES);
	await sendEmail(env, to, 'Your DesignAI verification code', html);
	return { otp };
}

export async function sendWelcomeEmail(
	env: EmailEnv,
	to: string,
	name: string,
): Promise<void> {
	const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Welcome to DesignAI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; padding: 40px; background: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a; }
    .logo { font-size: 24px; font-weight: 700; color: #a855f7; margin-bottom: 24px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    p { color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #52525b; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✦ DesignAI</div>
    <h1>Welcome, ${name}!</h1>
    <p>Your account is ready. Start building AI-powered web apps today.</p>
    <div class="footer">DesignAI &mdash; AI-powered web app builder</div>
  </div>
</body>
</html>`;
	await sendEmail(env, to, `Welcome to DesignAI, ${name}!`, html);
}
