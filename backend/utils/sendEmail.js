// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendBookingNotification = async (ownerEmail, bookingData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const bookingLink = `${process.env.FRONTEND_URL}/owner-dashboard?booking=${bookingData._id}`;

    const mailOptions = {
      from: `"HostelHub Booking Alert" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `New Booking Request - ${bookingData.hostelName || 'Your Hostel'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #00b894; text-align: center; margin-bottom: 20px;">New Booking Request!</h2>
          
          <p style="font-size: 1.05rem; color: #333;">A student has just requested a seat in your hostel:</p>

          <table style="width: 100%; margin: 20px 0; border-collapse: collapse; font-size: 1rem;">
            <tr style="background: #f8fffb;">
              <td style="padding: 12px; border: 1px solid #e0f0e8;"><strong>Student Name</strong></td>
              <td style="padding: 12px; border: 1px solid #e0f0e8;">${bookingData.studentName || 'Student'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e0f0e8;"><strong>Room Type</strong></td>
              <td style="padding: 12px; border: 1px solid #e0f0e8;">${bookingData.roomType}</td>
            </tr>
            <tr style="background: #f8fffb;">
              <td style="padding: 12px; border: 1px solid #e0f0e8;"><strong>Check-in Date</strong></td>
              <td style="padding: 12px; border: 1px solid #e0f0e8;">${new Date(bookingData.checkInDate).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e0f0e8;"><strong>Price</strong></td>
              <td style="padding: 12px; border: 1px solid #e0f0e8;">₹${bookingData.price}/month</td>
            </tr>
            <tr style="background: #f8fffb;">
              <td style="padding: 12px; border: 1px solid #e0f0e8;"><strong>Hostel</strong></td>
              <td style="padding: 12px; border: 1px solid #e0f0e8;">${bookingData.hostelName || 'Your Hostel'}</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${bookingLink}"
               style="background: linear-gradient(135deg, #00b894, #009b85); 
                      color: white; 
                      padding: 16px 40px; 
                      text-decoration: none; 
                      border-radius: 50px; 
                      font-size: 1.15rem; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(0,184,148,0.3);">
              View & Accept / Reject Booking
            </a>
          </div>

          <p style="color: #555; font-size: 0.95rem; text-align: center; margin-top: 20px;">
            Button not working? Copy-paste this link:<br>
            <a href="${bookingLink}" style="color: #00b894;">${bookingLink}</a>
          </p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 35px 0;">

          <p style="font-size: 0.85rem; color: #888; text-align: center;">
            Sent by HostelHub • ${new Date().toLocaleString('en-IN')}
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Owner email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
};

module.exports = { sendBookingNotification };