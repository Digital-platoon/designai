import { createLogger } from "../../logger";

const logger = createLogger('EmailService');

/**
 * Service for sending emails via Resend
 */
export class EmailService {
    private apiKey: string;
    private fromEmail: string = "DesignAI <no-reply@designai.dev>";

    constructor(env: Env) {
        this.apiKey = env.RESEND_API_KEY || '';
    }

    /**
     * Send a verification email with an OTP
     */
    async sendVerificationEmail(to: string, otp: string): Promise<boolean> {
        if (!this.apiKey) {
            logger.warn('RESEND_API_KEY not configured. Skipping email sending. OTP is logged below for development.', { to });
            console.log(`[AUTH-DEV] Verification code for ${to}: ${otp}`);
            return true; // Return true in dev if not configured? Or handle differently?
        }

        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: [to],
                    subject: 'Verify your DesignAI account',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #000;">Welcome to DesignAI!</h2>
                            <p>Verify your account by entering the following code:</p>
                            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; border-radius: 8px; margin: 20px 0;">
                                ${otp}
                            </div>
                            <p>This code will expire in 15 minutes.</p>
                            <p>If you didn't create an account with DesignAI, you can safely ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="color: #666; font-size: 12px;">Sent by DesignAI Platform</p>
                        </div>
                    `,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                logger.error('Failed to send email via Resend', { to, status: response.status, error: errorData });
                return false;
            }

            logger.info('Verification email sent successfully', { to });
            return true;
        } catch (error) {
            logger.error('Error sending verification email', { to, error });
            return false;
        }
    }
}
