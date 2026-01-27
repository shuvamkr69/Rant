# Email Setup Guide for Report Notifications

This guide will help you configure email notifications for user reports in the Rant app.

## Overview

When a user reports a listener, an email notification is automatically sent to the admin email address using nodemailer.

## Prerequisites

- A Gmail account (or any other email service)
- Access to generate app-specific passwords (for Gmail)

## Setup Instructions

### 1. Generate Gmail App-Specific Password (Recommended)

If you're using Gmail, you need to generate an app-specific password:

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google," enable **2-Step Verification** (if not already enabled)
4. Once 2-Step Verification is enabled, go back to Security
5. Under "How you sign in to Google," click on **App passwords**
6. Select **Mail** as the app and **Other** as the device
7. Enter "Rant App" as the custom name
8. Click **Generate**
9. Copy the 16-character password (this is your `EMAIL_PASSWORD`)

### 2. Configure Environment Variables

Create a `.env` file in the root of your project (if it doesn't exist) and add:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Your 16-character app password
ADMIN_EMAIL=admin@yourdomain.com    # Where reports should be sent
```

**Important:**

- Never commit your `.env` file to version control
- Add `.env` to your `.gitignore` file
- Use the `.env.example` file as a template

### 3. Using Other Email Providers

#### Outlook/Hotmail

```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Yahoo

```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

#### Custom SMTP Server

Edit `backend/src/utils/emailService.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.yourserver.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

## Email Features

### Report Email Contains:

- ✅ Report ID for tracking
- ✅ Date and time of report
- ✅ Reason for report (formatted)
- ✅ Reporter information (name, email)
- ✅ Reported user information (name, ID)
- ✅ Custom message from reporter
- ✅ Professional HTML formatting
- ✅ Plain text fallback

### Security Features:

- Only authenticated users can submit reports
- Only "User" type accounts can report "Listener" type accounts
- Message length limited to 500 characters
- Reports stored in database with timestamps
- Admin email kept private (not exposed to users)

## Testing the Email Functionality

### 1. Test Email Sending (Backend)

Create a test file `backend/src/test-email.js`:

```javascript
import dotenv from "dotenv";
import { sendReportEmail } from "./utils/emailService.js";

dotenv.config();

const testReport = {
  reporterName: "Test User",
  reporterEmail: "testuser@example.com",
  reportedUserName: "Test Listener",
  reportedUserId: "123456789",
  reason: "inappropriate_behavior",
  message: "This is a test report message.",
  reportId: "TEST-001",
  timestamp: new Date(),
};

sendReportEmail(testReport)
  .then(() => {
    console.log("✅ Test email sent successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test email failed:", error);
    process.exit(1);
  });
```

Run: `node backend/src/test-email.js`

### 2. Test from Frontend

1. Login as a "User" (not a Listener)
2. Open a chat with any Listener
3. Click the flag icon (🏁) in the header
4. Select a reason and write a message
5. Submit the report
6. Check your admin email inbox

## Troubleshooting

### Issue: "Invalid login" or "Authentication failed"

**Solution:**

- Make sure you're using an app-specific password, not your regular Gmail password
- Verify 2-Step Verification is enabled in your Google account
- Double-check the EMAIL_USER and EMAIL_PASSWORD in `.env`

### Issue: "Connection timeout"

**Solution:**

- Check your internet connection
- Verify the email service is not blocked by firewall
- Try using port 465 with `secure: true` in emailService.js

### Issue: Emails go to spam

**Solution:**

- Set up SPF and DKIM records for your domain (if using custom domain)
- Use a verified email address
- Add your email to recipient's contacts

### Issue: "No EMAIL_USER found"

**Solution:**

- Make sure `.env` file exists in the root directory
- Verify the backend is loading environment variables correctly
- Restart your backend server after adding `.env` variables

## Email Service Configuration

The email service is located at: `backend/src/utils/emailService.js`

You can customize:

- Email template (HTML and plain text)
- Subject line format
- Sender display name
- Email styling and branding

## Database Schema

Reports are stored in MongoDB with the following schema:

```javascript
{
  reporterId: ObjectId,        // User who submitted report
  reportedUserId: ObjectId,    // User being reported
  reason: String,              // One of predefined reasons
  message: String,             // Custom message (max 500 chars)
  status: String,              // 'pending', 'reviewed', 'resolved'
  sessionId: ObjectId,         // Optional: related session
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Submit Report

```
POST /api/v1/reports/submit
Authorization: Bearer <token>
Body: {
  reportedUserId: string,
  reason: string,
  message: string,
  sessionId?: string
}
```

### Get My Reports

```
GET /api/v1/reports/my-reports
Authorization: Bearer <token>
```

### Get All Reports (Admin)

```
GET /api/v1/reports/all
Authorization: Bearer <token>
```

## Security Best Practices

1. ✅ Never commit `.env` file to Git
2. ✅ Use app-specific passwords instead of main password
3. ✅ Restrict report endpoint to authenticated users only
4. ✅ Validate all input data on backend
5. ✅ Rate limit report submissions (implement if needed)
6. ✅ Log all report submissions for audit trail
7. ✅ Keep admin email confidential

## Production Deployment

For production, consider using:

- **SendGrid** - Reliable email delivery service
- **AWS SES** - Amazon's email service
- **Mailgun** - Developer-friendly email API
- **Postmark** - Transactional email service

These services offer better deliverability and analytics than Gmail.

## Support

If you encounter any issues:

1. Check the backend console logs for error messages
2. Verify all environment variables are set correctly
3. Test email sending with the test script
4. Check spam folder for received emails

---

**Note:** This feature requires nodemailer package to be installed:

```bash
npm install nodemailer
```
