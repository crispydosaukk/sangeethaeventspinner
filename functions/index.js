const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true });
const path = require("path");
const fs = require("fs");

// Co-locate all Cloud Functions in London (europe-west2) to match the Firestore database location
setGlobalOptions({ region: "europe-west2" });

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Logo configuration:
 * Bundled inside functions/assets/sangeetha-logo.png with fallback to live HTTPS URL.
 * Email clients with CID support render inline immediately without external block prompts.
 */
const logoFilePath = path.join(__dirname, "assets", "sangeetha-logo.png");
const hasLocalLogo = fs.existsSync(logoFilePath);
const logoSrc = hasLocalLogo ? "cid:sangeethalogo" : "https://svrpinnerevents.co.uk/assets/images/sangeetha-logo.png";
const emailAttachments = hasLocalLogo
  ? [
      {
        filename: "sangeetha-logo.png",
        path: logoFilePath,
        cid: "sangeethalogo",
      },
    ]
  : [];

/**
 * Fetch dynamic email notification and SMTP settings from Firestore.
 * Supports the primary 'site_data/email_settings' document as configured
 * from the Admin Dashboard, with fallback to legacy 'site_data/notification_settings'.
 */
async function fetchEmailConfig() {
  const defaultConfig = {
    enabled: true,
    recipients: [
      'rahulbadugu22@gmail.com',
      'Svrpinneruk@gmail.com',
      'Digitalbotsolutions@gmail.com',
    ],
    sendCustomerConfirmation: true,
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      user: process.env.SMTP_USER || process.env.EMAIL_USER || 'zingbiteuk@gmail.com',
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || 'yyozpzropaysxtah',
      fromName: 'Sangeetha Events Pinner',
      fromEmail: process.env.SMTP_FROM || 'zingbiteuk@gmail.com',
    },
  };

  try {
    const db = admin.firestore();
    const snap = await db.collection('site_data').doc('email_settings').get();

    if (snap.exists) {
      const data = snap.data() || {};
      const enabled = data.enabled !== false;

      // Extract enabled recipient email addresses
      let recipients = [];
      if (Array.isArray(data.recipients) && data.recipients.length > 0) {
        recipients = data.recipients
          .filter((r) => r && r.enabled !== false && typeof r.email === 'string' && r.email.includes('@'))
          .map((r) => r.email.trim().toLowerCase());
      } else if (typeof data.emails === 'string' && data.emails.trim().length > 0) {
        recipients = data.emails
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes('@'));
      }

      if (recipients.length === 0) {
        recipients = defaultConfig.recipients;
      }

      const smtpData = data.smtp || {};
      const smtp = {
        host: smtpData.host || defaultConfig.smtp.host,
        port: Number(smtpData.port) || defaultConfig.smtp.port,
        secure: Boolean(smtpData.secure),
        user: smtpData.user || defaultConfig.smtp.user,
        pass: smtpData.pass || defaultConfig.smtp.pass,
        fromName: smtpData.fromName || defaultConfig.smtp.fromName,
        fromEmail: smtpData.fromEmail || smtpData.user || defaultConfig.smtp.fromEmail,
      };

      return {
        enabled,
        recipients,
        sendCustomerConfirmation: data.sendCustomerConfirmation !== false,
        smtp,
      };
    }

    // Fallback: check legacy notification_settings
    const legacySnap = await db.collection('site_data').doc('notification_settings').get();
    if (legacySnap.exists) {
      const leg = legacySnap.data() || {};
      const enabled = leg.enabled !== false;
      let recipients = [];
      if (typeof leg.emails === 'string' && leg.emails.trim().length > 0) {
        recipients = leg.emails
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes('@'));
      }
      return {
        ...defaultConfig,
        enabled,
        recipients: recipients.length > 0 ? recipients : defaultConfig.recipients,
      };
    }
  } catch (err) {
    console.error('Error fetching email configuration from Firestore:', err);
  }

  return defaultConfig;
}

/**
 * Builds HTML template for Admin email notification with logo, clean styling, and no company physical address.
 */
function buildAdminEmailHtml(data, bookingId) {
  const name = data.name || 'Customer';
  const phone = data.phone || 'N/A';
  const email = data.email || 'N/A';
  const date = data.date || 'To be confirmed';
  const timeOfDay = data.timeOfDay || data.timeSession || 'Flexible';
  const eventType = data.eventType || 'Catering';
  const serviceType = data.serviceType || 'Standard';
  const guests = data.guests || data.totalGuests || 'N/A';
  const postCode = data.postCode || data.address || 'N/A';
  const packageChosen = data.selectedPackage || data.package || data.selectedMenu || 'Not Selected';
  const baseAmount = data.baseAmount ? `£${Number(data.baseAmount).toFixed(2)}` : null;
  const totalAmount = (data.totalAmount || data.grandTotal) ? `£${Number(data.totalAmount || data.grandTotal).toFixed(2)}` : null;
  const deposit = data.deposit ? `£${Number(data.deposit).toFixed(2)}` : null;
  const message = data.message || data.notes || '';

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWhatsAppDigits = cleanPhone.replace(/\D/g, '');
  const whatsappLink = cleanWhatsAppDigits ? `https://api.whatsapp.com/send?phone=${cleanWhatsAppDigits}` : null;

  const guestsBreakdown = [
    data.adults !== undefined && data.adults !== null ? `${data.adults} Adults` : null,
    data.kids4to10 !== undefined && data.kids4to10 > 0 ? `${data.kids4to10} Kids (4-10)` : null,
    data.kidsUnder4 !== undefined && data.kidsUnder4 > 0 ? `${data.kidsUnder4} Kids (<4)` : null,
  ].filter(Boolean).join(' • ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Order</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 24px 8px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.3); border: 1px solid #1E293B;">
          
          <!-- Brand Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1A0D0D 0%, #2A1214 50%, #15221B 100%); padding: 28px 24px; text-align: center; border-bottom: 3px solid #C62127;">
              <div style="margin-bottom: 12px; text-align: center;">
                <img src="${logoSrc}" alt="Sangeetha Events Pinner" width="180" style="max-width: 180px; width: 180px; height: auto; display: block; margin: 0 auto;" />
              </div>
              <span style="display: inline-block; background: rgba(198, 33, 39, 0.2); color: #FCA5A5; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(198, 33, 39, 0.4); margin-bottom: 8px;">
                🔔 NEW BOOKING ORDER RECEIVED
              </span>
              <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.3px;">
                Sangeetha Events Pinner
              </h1>
              <p style="color: #F87171; font-size: 13px; font-weight: 600; margin: 6px 0 0 0;">
                South Indian &amp; Pure Vegetarian Catering
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px 24px; background-color: #FFFFFF;">
              
              <!-- Customer Profile Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 18px; background-color: #F1F5F9; border-bottom: 1px solid #E2E8F0;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #475569;">
                      👤 Customer Contact Profile
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B;">Client Name</div>
                          <div style="font-size: 17px; font-weight: 800; color: #0F172A;">${name}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B;">Phone</div>
                          <div style="font-size: 14px; font-weight: 700;">
                            <a href="tel:${cleanPhone}" style="color: #C62127; text-decoration: none;">${phone}</a>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 4px;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748B;">Email</div>
                          <div style="font-size: 14px; font-weight: 700;">
                            <a href="mailto:${email}" style="color: #2563EB; text-decoration: none;">${email}</a>
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
                  <td style="padding: 12px 18px; background-color: #FFEDD5; border-bottom: 1px solid #FED7AA;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #9A3412;">
                      📅 Event &amp; Service Specifications
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Event Type</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A;">${eventType}</div>
                        </td>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Service Style</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A;">${serviceType}</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Date</div>
                          <div style="font-size: 14px; font-weight: 800; color: #DC2626;">${date}</div>
                        </td>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Time Session</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A;">${timeOfDay}</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Guests Count</div>
                          <div style="font-size: 14px; font-weight: 800; color: #0F172A;">${guests} Guests</div>
                          ${guestsBreakdown ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${guestsBreakdown}</div>` : ''}
                        </td>
                        <td width="50%" style="padding-bottom: 12px; vertical-align: top;">
                          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7C2D12;">Event Location</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${postCode}</div>
                        </td>
                      </tr>
                    </table>

                    <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px 14px; margin-top: 6px;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #991B1B;">Package / Menu</div>
                      <div style="font-size: 15px; font-weight: 800; color: #7F1D1D; margin-top: 2px;">
                        ${packageChosen}
                      </div>
                      ${(totalAmount || baseAmount) ? `
                        <div style="font-size: 13px; font-weight: 700; color: #991B1B; margin-top: 6px;">
                          ${totalAmount ? `Total Estimate: ${totalAmount}` : `Est. Base: ${baseAmount}`}
                          ${deposit ? ` • Deposit: ${deposit}` : ''}
                        </div>
                      ` : ''}
                    </div>

                    ${message ? `
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; margin-top: 10px;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Customer Special Notes</div>
                      <div style="font-size: 13px; color: #1E293B; margin-top: 4px; line-height: 1.5; white-space: pre-wrap;">${message}</div>
                    </div>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Quick Action Buttons -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 22px;">
                <tr>
                  ${whatsappLink ? `
                  <td align="center" style="padding: 4px;">
                    <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #16A34A; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 12px 20px; border-radius: 10px; text-decoration: none;">
                      💬 Open WhatsApp Chat
                    </a>
                  </td>` : ''}
                  <td align="center" style="padding: 4px;">
                    <a href="tel:${cleanPhone}" style="display: inline-block; background-color: #C62127; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 12px 20px; border-radius: 10px; text-decoration: none;">
                      📞 Call Customer
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Clean Footer without company address -->
              <div style="border-top: 1px solid #E2E8F0; padding-top: 14px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #64748B;">
                  Dispatched by Sangeetha Events Notification Service.
                </p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #94A3B8;">
                  Reference: ${bookingId || 'New Entry'} • ${new Date().toLocaleString('en-GB')}
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
}

/**
 * Builds HTML template for Customer confirmation receipt email with logo, clean styling, and no company physical address.
 */
function buildCustomerEmailHtml(data) {
  const name = data.name || 'Valued Guest';
  const date = data.date || 'To be confirmed';
  const timeOfDay = data.timeOfDay || data.timeSession || 'Flexible';
  const eventType = data.eventType || 'Catering';
  const guests = data.guests || data.totalGuests || 'N/A';
  const packageChosen = data.selectedPackage || data.package || data.selectedMenu || 'Not Selected';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Enquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A;">
    <tr>
      <td align="center" style="padding: 24px 8px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.3); border: 1px solid #1E293B;">
          
          <!-- Header Banner with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1A0D0D 0%, #2A1214 100%); padding: 28px 20px; text-align: center; border-bottom: 3px solid #C62127;">
              <div style="margin-bottom: 12px; text-align: center;">
                <img src="${logoSrc}" alt="Sangeetha Events Pinner" width="180" style="max-width: 180px; width: 180px; height: auto; display: block; margin: 0 auto;" />
              </div>
              <span style="display: inline-block; background: rgba(198, 33, 39, 0.2); color: #FCA5A5; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(198, 33, 39, 0.4); margin-bottom: 8px;">
                ✓ ENQUIRY CONFIRMATION
              </span>
              <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; font-weight: 800;">
                Sangeetha Events Pinner
              </h1>
              <p style="color: #F87171; font-size: 12px; font-weight: 600; margin: 5px 0 0 0;">
                South Indian &amp; Pure Vegetarian Catering
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 20px; background-color: #FFFFFF;">
              <h2 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 0 0 10px 0;">
                Hello ${name},
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0;">
                Thank you for choosing Sangeetha Events! We have received your booking request. Our team will review the details and get back to you shortly with availability and pricing proposals.
              </p>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #F1F5F9; border-bottom: 1px solid #E2E8F0;">
                    <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B91C1C;">
                      Your Requested Event Details
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" style="padding-bottom: 8px;">
                          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Event</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${eventType}</div>
                        </td>
                        <td width="50%" style="padding-bottom: 8px;">
                          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Requested Date</div>
                          <div style="font-size: 13px; font-weight: 700; color: #DC2626;">${date}</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom: 8px;">
                          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Time Slot</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${timeOfDay}</div>
                        </td>
                        <td width="50%" style="padding-bottom: 8px;">
                          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748B;">Guests</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${guests}</div>
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

              <div style="text-align: center; margin-bottom: 20px;">
                <a href="https://api.whatsapp.com/send?phone=447507271506&text=${encodeURIComponent(`Hi Sangeetha Events, I submitted a booking enquiry for ${date}. I would like to discuss details.`)}" target="_blank" style="display: inline-block; background-color: #16A34A; color: #FFFFFF; font-size: 13px; font-weight: 800; padding: 11px 22px; border-radius: 8px; text-decoration: none;">
                  💬 Chat on WhatsApp with Event Planner
                </a>
              </div>

              <!-- Clean Sign-off without company address -->
              <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; text-align: center;">
                <p style="margin: 0; font-size: 13px; font-weight: 800; color: #0F172A;">Sangeetha Events Team</p>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748B;">Authentic South Indian &amp; Pure Vegetarian Catering</p>
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
}

/**
 * Core dispatch function that sends email to active admin recipients
 * and confirmation to customer using dynamically configured SMTP with logo attachment.
 */
async function dispatchOrderEmails(data, bookingId) {
  const config = await fetchEmailConfig();

  // Check master on/off switch
  if (!config.enabled) {
    console.log(`[Cloud Functions] Email notifications disabled in settings. Skipping for booking: ${bookingId}`);
    return { success: true, skipped: true, reason: 'notifications_disabled' };
  }

  const recipients = config.recipients;
  if (!recipients || recipients.length === 0) {
    console.warn(`[Cloud Functions] No active recipient email addresses configured. Skipping.`);
    return { success: false, skipped: true, reason: 'no_recipients' };
  }

  const smtp = config.smtp;
  if (!smtp || !smtp.user || !smtp.pass) {
    console.warn('[Cloud Functions] SMTP user or pass missing. Cannot dispatch emails.');
    return { success: false, reason: 'smtp_not_configured' };
  }

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

  const fromSender = `"${smtp.fromName || 'Sangeetha Events Pinner'}" <${smtp.fromEmail || smtp.user}>`;
  const serviceName = data.eventType || data.serviceType || 'Booking';
  const customerName = data.name || 'Customer';
  const eventDate = data.date || 'TBD';

  const adminSubject = `[New Order] ${customerName} - ${serviceName} on ${eventDate}`;
  const adminHtml = buildAdminEmailHtml(data, bookingId);

  const tasks = [];

  // Dispatch to all active admin recipients
  recipients.forEach((recipientEmail) => {
    tasks.push(
      transporter.sendMail({
        from: fromSender,
        to: recipientEmail,
        subject: adminSubject,
        html: adminHtml,
        attachments: emailAttachments,
      })
    );
  });

  // Customer confirmation email (with logo & clean formatting)
  const customerEmail = data.email && typeof data.email === 'string' ? data.email.trim() : null;
  if (config.sendCustomerConfirmation !== false && customerEmail && customerEmail.includes('@')) {
    tasks.push(
      transporter.sendMail({
        from: fromSender,
        to: customerEmail,
        subject: 'Thank You for Your Enquiry - Sangeetha Events Pinner',
        html: buildCustomerEmailHtml(data),
        attachments: emailAttachments,
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  const adminResults = results.slice(0, recipients.length);
  const adminSuccess = adminResults.some((r) => r.status === 'fulfilled');

  adminResults.forEach((res, idx) => {
    if (res.status === 'rejected') {
      console.error(`[Cloud Functions] Failed to deliver to ${recipients[idx]}:`, res.reason);
    } else {
      console.log(`[Cloud Functions] Successfully sent booking notification to ${recipients[idx]}`);
    }
  });

  return {
    success: adminSuccess,
    recipients,
    totalDispatched: tasks.length,
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FIRESTORE TRIGGER: Automatically fires when a booking/order is placed
 * in the 'booking_requests' collection (used by both the website form & admin direct booking).
 * ─────────────────────────────────────────────────────────────────────────────
 */
exports.onBookingRequestCreated = onDocumentCreated(
  {
    document: "booking_requests/{bookingId}",
    region: "europe-west2",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log('[Cloud Functions] No data associated with event.');
      return;
    }

    const bookingId = event.params.bookingId;
    const bookingData = snap.data() || {};

    // Prevent duplicate sending if already handled
    if (bookingData.emailNotificationSent) {
      console.log(`[Cloud Functions] Booking ${bookingId} already has emailNotificationSent=true. Skipping.`);
      return;
    }

    console.log(`[Cloud Functions] New booking detected in booking_requests: ${bookingId}`);

    try {
      const result = await dispatchOrderEmails(bookingData, bookingId);

      if (result && result.success) {
        // Mark document to prevent double-firing
        await snap.ref.set(
          {
            emailNotificationSent: true,
            emailSentAt: new Date().toISOString(),
            notifiedRecipients: result.recipients || [],
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error(`[Cloud Functions] Error executing onBookingRequestCreated for ${bookingId}:`, error);
    }
  }
);

/**
 * Secondary Firestore trigger for 'bookings/{bookingId}'
 * to ensure that any direct booking entries created into the bookings collection
 * also trigger email dispatch if not already processed.
 */
exports.onBookingCreated = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    region: "europe-west2",
  },
  async (event) => {
  const snap = event.data;
  if (!snap) return;

  const bookingId = event.params.bookingId;
  const bookingData = snap.data() || {};

  // If already marked as sent on this doc or in booking_requests, skip
  if (bookingData.emailNotificationSent) {
    return;
  }

  try {
    const db = admin.firestore();
    const reqDoc = await db.collection('booking_requests').doc(bookingId).get();
    if (reqDoc.exists && reqDoc.data()?.emailNotificationSent) {
      console.log(`[Cloud Functions] Booking ${bookingId} was already emailed via booking_requests trigger. Skipping.`);
      return;
    }

    const result = await dispatchOrderEmails(bookingData, bookingId);
    if (result && result.success) {
      await snap.ref.set(
        {
          emailNotificationSent: true,
          emailSentAt: new Date().toISOString(),
          notifiedRecipients: result.recipients || [],
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error(`[Cloud Functions] Error executing onBookingCreated for ${bookingId}:`, error);
  }
});

/**
 * Callable Cloud Function: sendBookingEmail
 * Allows manual or client-side triggering from Next.js via httpsCallable(functions, 'sendBookingEmail').
 */
exports.sendBookingEmail = onCall(async (request) => {
  try {
    const data = request.data || {};
    const bookingId = data.bookingId || data.id || `CALL-${Date.now()}`;
    const result = await dispatchOrderEmails(data, bookingId);
    return {
      success: result.success !== false,
      message: result.success ? 'Email sent successfully via Cloud Functions' : 'Emails skipped or failed',
      recipients: result.recipients,
    };
  } catch (error) {
    console.error('[Cloud Functions] Error in sendBookingEmail onCall:', error);
    throw new HttpsError('internal', error.message || 'Failed to dispatch email');
  }
});

/**
 * HTTP Webhook: sendBookingEmailHttp
 * Allows standard POST HTTP triggers from third-party services or client webhooks.
 */
exports.sendBookingEmailHttp = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
      const data = req.body || {};
      const bookingId = data.bookingId || data.id || `HTTP-${Date.now()}`;
      const result = await dispatchOrderEmails(data, bookingId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('[Cloud Functions] Error in sendBookingEmailHttp:', error);
      return res.status(500).json({ error: error.message || 'Failed to send email' });
    }
  });
});
