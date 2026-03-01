// worker/services/email/emailService.ts
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export interface EmailEnv {
    SEND_EMAIL: SendEmail;
    DB: D1Database;
}

const FROM_ADDRESS = "noreply@designai.dev";
const FROM_NAME = "DesignAI";
const OTP_EXPIRY_MINUTES = 15;

// ─── OTP Generator ───────────────────────────────────────────────────────────
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Core Send Helper ─────────────────────────────────────────────────────────
async function sendEmail(
    env: EmailEnv,
    to: string,
    subject: string,
    html: string
): Promise<void> {
    const msg = createMimeMessage();
    msg.setSender({ name: FROM_NAME, addr: FROM_ADDRESS });
    msg.setRecipient(to);
    msg.setSubject(subject);
    msg.addMessage({ contentType: "text/html", data: html });

    const message = new EmailMessage(FROM_ADDRESS, to, msg.asRaw());
    await env.SEND_EMAIL.send(message);
}

// ─── Email Templates ──────────────────────────────────────────────────────────
function otpEmailTemplate(otp: string, expiryMinutes: number): string {
    return `
<!DOCTYPE html>
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
    <p>Enter the code below to verify your email and activate your account.</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="expiry">Expires in ${expiryMinutes} minutes</div>
    </div>
    <p>If you didn't create a DesignAI account, you can safely ignore this email.</p>
    <div class="footer">© 2026 DesignAI. All rights reserved.</div>
  </div>
</body>
</html>`;
}

function passwordResetTemplate(otp: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e5e5e5; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; padding: 40px; background: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a; }
    .logo { font-size: 24px; font-weight: 700; color: #a855f7; margin-bottom: 24px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    p { color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background: #0f0f0f; border: 1px solid #ef4444; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #ef4444; font-family: monospace; }
    .expiry { font-size: 13px; color: #71717a; margin-top: 12px; }
    .footer { font-size: 12px; color: #52525b; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✦ DesignAI</div>
    <h1>Reset your password</h1>
    <p>Use the code below to reset your password. This code expires in 15 minutes.</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="expiry">Expires in 15 minutes</div>
    </div>
    <p>If you didn't request a password reset, your account may be at risk. Please contact support immediately.</p>
    <div class="footer">© 2026 DesignAI. All rights reserved.</div>
  </div>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a verification OTP and persist it in D1.
 * Call this after user registration.
 */
export async function sendVerificationEmail(
    env: EmailEnv,
    userId: string,
    email: string
): Promise<void> {
    const otp = generateOTP();
    const expiresAt = new Date(
        Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // Upsert: remove any existing OTP for this user, then insert fresh one
    await env.DB.prepare(
        `DELETE FROM email_verifications WHERE user_id = ?`
    )
        .bind(userId)
        .run();

    await env.DB.prepare(
        `INSERT INTO email_verifications (user_id, email, otp, expires_at, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
    )
        .bind(userId, email, otp, expiresAt)
        .run();

    await sendEmail(
        env,
        email,
        "Verify your DesignAI account",
        otpEmailTemplate(otp, OTP_EXPIRY_MINUTES)
    );
}

/**
 * Verify the OTP submitted by user. Returns true on success.
 * Marks email as verified in users table and deletes the OTP row.
 */
export async function verifyEmailOTP(
    env: EmailEnv,
    userId: string,
    submittedOTP: string
): Promise<{ success: boolean; error?: string }> {
    const record = await env.DB.prepare(
        `SELECT otp, expires_at FROM email_verifications
     WHERE user_id = ? AND email = (SELECT email FROM users WHERE id = ?)`
    )
        .bind(userId, userId)
        .first<{ otp: string; expires_at: string }>();

    if (!record) {
        return { success: false, error: "No pending verification found. Request a new code." };
    }

    if (new Date(record.expires_at) < new Date()) {
        await env.DB.prepare(`DELETE FROM email_verifications WHERE user_id = ?`)
            .bind(userId)
            .run();
        return { success: false, error: "Code expired. Request a new one." };
    }

    if (record.otp !== submittedOTP.trim()) {
        return { success: false, error: "Invalid code. Please try again." };
    }

    // Mark verified and clean up
    await env.DB.batch([
        env.DB.prepare(`UPDATE users SET email_verified = 1, updated_at = datetime('now') WHERE id = ?`).bind(userId),
        env.DB.prepare(`DELETE FROM email_verifications WHERE user_id = ?`).bind(userId),
    ]);

    return { success: true };
}

/**
 * Resend verification (rate-limited: 1 per 60 seconds).
 */
export async function resendVerificationEmail(
    env: EmailEnv,
    userId: string,
    email: string
): Promise<{ success: boolean; error?: string }> {
    const existing = await env.DB.prepare(
        `SELECT created_at FROM email_verifications WHERE user_id = ?`
    )
        .bind(userId)
        .first<{ created_at: string }>();

    if (existing) {
        const createdAt = new Date(existing.created_at);
        const secondsSince = (Date.now() - createdAt.getTime()) / 1000;
        if (secondsSince < 60) {
            return {
                success: false,
                error: `Please wait ${Math.ceil(60 - secondsSince)} seconds before requesting a new code.`,
            };
        }
    }

    await sendVerificationEmail(env, userId, email);
    return { success: true };
}

/**
 * Send a password reset OTP.
 */
export async function sendPasswordResetEmail(
    env: EmailEnv,
    userId: string,
    email: string
): Promise<void> {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await env.DB.prepare(`DELETE FROM password_resets WHERE user_id = ?`)
        .bind(userId)
        .run();

    await env.DB.prepare(
        `INSERT INTO password_resets (user_id, otp, expires_at, created_at)
     VALUES (?, ?, ?, datetime('now'))`
    )
        .bind(userId, otp, expiresAt)
        .run();

    await sendEmail(env, email, "Reset your DesignAI password", passwordResetTemplate(otp));
}
