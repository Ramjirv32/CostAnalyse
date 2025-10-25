const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.testMode = process.env.EMAIL_TEST_MODE === 'true';
    this.testInterval = null;
    this.isInitialized = false;
  }

  // Create transporter on-demand with better error handling
  async createTransporter() {
    try {
      console.log('🔧 Creating email transporter...');
      console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
      console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (' + process.env.EMAIL_PASS.length + ' chars)' : 'Not set');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        debug: true,
        logger: true
      });

      // Test the connection
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
      
      return transporter;
    } catch (error) {
      console.error('❌ Failed to create/verify email transporter:', error);
      throw error;
    }
  }

  // Initialize email transporter
  async initialize() {
    try {
      console.log('🔧 Initializing email service...');
      this.transporter = await this.createTransporter();
      this.isInitialized = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
      this.isInitialized = false;
    }
  }

  // Send alert email
  async sendAlert(to, subject, message, deviceName) {
    try {
      // Create transporter fresh for each send
      const transporter = await this.createTransporter();
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

      const info = await transporter.sendMail(mailOptions);
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

  // Send PDF report via email
  async sendPDFReport(to, reportData, metadata, pdfBuffer) {
    console.log('📧 Attempting to send PDF report...');
    console.log('📨 To:', to);
    console.log('📊 Report data length:', reportData ? reportData.length : 0);
    console.log('📄 PDF buffer size:', pdfBuffer ? pdfBuffer.length : 0);
    
    try {
      // Create transporter fresh for each send to avoid initialization issues
      const transporter = await this.createTransporter();
      console.log('✅ Transporter created successfully');

      const { reportType, startDate, endDate, selectedDate } = metadata;
      let dateRange = '';
      
      if (reportType === 'specific') {
        dateRange = new Date(selectedDate).toLocaleDateString();
      } else if (reportType === 'range') {
        dateRange = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      } else {
        dateRange = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      }

      const totalUsage = reportData.reduce((sum, item) => sum + (item.usage || 0), 0);
      const totalCost = reportData.reduce((sum, item) => sum + (item.cost || 0), 0);
      const deviceCount = new Set(reportData.map(item => item.deviceId)).size;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #000 0%, #333 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #000; }
            .stat-value { font-size: 24px; font-weight: bold; color: #000; margin-bottom: 5px; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-section { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .attachment-note { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚡ Energy Report</h1>
              <p>PowerAI IoT Management System</p>
            </div>
            
            <div class="content">
              <h2>Report Summary</h2>
              <p><strong>Period:</strong> ${dateRange}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${deviceCount}</div>
                  <div class="stat-label">Devices</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${totalUsage.toFixed(1)}</div>
                  <div class="stat-label">kWh Used</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">$${totalCost.toFixed(2)}</div>
                  <div class="stat-label">Total Cost</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${reportData.length}</div>
                  <div class="stat-label">Data Points</div>
                </div>
              </div>

              <div class="attachment-note">
                <h3>📎 PDF Report Attached</h3>
                <p>A detailed PDF report with complete data analysis, charts, and device breakdowns is attached to this email.</p>
              </div>

              <div class="info-section">
                <h3>Key Insights</h3>
                <ul>
                  <li><strong>Average Daily Usage:</strong> ${(totalUsage / Math.max(1, new Set(reportData.map(item => item.date)).size)).toFixed(2)} kWh</li>
                  <li><strong>Average Daily Cost:</strong> $${(totalCost / Math.max(1, new Set(reportData.map(item => item.date)).size)).toFixed(2)}</li>
                  <li><strong>Most Active Period:</strong> ${dateRange}</li>
                  <li><strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analysis</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p>This report was generated automatically by PowerAI IoT Management System</p>
              <p>For support, contact your system administrator</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: `⚡ Energy Report - ${dateRange}`,
        html: htmlContent,
        attachments: [
          {
            filename: `energy-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ PDF Report email sent:', info.messageId);
      return true;

    } catch (error) {
      console.error('❌ Error sending PDF report email:', error);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
