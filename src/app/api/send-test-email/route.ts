import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { SmtpConfig } from '@/app/data/emailNotificationConfig';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { smtp, testRecipient }: { smtp: SmtpConfig; testRecipient: string } = body;

    if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
      return NextResponse.json(
        { success: false, error: 'Please enter SMTP Host, Username/Email, and Password.' },
        { status: 400 }
      );
    }

    if (!testRecipient || !testRecipient.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid test recipient email address.' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port) || 587,
      secure: Boolean(smtp.secure),
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const sender = `"${smtp.fromName || 'Sangeetha Events Test'}" <${smtp.fromEmail || smtp.user}>`;

    const testHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA; padding: 24px; color: #1F2937;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #E5E7EB; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="width: 52px; height: 52px; background: #ECFDF5; color: #059669; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 16px;">
      ✓
    </div>
    <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px;">Email Integration Working!</h2>
    <p style="color: #4B5563; font-size: 14px; margin: 0 0 16px 0;">
      This test message confirms that your SMTP mail server settings are configured correctly and sending emails from <strong>Sangeetha Events Pinner</strong>.
    </p>
    <div style="background: #F9FAFB; border-radius: 10px; padding: 14px; font-size: 12px; text-align: left; color: #4B5563; border: 1px solid #E5E7EB;">
      <p style="margin: 3px 0;"><strong>Host:</strong> ${smtp.host}:${smtp.port}</p>
      <p style="margin: 3px 0;"><strong>Sender Account:</strong> ${smtp.user}</p>
      <p style="margin: 3px 0;"><strong>Delivered To:</strong> ${testRecipient}</p>
      <p style="margin: 3px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-GB')}</p>
    </div>
    <p style="margin: 16px 0 0 0; font-size: 12px; color: #9CA3AF;">
      Sangeetha Events Pinner • System Notification
    </p>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: sender,
      to: testRecipient.trim(),
      subject: '[Success] Sangeetha Events: SMTP Mail Server Test Succeeded',
      html: testHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${testRecipient}!`,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error('Error sending test email:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to connect to SMTP mail server. Please check your credentials.',
      },
      { status: 500 }
    );
  }
}
