import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  DEFAULT_EMAIL_NOTIFICATION_CONFIG,
  EmailNotificationConfig,
  sanitizeEmailNotificationConfig,
} from '@/app/data/emailNotificationConfig';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      name,
      email,
      phone,
      eventType,
      serviceType,
      date,
      timeOfDay,
      guests,
      adults,
      kids4to10,
      kidsUnder4,
      message,
      selectedPackage,
      package: pkgName,
      postCode,
      address,
      baseAmount,
      deposit,
    } = body;

    const packageChosen = selectedPackage || pkgName || 'Not Selected';

    // 1. Fetch dynamic email notification settings from Firestore
    let emailConfig: EmailNotificationConfig = { ...DEFAULT_EMAIL_NOTIFICATION_CONFIG };
    try {
      const snap = await getDoc(doc(db, 'site_data', 'email_settings'));
      if (snap.exists()) {
        emailConfig = sanitizeEmailNotificationConfig(snap.data());
      } else {
        // Check backwards compatibility with notification_settings
        const legacySnap = await getDoc(doc(db, 'site_data', 'notification_settings'));
        if (legacySnap.exists()) {
          emailConfig = sanitizeEmailNotificationConfig(legacySnap.data());
        }
      }
    } catch (e) {
      console.warn('Could not read email_settings from Firestore, using default:', e);
    }

    // 2. Check if notifications are enabled
    if (!emailConfig.enabled) {
      return NextResponse.json({
        success: false,
        skipped: true,
        message: 'Enquiry email notifications are turned OFF in Admin Dashboard settings.',
      });
    }

    // 3. Get active recipient emails
    const activeRecipients = (emailConfig.recipients || [])
      .filter((r) => r.enabled && r.email && r.email.includes('@'))
      .map((r) => r.email.trim());

    if (activeRecipients.length === 0) {
      activeRecipients.push('rahulbadugu22@gmail.com', 'Svrpinneruk@gmail.com');
    }

    // 4. Verify SMTP configuration
    const smtp = emailConfig.smtp;
    if (!smtp || !smtp.user || !smtp.pass) {
      console.warn('SMTP credentials not configured. Skipping email dispatch.');
      return NextResponse.json({
        success: false,
        reason: 'smtp_not_configured',
        message: 'Enquiry saved in database. Outgoing SMTP credentials not yet filled in Admin Dashboard.',
        activeRecipients,
      });
    }

    // 5. Create Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: smtp.host || 'smtp.gmail.com',
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

    const sender = `"${smtp.fromName || 'Sangeetha Events Pinner'}" <${smtp.fromEmail || smtp.user}>`;

    // 6. Format Admin Notification Email
    const adminSubject = `✨ New Enquiry: ${name || 'Customer'} - ${eventType || 'Catering'} on ${date || 'TBD'}`;
    const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
    const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}` : '';

    const guestsBreakdown = [
      adults !== undefined && adults !== null ? `${adults} Adults` : null,
      kids4to10 !== undefined && kids4to10 > 0 ? `${kids4to10} Kids (4-10)` : null,
      kidsUnder4 !== undefined && kidsUnder4 > 0 ? `${kidsUnder4} Kids (<4)` : null,
    ].filter(Boolean).join(' • ');

    const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Enquiry</title>
  <style type="text/css">
    html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; }
    table { border-collapse: collapse; margin: 0 auto; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .mobile-padding { padding: 18px 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 20px 8px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.28); border: 1px solid #1E293B;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E1B18 0%, #2A1717 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #ED1C24;">
              <span style="display: inline-block; background: rgba(237, 28, 36, 0.2); color: #F87171; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(237, 28, 36, 0.4); margin-bottom: 12px;">
                🔔 NEW BOOKING ENQUIRY
              </span>
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.3px;">
                Sangeetha Events Pinner
              </h1>
              <p style="color: #FCA5A5; font-size: 13px; font-weight: 600; margin: 6px 0 0 0;">
                Authentic South Indian &amp; Vegetarian Catering • Pinner
              </p>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td class="mobile-padding" style="padding: 28px 24px; background-color: #FFFFFF;">
              
              <!-- Customer Profile Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 14px 18px; background-color: #F1F5F9; border-bottom: 1px solid #E2E8F0;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">
                      👤 Customer Details
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B;">Name</div>
                          <div style="font-size: 16px; font-weight: 800; color: #0F172A;">${name || 'Customer'}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B;">Phone</div>
                          <div style="font-size: 14px; font-weight: 700; color: #0F172A;">
                            <a href="tel:${cleanPhone}" style="color: #ED1C24; text-decoration: none;">${phone || 'N/A'}</a>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 4px;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B;">Email</div>
                          <div style="font-size: 14px; font-weight: 700; color: #0F172A;">
                            <a href="mailto:${email}" style="color: #2563EB; text-decoration: none;">${email || 'N/A'}</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Event Details Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 14px 18px; background-color: #FFEDD5; border-bottom: 1px solid #FED7AA;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #9A3412;">
                      📅 Event &amp; Catering Specifications
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Event Type</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A;">${eventType || 'Catering'}</div>
                        </td>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Service Style</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A;">${serviceType || 'Standard'}</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Event Date</div>
                          <div style="font-size: 14px; font-weight: 800; color: #DC2626;">📅 ${date || 'To be confirmed'}</div>
                        </td>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Time Slot</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A;">⏰ ${timeOfDay || 'Flexible'}</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Guests Count</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A;">👥 ${guests || 'N/A'} Guests</div>
                          ${guestsBreakdown ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${guestsBreakdown}</div>` : ''}
                        </td>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Postcode / Address</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">📍 ${postCode || address || 'N/A'}</div>
                        </td>
                      </tr>
                    </table>

                    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 10px 14px; margin-top: 4px;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #991B1B;">Package Selected</div>
                      <div style="font-size: 14px; font-weight: 800; color: #7F1D1D; margin-top: 2px;">
                        ${packageChosen}
                      </div>
                      ${baseAmount ? `<div style="font-size: 12px; font-weight: 700; color: #991B1B; margin-top: 4px;">Est. Amount: £${baseAmount} ${deposit ? `(Deposit: £${deposit})` : ''}</div>` : ''}
                    </div>

                    ${message ? `
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; margin-top: 10px;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Customer Notes / Special Requests</div>
                      <div style="font-size: 13px; color: #1E293B; margin-top: 4px; line-height: 1.5; white-space: pre-wrap;">${message}</div>
                    </div>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Quick Action Buttons -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  ${whatsappLink ? `
                  <td align="center" style="padding: 4px;">
                    <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #16A34A; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
                      💬 Open Customer Chat on WhatsApp
                    </a>
                  </td>` : ''}
                  <td align="center" style="padding: 4px;">
                    <a href="tel:${cleanPhone}" style="display: inline-block; background-color: #ED1C24; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
                      📞 Call Customer Now
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <div style="border-top: 1px solid #E2E8F0; padding-top: 14px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #64748B;">
                  This notification was automatically dispatched from Sangeetha Events Pinner website.
                </p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8;">
                  Booking ID: ${bookingId || 'New Online Submission'} • Timestamp: ${new Date().toLocaleString('en-GB')}
                </p>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const adminMailOptionsBase = {
      from: sender,
      subject: adminSubject,
      html: adminHtml,
    };

    // 7. Customer Confirmation Email (if enabled)
    let customerMailOptions: any = null;
    if (emailConfig.sendCustomerConfirmation && email && email.includes('@')) {
      const customerSubject = `Thank You for Your Enquiry - Sangeetha Events Pinner`;
      const customerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enquiry Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 20px 8px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.28); border: 1px solid #1E293B;">
          
          <tr>
            <td style="background: linear-gradient(135deg, #1E1B18 0%, #2A1717 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #ED1C24;">
              <span style="display: inline-block; background: rgba(237, 28, 36, 0.2); color: #F87171; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(237, 28, 36, 0.4); margin-bottom: 12px;">
                ✓ ENQUIRY RECEIVED
              </span>
              <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800;">
                Sangeetha Events Pinner
              </h1>
              <p style="color: #FCA5A5; font-size: 12px; font-weight: 600; margin: 5px 0 0 0;">
                Authentic South Indian &amp; Vegetarian Catering • Pinner
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 20px; background-color: #FFFFFF;">
              <h2 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 0 0 10px 0;">
                Hello ${name || 'there'},
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0;">
                Thank you for choosing Sangeetha Events! We have successfully received your catering enquiry. Our team is reviewing your event details and will get in touch shortly with your tailored proposal.
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #F1F5F9; border-bottom: 1px solid #E2E8F0;">
                    <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #B91C1C;">
                      📋 Your Enquiry Summary
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" style="padding-bottom: 8px;">
                          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Event</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${eventType || 'Catering'}</div>
                        </td>
                        <td width="50%" style="padding-bottom: 8px;">
                          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Requested Date</div>
                          <div style="font-size: 13px; font-weight: 700; color: #DC2626;">📅 ${date || 'To be confirmed'}</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom: 8px;">
                          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Time Slot</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">⏰ ${timeOfDay || 'Flexible'}</div>
                        </td>
                        <td width="50%" style="padding-bottom: 8px;">
                          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Guests</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">👥 ${guests || 'N/A'}</div>
                        </td>
                      </tr>
                    </table>

                    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 10px 12px; margin-top: 6px;">
                      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #991B1B;">Package</div>
                      <div style="font-size: 13px; font-weight: 800; color: #7F1D1D;">${packageChosen}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.5; color: #64748B; margin: 0 0 16px 0;">
                Need to add specific dishes or make immediate changes to your date? Feel free to reply directly to this email or speak with us on WhatsApp.
              </p>

              <div style="text-align: center; margin-bottom: 20px;">
                <a href="https://wa.me/447700900000?text=${encodeURIComponent(`Hi Sangeetha Events, I submitted an enquiry for ${date || 'my event'}. Could we discuss my menu?`)}" target="_blank" style="display: inline-block; background-color: #16A34A; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 11px 22px; border-radius: 8px; text-decoration: none;">
                  💬 Chat with Our Event Planner on WhatsApp
                </a>
              </div>

              <div style="border-top: 1px solid #E2E8F0; padding-top: 14px;">
                <p style="margin: 0; font-size: 13px; font-weight: 800; color: #0F172A;">Sangeetha Events Pinner Team</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748B;">Pinner, London, United Kingdom</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      customerMailOptions = {
        from: sender,
        to: email.trim(),
        subject: customerSubject,
        html: customerHtml,
      };
    }

    // 8. Dispatch concurrently to all active admin recipients and customer
    const tasks: Promise<any>[] = [];
    activeRecipients.forEach((recipientEmail) => {
      tasks.push(
        transporter.sendMail({
          ...adminMailOptionsBase,
          to: recipientEmail,
        })
      );
    });

    if (customerMailOptions) {
      tasks.push(transporter.sendMail(customerMailOptions));
    }

    const results = await Promise.allSettled(tasks);

    const adminResults = results.slice(0, activeRecipients.length);
    const adminSent = adminResults.some((r) => r.status === 'fulfilled');
    const firstSuccessfulAdmin = adminResults.find((r) => r.status === 'fulfilled');
    const adminMessageId = firstSuccessfulAdmin ? (firstSuccessfulAdmin as any).value?.messageId : null;

    let customerSent = false;
    if (customerMailOptions) {
      const customerResult = results[results.length - 1];
      customerSent = customerResult.status === 'fulfilled';
      if (customerResult.status === 'rejected') {
        console.warn('Failed to deliver customer confirmation email:', customerResult.reason);
      }
    }

    adminResults.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`Failed to deliver admin notification to ${activeRecipients[idx]}:`, result.reason);
      }
    });

    return NextResponse.json({
      success: adminSent || customerSent,
      messageId: adminMessageId,
      recipients: activeRecipients,
      customerNotified: customerSent,
      adminSent,
    });
  } catch (err: any) {
    console.error('Error in send-enquiry-email API route:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to dispatch email',
      },
      { status: 500 }
    );
  }
}
