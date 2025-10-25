const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');
const emailService = require('../services/emailService');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/chat/history
// @desc    Get user's chat history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const chatHistory = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: chatHistory
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: error.message
    });
  }
});

// @route   POST /api/chat/message
// @desc    Send a new chat message
// @access  Private
router.post('/message', auth, async (req, res) => {
  try {
    const { message, messageType = 'text' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Save user message to chat history
    const chatEntry = new ChatHistory({
      userId: req.user.id,
      email: user.email,
      message: message.trim(),
      sender: 'user',
      messageType
    });

    await chatEntry.save();

    // Auto-response for demo
    const autoResponse = generateAutoResponse(message);
    if (autoResponse) {
      const responseEntry = new ChatHistory({
        userId: req.user.id,
        email: user.email,
        message: autoResponse,
        sender: 'support',
        messageType: 'text'
      });
      await responseEntry.save();
    }

    // Get updated chat history
    const updatedHistory = await ChatHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: updatedHistory
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// @route   POST /api/chat/send-alert
// @desc    Send test alert email
// @access  Private
router.post('/send-alert', auth, async (req, res) => {
  try {
    const { deviceName = 'Test Device', alertType = 'test' } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send alert email (will go to demo email)
    const emailSent = await emailService.sendAlert(
      user.email,
      'Device Alert Test',
      `This is a test alert from the PowerAI system. Alert type: ${alertType}`,
      deviceName
    );

    if (emailSent) {
      res.json({
        success: true,
        message: `Test alert sent successfully! Check ${emailService.demoEmail} for the email.`,
        demoEmail: emailService.demoEmail
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send alert email'
      });
    }

  } catch (error) {
    console.error('Send alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send alert',
      error: error.message
    });
  }
});

// @route   POST /api/chat/send-report
// @desc    Send energy report email
// @access  Private
router.post('/send-report', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mock report data
    const reportData = {
      period: 'Weekly Report',
      totalCost: 156.75,
      totalConsumption: 125.4,
      devices: [
        { name: 'Air Conditioner', consumption: 45.2, cost: 67.80 },
        { name: 'Refrigerator', consumption: 32.1, cost: 48.15 },
        { name: 'Smart TV', consumption: 18.5, cost: 27.75 },
        { name: 'Lights', consumption: 12.8, cost: 19.20 },
        { name: 'Other Devices', consumption: 16.8, cost: 25.20 }
      ]
    };

    // Send report email
    const emailSent = await emailService.sendEnergyReport(
      user.email,
      reportData
    );

    if (emailSent) {
      res.json({
        success: true,
        message: `Energy report sent successfully! Check ${emailService.demoEmail} for the email.`,
        demoEmail: emailService.demoEmail,
        reportData
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send energy report'
      });
    }

  } catch (error) {
    console.error('Send report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send report',
      error: error.message
    });
  }
});

// Helper function to generate auto responses
function generateAutoResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  if (message.includes('hello') || message.includes('hi')) {
    return '👋 Hello! I\'m PowerAI Support. How can I help you with your energy management today?';
  }
  
  if (message.includes('help') || message.includes('support')) {
    return '🔧 I\'m here to help! You can:\n• Ask about device issues\n• Request energy reports\n• Get troubleshooting tips\n• Report problems\n\nWhat do you need assistance with?';
  }
  
  if (message.includes('device') || message.includes('not working')) {
    return '🔍 Device issues? Let\'s troubleshoot:\n• Check power connection\n• Verify WiFi connectivity\n• Restart the device\n• Check for error messages\n\nWould you like me to send you a detailed troubleshooting guide?';
  }
  
  if (message.includes('report') || message.includes('energy')) {
    return '📊 I can generate energy reports for you! Use the "Send Report" button to get a detailed energy consumption report sent to your email.';
  }
  
  if (message.includes('alert') || message.includes('notification')) {
    return '🚨 Alert system is active! I\'ll notify you about:\n• Device failures\n• High energy consumption\n• Connectivity issues\n• System maintenance\n\nYou can test alerts using the "Test Alert" button.';
  }
  
  return '💬 Thanks for your message! Our support team will get back to you shortly. For immediate help, try using our automated troubleshooting tools or check the FAQ section.';
}

module.exports = router;