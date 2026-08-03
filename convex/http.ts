import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const APP_NAME = "Charity Swipes";

declare const process: { env: Record<string, string | undefined> };

const http = httpRouter();
auth.addHttpRoutes(http);

// ─── Contact Form (main website charityswipes.org) ───
const contactFormHandler = httpAction(async (_ctx, request) => {
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const data = (await request.json()) as {
      name?: string;
      business?: string;
      email?: string;
      phone?: string;
      service?: string;
      message?: string;
    };

    const { name, business, email, phone, service, message } = data;

    if (!name || !email) {
      return new Response(
        JSON.stringify({ success: false, error: "Name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiUrl = process.env.VIKTOR_SPACES_API_URL;
    const projectName = process.env.VIKTOR_SPACES_PROJECT_NAME;
    const projectSecret = process.env.VIKTOR_SPACES_PROJECT_SECRET;

    if (!apiUrl || !projectName || !projectSecret) {
      throw new Error("Viktor Spaces email env vars not configured");
    }

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A1A; color: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #E91E63 0%, #FF5C8D 50%, #00E5FF 100%); padding: 24px 32px;">
          <h1 style="margin: 0; font-size: 22px; color: #fff;">New Lead from CharitySwipes.org</h1>
        </div>
        <div style="padding: 28px 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #1A1A3A;">
              <td style="padding: 12px 0; color: #A0A0C0; font-size: 14px; width: 120px;">Name</td>
              <td style="padding: 12px 0; color: #fff; font-size: 14px; font-weight: 600;">${name}</td>
            </tr>
            ${business ? `<tr style="border-bottom: 1px solid #1A1A3A;"><td style="padding: 12px 0; color: #A0A0C0; font-size: 14px;">Business</td><td style="padding: 12px 0; color: #fff; font-size: 14px;">${business}</td></tr>` : ""}
            <tr style="border-bottom: 1px solid #1A1A3A;">
              <td style="padding: 12px 0; color: #A0A0C0; font-size: 14px;">Email</td>
              <td style="padding: 12px 0; color: #00E5FF; font-size: 14px;">${email}</td>
            </tr>
            ${phone ? `<tr style="border-bottom: 1px solid #1A1A3A;"><td style="padding: 12px 0; color: #A0A0C0; font-size: 14px;">Phone</td><td style="padding: 12px 0; color: #fff; font-size: 14px;">${phone}</td></tr>` : ""}
            ${service ? `<tr style="border-bottom: 1px solid #1A1A3A;"><td style="padding: 12px 0; color: #A0A0C0; font-size: 14px;">Service</td><td style="padding: 12px 0; color: #E91E63; font-size: 14px; font-weight: 600;">${service}</td></tr>` : ""}
            ${message ? `<tr><td style="padding: 12px 0; color: #A0A0C0; font-size: 14px; vertical-align: top;">Message</td><td style="padding: 12px 0; color: #fff; font-size: 14px;">${message}</td></tr>` : ""}
          </table>
        </div>
        <div style="padding: 16px 32px; background: #12122A; text-align: center;">
          <p style="margin: 0; color: #6B6B8D; font-size: 12px;">Submitted via charityswipes.org contact form</p>
        </div>
      </div>
    `;

    const textContent = [
      `New Lead from CharitySwipes.org`,
      ``,
      `Name: ${name}`,
      business ? `Business: ${business}` : null,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      service ? `Service: ${service}` : null,
      message ? `Message: ${message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const recipients = ["eric@charityswipes.com", "matt@charityswipes.com"];

    for (const recipient of recipients) {
      const response = await fetch(`${apiUrl}/api/viktor-spaces/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          project_secret: projectSecret,
          to_email: recipient,
          subject: `New Lead: ${name}${business ? ` - ${business}` : ""} | ${APP_NAME}`,
          html_content: htmlContent,
          text_content: textContent,
          email_type: "notification",
        }),
      });
      if (!response.ok) {
        console.error(`Failed to send to ${recipient}:`, await response.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Form submitted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Submission failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

http.route({
  path: "/contact-form",
  method: "POST",
  handler: contactFormHandler,
});

http.route({
  path: "/contact-form",
  method: "OPTIONS",
  handler: contactFormHandler,
});

export default http;
