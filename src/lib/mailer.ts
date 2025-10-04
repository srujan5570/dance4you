// src/lib/mailer.ts
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = (process.env.SMTP_SECURE || "").toLowerCase();
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@dance4you.app";

function getTransport() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and FROM_EMAIL env vars.");
  }
  const secure = SMTP_SECURE === "true" || SMTP_PORT === 465;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendOtpEmail(toEmail: string, otpCode: string, name?: string) {
  const transporter = getTransport();
  const subject = "Your Dance 4 You verification code";
  const greeting = name ? `Hi ${name},` : "Hi,";
  const text = `${greeting}\n\nYour verification code is: ${otpCode}\nThis code will expire in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
      <p>${greeting}</p>
      <p>Your verification code is:</p>
      <p style="font-size: 22px; font-weight: bold; letter-spacing: 4px;">${otpCode}</p>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, you can ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
      <p style="color:#666;font-size:12px;">Dance 4 You</p>
    </div>
  `;
  await transporter.sendMail({ from: FROM_EMAIL, to: toEmail, subject, text, html });
}