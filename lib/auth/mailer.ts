import { Resend } from 'resend';

export async function sendVerificationEmail(to: string, link: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    console.log(`[email verification] ${to} -> ${link}`);
    return { delivered: false };
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: 'Verify your CareerOrbit email',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address.</p>
        <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">Verify Email</a></p>
        <p>If the button doesn’t work, open this link:</p>
        <p>${link}</p>
      </div>
    `,
  });

  return { delivered: true };
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    console.log(`[welcome email] ${to}`);
    return { delivered: false };
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: 'Welcome to CareerOrbit',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Welcome${name ? `, ${name}` : ''}!</h2>
        <p>You’re all set to track applications, interviews, and outcomes in CareerOrbit.</p>
        <p>If you need help, just reply to this email.</p>
      </div>
    `,
  });

  return { delivered: true };
}
