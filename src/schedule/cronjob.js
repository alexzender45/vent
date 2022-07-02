const cron = require("node-cron");
const moment = require("moment");
const {
  DAILY_CRON_SCHEDULE,
  REFERRAL_PERCENTAGE,
  COMPLETED_ORDER,
} = require("../core/config");
const serviceClientSchema = require("../models/serviceClientModel");
const serviceProviderSchema = require("../models/serviceProviderModel");
const { showNotification, sendMessageorder } = require("../utils/notification");
const serviceSchema = require("../models/servicesModel");
const Order = require("../service/Order");
const {
  USER_TYPE,
  ORDER_STATUS,
  NOTIFICATION_TYPE,
} = require("../utils/constants");
const Notification = require("../service/Notification");
const Wallet = require("../service/Wallet");
const { logger } = require("../utils/logger");

// For Service Client
cron.schedule(DAILY_CRON_SCHEDULE, async () => {
  try {
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
            if (index < COMPLETED_ORDER - 1) {
              totalAmount += order.price;
            }
            return order.status === ORDER_STATUS.COMPLETED;
          }).length;
          if (completedOrdersCount >= COMPLETED_ORDER) {
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
            if (index < COMPLETED_ORDER - 1) {
              totalAmount += order.price;
            }
            return order.status === ORDER_STATUS.COMPLETED;
          }).length;
          if (completedOrdersCount >= COMPLETED_ORDER) {
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

cron.schedule(DAILY_CRON_SCHEDULE, async () => {
  try {
    logger.info(`cron job started at ${new Date()}...`);
    const orders = await new Order(
      ORDER_STATUS.COMPLETED
    ).getAllOrderWithStatus();
    const filteredOrders = orders.filter(async (order) => {
      isOrderLongerThanThreeDays(order.completedDate) &&
        orderHasNoDisputeOpenInLastThreeDays(order._id);
    });
    filteredOrders.map(async (order) => {
      const providerWallet = await new Wallet(order.providerId).getUserWallet();
      providerWallet.pendingWithdrawal -= order.price;
      providerWallet.currentBalance += order.price;
      await providerWallet.save();
    });
    logger.info(
      `cron job completed ${filteredOrders.length} records at ${new Date()}...`
    );
  } catch (e) {
    logger.error("Cronjob exception...", e);
  }
});

function isOrderLongerThanThreeDays(completedDate) {
  const today = new Date();
  const orderCompletionDate = new Date(completedDate);
  const differenceInTime = today.getTime() - orderCompletionDate.getTime();
  const differenceInDays = differenceInTime / (3600 * 24 * 1000);
  return differenceInDays >= 3;
}

function orderHasNoDisputeOpenInLastThreeDays(orderId) {
  return true;
}

cron.schedule(DAILY_CRON_SCHEDULE, async () => {
  const services = await serviceSchema.find({ isFeatured: true })
  .populate('featuredServiceId userId');
  services.map(async (service) => {
    if(service.featuredServiceId.activeFor <= moment(service.createdAt).days()){
      service.isFeatured = false;
      service.featuredServiceId = null;
      await service.save();
      const data = {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        serviceId: service._id.toString(),
        type: NOTIFICATION_TYPE.FEATURED_SERVICE_ENDED,
      }
      const message = await sendMessageorder(
        `Hi ${service.userId.fullName}`, 
        `${service.name} has ended its featured service`,
        data);
        if (service.userId.firebaseToken) {
        await showNotification(service.userId.firebaseToken, message);
        }
    }
  })
  })
