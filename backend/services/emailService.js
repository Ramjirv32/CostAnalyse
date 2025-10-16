const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.testMode = process.env.EMAIL_TEST_MODE === 'true';
    this.testInterval = null;
  }

  // Initialize email transporter
  initialize() {
    try {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      console.log('✅ Email service initialized');
      
      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service verification failed:', error.message);
        } else {
          console.log('✅ Email service ready to send messages');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  // Send alert email
  async sendAlert(to, subject, message, deviceName) {
    if (!this.transporter) {
      console.error('Email service not initialized');
      return false;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
            .device-name { font-weight: bold; color: #000; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ PowerAI Alert</h1>
            </div>
            <div class="content">
              <h2>Device Inactivity Alert</h2>
              <div class="alert-box">
                <p><strong>Device:</strong> <span class="device-name">${deviceName}</span></p>
                <p><strong>Issue:</strong> ${message}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>This device has been inactive for an extended period. Please check if:</p>
              <ul>
                <li>The device is powered on</li>
                <li>The device is connected to the network</li>
                <li>There are any hardware issues</li>
              </ul>
              <a href="http://localhost:5173" class="button">View Dashboard</a>
            </div>
            <div class="footer">
              <p>This is an automated alert from PowerAI Energy Management System</p>
              <p>© 2025 PowerAI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"PowerAI Alerts" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        text: message,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Alert email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  // Send test email
  async sendTestEmail(to) {
    return await this.sendAlert(
      to,
      'PowerAI Test Alert',
      'This is a test alert to verify email functionality.',
      'Test Device'
    );
  }

  // Start test mode (sends emails every X seconds)
  startTestMode(intervalSeconds = 5) {
    if (!this.testMode) {
      console.log('⚠️  Test mode is disabled. Set EMAIL_TEST_MODE=true to enable.');
      return;
    }

    console.log(`🧪 Starting email test mode (sending every ${intervalSeconds}s)`);
    
    this.testInterval = setInterval(async () => {
      const testEmail = process.env.EMAIL_USER;
      await this.sendAlert(
        testEmail,
        'PowerAI Test Alert',
        'Device has been inactive for testing purposes.',
        'Test Device ' + new Date().toLocaleTimeString()
      );
    }, intervalSeconds * 1000);
  }

  // Stop test mode
  stopTestMode() {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
      console.log('🛑 Email test mode stopped');
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
