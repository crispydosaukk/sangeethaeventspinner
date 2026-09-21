const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

exports.sendBookingEmail = onCall(async (request) => {
  try {
    const data = request.data;
    
    // Fetch notification settings
    let notificationEmails = 'rahulbadugu22@gmail.com, Svrpinneruk@gmail.com, Digitalbotsolutions@gmail.com';
    let notificationsEnabled = true;
    
    try {
      const settingsDoc = await admin.firestore().collection('site_data').doc('notification_settings').get();
      if (settingsDoc.exists) {
        const settingsData = settingsDoc.data();
        if (settingsData.enabled === false) {
          notificationsEnabled = false;
        }
        if (settingsData.emails && typeof settingsData.emails === 'string' && settingsData.emails.trim() !== '') {
          notificationEmails = settingsData.emails;
        }
      }
    } catch (e) {
      console.error('Error fetching notification settings:', e);
    }

    if (!notificationsEnabled) {
      console.log('Email notifications are disabled in settings. Skipping email.');
      return { success: true, message: 'Emails disabled' };
    }
    
    // Use environment variables or fallback to hardcoded credentials
    const emailUser = process.env.EMAIL_USER || 'mfcentralkitchen@gmail.com';
    const emailPass = process.env.EMAIL_PASS || 'rfznermtzbowtinn';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const serviceName = data.serviceType || 'Booking';
    
    const mailOptions = {
      from: `"Sangeetha Events Pinner" <${emailUser}>`,
      to: notificationEmails,
      subject: `New ${serviceName} Request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #C62127; text-align: center; border-bottom: 2px solid #C62127; padding-bottom: 10px;">New Booking Request</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">You have received a new booking request from your website. Here are the details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tbody>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 30%;">Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Event Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.date || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Time:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.timeOfDay || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Guests:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.guests || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Event Type:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.eventType || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Service Type:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.serviceType || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Package:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.package || 'Not Selected'}</td>
              </tr>
            </tbody>
          </table>
          
          ${data.message ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #C62127;">
            <p style="margin: 0; font-weight: bold;">Message from Customer:</p>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${data.message}</p>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; font-size: 14px; color: #777; text-align: center;">
            This email was automatically generated from your website's booking form.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new HttpsError('internal', 'Failed to send email', error.message);
  }
});
