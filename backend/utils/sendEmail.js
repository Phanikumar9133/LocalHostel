const { Resend } = require('resend');

let resend;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.log("⚠️ Resend not configured, skipping emails");
}

const sendBookingNotification = async (ownerEmail, bookingData) => {
  if (!resend) {
    console.log("📧 Email skipped (no API key)");
    return true;
  }

  // normal email code here...
};