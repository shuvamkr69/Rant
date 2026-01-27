import nodemailer from "nodemailer";

// Create transporter
const createTransporter = () => {
  // For development, use a test account or Gmail
  // For production, use your actual email service

  return nodemailer.createTransport({
    service: "gmail", // You can use 'gmail', 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
    },
  });
};

/**
 * Send report notification email
 * @param {Object} reportData - Report details
 */
export const sendReportEmail = async (reportData) => {
  try {
    const transporter = createTransporter();

    const {
      reporterName,
      reporterEmail,
      reportedUserName,
      reportedUserId,
      reason,
      message,
      reportId,
      timestamp,
    } = reportData;

    // Format the reason for better readability
    const formattedReason = reason
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const mailOptions = {
      from: `"Rant Support" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // Admin email to receive reports
      subject: `🚨 New User Report - ${formattedReason}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #000000 0%, #2A2A2A 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .report-box { background: white; padding: 20px; border-left: 4px solid #ff4444; margin: 20px 0; border-radius: 4px; }
            .info-row { margin: 12px 0; padding: 10px; background: #fff; border-radius: 4px; }
            .label { font-weight: bold; color: #2A2A2A; display: inline-block; width: 180px; }
            .value { color: #333; }
            .message-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .urgent { color: #ff4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🚨 User Report Received</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">A user has reported another user on Rant</p>
            </div>
            <div class="content">
              <div class="report-box">
                <h2 style="margin-top: 0; color: #ff4444;">Report Details</h2>
                
                <div class="info-row">
                  <span class="label">Report ID:</span>
                  <span class="value">${reportId}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Date & Time:</span>
                  <span class="value">${new Date(timestamp).toLocaleString(
                    "en-US",
                    {
                      dateStyle: "full",
                      timeStyle: "long",
                    },
                  )}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Reason:</span>
                  <span class="value urgent">${formattedReason}</span>
                </div>
                
                <h3 style="color: #2A2A2A; margin-top: 25px;">Reporter Information</h3>
                
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span class="value">${reporterName}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${reporterEmail || "Not provided"}</span>
                </div>
                
                <h3 style="color: #ff4444; margin-top: 25px;">Reported User Information</h3>
                
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span class="value">${reportedUserName}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">User ID:</span>
                  <span class="value">${reportedUserId}</span>
                </div>
                
                <div class="message-box">
                  <h3 style="margin-top: 0; color: #856404;">User's Message:</h3>
                  <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 4px; border-left: 4px solid #2196F3; margin-top: 20px;">
                <p style="margin: 0; color: #0d47a1;">
                  <strong>⚠️ Action Required:</strong> Please review this report and take appropriate action if necessary.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated message from Rant Support System</p>
                <p style="color: #999; font-size: 11px;">Please do not reply to this email</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        NEW USER REPORT RECEIVED
        
        Report ID: ${reportId}
        Date & Time: ${new Date(timestamp).toLocaleString()}
        Reason: ${formattedReason}
        
        REPORTER:
        Name: ${reporterName}
        Email: ${reporterEmail || "Not provided"}
        
        REPORTED USER:
        Name: ${reportedUserName}
        User ID: ${reportedUserId}
        
        MESSAGE:
        ${message}
        
        Please review this report and take appropriate action.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Report email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending report email:", error);
    throw error;
  }
};
