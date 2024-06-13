const NotificationModel = require("../models/notificationsModel");

const cron = require("node-cron");

const job = cron.schedule("*/10 * * * *", async () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    const expiredNotifications = await NotificationModel.find({
      acceptedAt: { $lte: oneHourAgo },
      acceptedBy: { $ne: null },
    });

    for (const notification of expiredNotifications) {
      notification.acceptedBy = null;
      notification.acceptedAt = null;
      await notification.save();
    }
  } catch (err) {
    console.error("Error resetting expired acceptances:", err);
  }
});

// Function to stop cron job
const stopCronJob = () => {
  job.stop();
  console.log("Cron job stopped.");
};

module.exports = { stopCronJob };
