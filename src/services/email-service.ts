interface EmailParams {
  to: string;
  subject: string;
  body: string;
  href?: string;
  recipientName: string;
}

/**
 * Send a transactional email via Resend.
 * Only called when RESEND_API_KEY is configured.
 */
export async function sendOfferEmail(params: EmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const ctaUrl = params.href ? `${baseUrl}${params.href}` : baseUrl;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 16px;border-bottom:1px solid #e4e4e7;">
              <span style="font-size:20px;font-weight:700;color:#18181b;">CouponSwap</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 8px;font-size:16px;color:#18181b;">Hi ${params.recipientName},</p>
              <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.6;">${params.body}</p>
              <a href="${ctaUrl}" style="display:inline-block;padding:10px 24px;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">
                View Details
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;background:#fafafa;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                This is an automated notification from CouponSwap. 
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `CouponSwap <${fromEmail}>`,
        to: [params.to],
        subject: params.subject,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[email-service] Resend API error:", res.status, errBody);
    }
  } catch (error) {
    console.error("[email-service] Failed to send email:", error);
  }
}
