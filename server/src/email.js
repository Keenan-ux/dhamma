// Transactional email via the Resend HTTP API (no SDK — one fetch).
// Currently only the magic-link sign-in email. Dev mode: when RESEND_API_KEY
// is unset and we're not in production, the link is logged and returned to the
// caller as devLink so local sign-in works without sending anything.

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Dhamma <notifications@boothcheck.com>';
const IS_PROD = process.env.NODE_ENV === 'production';

// True when real emails can be sent. Surfaced on /api/me so the sign-in UI can
// tell the user whether to expect an email or use the dev link.
export const emailEnabled = !!RESEND_API_KEY;

// Quiet, typeset sign-in email — academic register, no marketing. Inline styles
// only (email clients ignore <style>/CSS vars); a muted gold rule echoes the app.
function magicLinkHtml(link) {
  return `<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 460px; margin: 0 auto; padding: 32px 0; color: #2b2b2b;">
  <div style="height: 1px; background: #c9b58b; margin-bottom: 24px;"></div>
  <h2 style="font-weight: 500; font-size: 18px; letter-spacing: 0.04em; margin: 0 0 14px;">Sign in to Dhamma</h2>
  <p style="font-size: 15px; line-height: 1.65; color: #4a4a4a; margin: 0 0 24px;">
    Click below to sign in. The link works once and expires in 15 minutes.
  </p>
  <p style="margin: 0 0 28px;">
    <a href="${link}" style="display: inline-block; font-size: 14px; letter-spacing: 0.02em; color: #1a1a1a; text-decoration: none; border: 1px solid #9c7a3c; padding: 10px 22px; border-radius: 4px;">Sign in</a>
  </p>
  <p style="font-size: 12.5px; line-height: 1.6; color: #8a8a8a; margin: 0;">
    If you did not request this, you can ignore this email. The link will expire on its own.
  </p>
  <div style="height: 1px; background: #e6dcc4; margin-top: 28px;"></div>
</div>`;
}

export async function sendMagicLink(to, link) {
  if (!RESEND_API_KEY) {
    // Dev mode: no email service configured. Log the link and (outside prod)
    // hand it back so the sign-in UI can show a direct "Dev sign-in" button.
    console.log(`[email] (dev) magic link for ${to}: ${link}`);
    return { sent: false, devLink: IS_PROD ? undefined : link };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      subject: 'Sign in to Dhamma',
      html: magicLinkHtml(link),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(`[email] Resend send failed ${res.status}: ${detail}`);
    throw new Error('Could not send the sign-in email. Please try again.');
  }
  return { sent: true };
}
