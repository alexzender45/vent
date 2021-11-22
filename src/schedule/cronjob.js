const cron = require("node-cron");
const {
  DAILY_CRON_SCHEDULE,
  REFERRAL_PERCENTAGE,
  COMPLETED_OREDER,
} = require("../core/config");
const serviceClientSchema = require("../models/serviceClientModel");
const serviceProviderSchema = require("../models/serviceProviderModel");
const Order = require("../service/Order");
const {
  USER_TYPE,
  ORDER_STATUS,
  NOTIFICATION_TYPE,
} = require("../utils/constants");
const Notification = require("../service/Notification");

// For Service Client
cron.schedule(DAILY_CRON_SCHEDULE, async () => {
  try {
    console.log("Daily Cron Job For Client");
    const users = await serviceClientSchema.find({
      referrals: { $exists: true, $ne: [] },
    });
    users.map((user) => {
      user.referrals
        .filter((referral) => referral.paid === false)
        .map(async (referral) => {
          const userOrders =
            referral.userType === USER_TYPE.SERVICE_PROVIDER
              ? await new Order(referral.userId).getOrdersForProvider()
              : await new Order(referral.userId).getOrdersForClient();
          let totalAmount = 0;
          const completedOrdersCount = userOrders.filter((order, index) => {
            if (index < COMPLETED_OREDER - 1) {
              totalAmount += order.price;
            }
            return order.status === ORDER_STATUS.COMPLETED;
          }).length;
          if (completedOrdersCount >= COMPLETED_OREDER) {
            user.currentReferralBalance += totalAmount * REFERRAL_PERCENTAGE;
            user.totalReferralEarnings += totalAmount * REFERRAL_PERCENTAGE;
            referral.paid = true;
            user.markModified("referrals");
            await user.save();
            const notificationDetails = {
              userId: user._id,
              message: `Recieved ${
                totalAmount * REFERRAL_PERCENTAGE
              } For Referring ${referral.name}, ${referral.userType}`,
              image: user.profilePictureUrl,
              notificationType: NOTIFICATION_TYPE.REFERRAL_EARNED,
            };
            Notification.createNotification(notificationDetails);
          }
        });
    });
  } catch (err) {
    process.exit(1);
  }
});

// For Service Provider
cron.schedule(DAILY_CRON_SCHEDULE, async () => {
  try {
    console.log("Daily Cron Job For Provider");
    const users = await serviceProviderSchema.find({
      referrals: { $exists: true, $ne: [] },
    });
    users.map((user) => {
      user.referrals
        .filter((referral) => referral.paid === false)
        .map(async (referral) => {
          const userOrders =
            referral.userType === USER_TYPE.SERVICE_PROVIDER
              ? await new Order(referral.userId).getOrdersForProvider()
              : await new Order(referral.userId).getOrdersForClient();
          let totalAmount = 0;
          const completedOrdersCount = userOrders.filter((order, index) => {
            if (index < COMPLETED_OREDER - 1) {
              totalAmount += order.price;
            }
            return order.status === ORDER_STATUS.COMPLETED;
          }).length;
          if (completedOrdersCount >= COMPLETED_OREDER) {
            user.currentReferralBalance += totalAmount * REFERRAL_PERCENTAGE;
            user.totalReferralEarnings += totalAmount * REFERRAL_PERCENTAGE;
            referral.paid = true;
            user.markModified("referrals");
            await user.save();
            const notificationDetails = {
              userId: user._id,
              message: `Recieved ${
                totalAmount * REFERRAL_PERCENTAGE
              } For Referring ${referral.name}, ${referral.userType}`,
              image: user.profilePictureUrl,
              notificationType: NOTIFICATION_TYPE.REFERRAL_EARNED,
            };
            Notification.createNotification(notificationDetails);
          }
        });
    });
  } catch (err) {
    process.exit(1);
  }
});
