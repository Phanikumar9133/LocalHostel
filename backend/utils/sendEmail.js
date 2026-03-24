// utils/sendEmail.js
// FULL CORRECTED VERSION - Enhanced with longer timeouts for Render free tier + Gmail

const nodemailer = require('nodemailer');

const sendBookingNotification = async (ownerEmail, bookingData) => {
  try {
    console.log(`[EMAIL] Starting to send notification to: ${ownerEmail}`);

    // Create transporter with extended timeouts for Render cold starts
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ''),
      },
      tls: {
        rejectUnauthorized: false
      },
      // Extended timeouts to handle Render free tier cold starts and Gmail delays
      connectionTimeout: 60000,   // 60 seconds
      socketTimeout: 90000,       // 90 seconds
      pool: true,
      maxConnections: 1,
      rateDelta: 2000,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const bookingLink = `${frontendUrl}/owner-dashboard`;

    const mailOptions = {
      from: `"HostelHub Booking Alert" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `New Booking Request - ${bookingData.hostelName || 'Your Hostel'}`,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff; color: #333;">
          <h2 style="color: #00b894; text-align: center; margin-bottom: 24px;">New Booking Request!</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">A student has requested a seat in your hostel:</p>

          <table style="width: 100%; margin: 25px 0; border-collapse: collapse; font-size: 15px;">
            <tr style="background: #f8fffb;">
              <td style="padding: 14px; border: 1px solid #d0e8df; font-weight: bold;">Student Name</td>
              <td style="padding: 14px; border: 1px solid #d0e8df;">${bookingData.studentName || 'Student'}</td>
            </tr>
            <tr>
              <td style="padding: 14px; border: 1px solid #d0e8df; font-weight: bold;">Hostel</td>
              <td style="padding: 14px; border: 1px solid #d0e8df;">${bookingData.hostelName || 'Your Hostel'}</td>
            </tr>
            <tr style="background: #f8fffb;">
              <td style="padding: 14px; border: 1px solid #d0e8df; font-weight: bold;">Room Type</td>
              <td style="padding: 14px; border: 1px solid #d0e8df;">${bookingData.roomType || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 14px; border: 1px solid #d0e8df; font-weight: bold;">Check-in Date</td>
              <td style="padding: 14px; border: 1px solid #d0e8df;">${bookingData.checkInDate ? new Date(bookingData.checkInDate).toLocaleDateString('en-IN') : 'N/A'}</td>
            </tr>
            <tr style="background: #f8fffb;">
              <td style="padding: 14px; border: 1px solid #d0e8df; font-weight: bold;">Price</td>
              <td style="padding: 14px; border: 1px solid #d0e8df;">₹${bookingData.price || 'N/A'}/month</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${bookingLink}" 
               style="background: linear-gradient(135deg, #00b894, #009b85); 
                      color: white; 
                      padding: 16px 40px; 
                      text-decoration: none; 
                      border-radius: 50px; 
                      font-size: 18px; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(0,184,148,0.3);">
              View & Manage Booking
            </a>
          </div>

          <p style="color: #555; font-size: 14px; text-align: center; margin: 20px 0;">
            Button not working? Copy and paste this link:<br>
            <a href="${bookingLink}" style="color: #00b894; word-break: break-all;">${bookingLink}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="font-size: 13px; color: #777; text-align: center;">
            Sent by HostelHub • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ EMAIL SENT SUCCESSFULLY → Message ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ EMAIL SENDING FAILED:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    if (error.response) console.error('SMTP Response:', error.response);
    return false;
  }
};

module.exports = { sendBookingNotification };