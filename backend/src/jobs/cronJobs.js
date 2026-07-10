const cron = require('node-cron');
const { Message } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

const initCronJobs = () => {
  // 1. Auto-delete messages older than 24 hours (run every 10 minutes)
  cron.schedule('*/10 * * * *', async () => {
    console.log('⏰ Running Cron Job: Auto-deleting expired messages...');
    try {
      const now = new Date();
      const deletedCount = await Message.destroy({
        where: {
          expiresAt: {
            [Op.lt]: now
          }
        }
      });
      if (deletedCount > 0) {
        console.log(`🧹 Deleted ${deletedCount} expired messages.`);
      } else {
        console.log('🧹 No expired messages found.');
      }
    } catch (error) {
      console.error('❌ Error during message auto-delete cron:', error);
    }
  });

  // 2. Keep-alive self ping (run every 10 minutes) to prevent Render free tier from sleeping
  cron.schedule('*/10 * * * *', async () => {
    const renderUrl = process.env.RENDER_URL;
    if (renderUrl) {
      console.log(`💓 Sending keep-alive ping to ${renderUrl}...`);
      try {
        const response = await axios.get(`${renderUrl}/health`);
        console.log(`💓 Keep-alive ping response: ${response.status}`);
      } catch (error) {
        console.error('❌ Error sending keep-alive ping:', error.message);
      }
    }
  });

  console.log('⏰ Cron jobs scheduled successfully.');
};

module.exports = { initCronJobs };
