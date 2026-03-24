// utils/sendEmail.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendBookingNotification = async (ownerEmail, bookingData) => {
  try {
    console.log(`[RESEND] Starting to send to: ${ownerEmail}`);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const bookingLink = `${frontendUrl}/owner-dashboard`;

    const { data, error } = await resend.emails.send({
      from: `HostelHub <${process.env.EMAIL_FROM}>`,
      to: ownerEmail,
      subject: `New Booking Request - ${bookingData.hostelName || 'Your Hostel'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #00b894; text-align: center;">New Booking Request!</h2>
          <p>A student has requested a seat in your hostel.</p>
          
          <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding:12px; border:1px solid #ddd; font-weight:bold;">Student</td><td style="padding:12px; border:1px solid #ddd;">${bookingData.studentName}</td></tr>
            <tr><td style="padding:12px; border:1px solid #ddd; font-weight:bold;">Hostel</td><td style="padding:12px; border:1px solid #ddd;">${bookingData.hostelName}</td></tr>
            <tr><td style="padding:12px; border:1px solid #ddd; font-weight:bold;">Room Type</td><td style="padding:12px; border:1px solid #ddd;">${bookingData.roomType}</td></tr>
            <tr><td style="padding:12px; border:1px solid #ddd; font-weight:bold;">Check-in Date</td><td style="padding:12px; border:1px solid #ddd;">${bookingData.checkInDate}</td></tr>
            <tr><td style="padding:12px; border:1px solid #ddd; font-weight:bold;">Price</td><td style="padding:12px; border:1px solid #ddd;">₹${bookingData.price}</td></tr>
          </table>

          <div style="text-align:center; margin:40px 0;">
            <a href="${bookingLink}" style="background:#00b894; color:white; padding:16px 40px; text-decoration:none; border-radius:50px; font-size:18px;">
              View & Manage Booking
            </a>
          </div>

          <p style="text-align:center; color:#555; font-size:14px;">
            Sent by HostelHub • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return false;
    }

    console.log(`✅ RESEND EMAIL SENT SUCCESSFULLY to ${ownerEmail}`);
    return true;

  } catch (error) {
    console.error('❌ RESEND FAILED:', error.message);
    return false;
  }
};

module.exports = { sendBookingNotification };