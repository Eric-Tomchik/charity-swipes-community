import { Email } from "@convex-dev/auth/providers/Email";
import { APP_NAME } from "./constants";

declare const process: { env: Record<string, string | undefined> };

function generateOTP() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

async function sendEmail({
  email,
  token,
  subject,
  heading,
  description,
}: {
  email: string;
  token: string;
  subject: string;
  heading: string;
  description: string;
}) {
  const apiUrl = process.env.VIKTOR_SPACES_API_URL;
  const projectName = process.env.VIKTOR_SPACES_PROJECT_NAME;
  const projectSecret = process.env.VIKTOR_SPACES_PROJECT_SECRET;

  if (!apiUrl || !projectName || !projectSecret) {
    throw new Error(
      "Viktor Spaces environment variables not configured. " +
        "Required: VIKTOR_SPACES_API_URL, VIKTOR_SPACES_PROJECT_NAME, VIKTOR_SPACES_PROJECT_SECRET",
    );
  }

  const response = await fetch(`${apiUrl}/api/viktor-spaces/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_name: projectName,
      project_secret: projectSecret,
      to_email: email,
      from_name: "Charity Swipes",
      subject: `${subject} — ${APP_NAME}`,
      html_content: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0A1A; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #E91E63 0%, #FF5C8D 50%, #00E5FF 100%); padding: 20px 28px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; color: #fff; font-weight: 700;">Charity Swipes</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.85);">Community</p>
          </div>
          <div style="padding: 28px 32px;">
            <h2 style="color: #ffffff; margin: 0 0 8px; font-size: 18px;">${heading}</h2>
            <p style="color: #A0A0C0; margin: 0 0 20px; font-size: 15px;">${description}</p>
            <div style="background: #12122A; padding: 24px; text-align: center; border-radius: 10px; border: 1px solid #1A1A3A; margin: 0 0 20px;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #00E5FF;">${token}</span>
            </div>
            <p style="color: #666680; font-size: 12px; margin: 0;">This code expires in 15 minutes.</p>
          </div>
          <div style="border-top: 1px solid #1A1A3A; padding: 16px 32px; text-align: center;">
            <p style="color: #444460; font-size: 11px; margin: 0;">${APP_NAME} · Swipe for a Cause</p>
          </div>
        </div>
      `,
      text_content: `${APP_NAME}\n\n${heading}\n\n${description}\n\nYour code is: ${token}\n\nThis code expires in 15 minutes.\n\n---\n${APP_NAME} · Swipe for a Cause`,
      email_type: "otp",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  const result = (await response.json()) as {
    success: boolean;
    error?: string;
  };
  if (!result.success) {
    throw new Error(`Email sending failed: ${result.error}`);
  }
}

/**
 * Email verification provider for sign-up flow.
 * Sends OTP codes via Viktor Spaces API which:
 * - Rate limits per project (100 emails/hour)
 * - Sends from project-specific email addresses
 * - Keeps the Resend API key secure on the backend
 */
export const ViktorSpacesEmail = Email({
  id: "viktor-spaces-email",
  maxAge: 60 * 15, // 15 minutes

  async generateVerificationToken() {
    return generateOTP();
  },

  async sendVerificationRequest({ identifier: email, token }) {
    await sendEmail({
      email,
      token,
      subject: "Verify your email",
      heading: "Verify your email",
      description: "Your verification code is:",
    });
  },
});

/**
 * Password reset email provider.
 * Uses the same Viktor Spaces API but with different email template.
 */
export const ViktorSpacesPasswordReset = Email({
  id: "viktor-spaces-password-reset",
  maxAge: 60 * 15, // 15 minutes

  async generateVerificationToken() {
    return generateOTP();
  },

  async sendVerificationRequest({ identifier: email, token }) {
    await sendEmail({
      email,
      token,
      subject: "Reset your password",
      heading: "Reset your password",
      description: "Your password reset code is:",
    });
  },
});
