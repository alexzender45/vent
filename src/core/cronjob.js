const cron = require('node-cron');
const Order = require("../service/Order");
const Wallet = require("../service/Wallet");
const {ORDER_STATUS} = require("../utils/constants");
const {DAILY_CRON_SCHEDULE} = require("../core/config");
const {logger} = require("../utils/logger");

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

exports.updateAvailableBalance = async () => {
    cron.schedule(DAILY_CRON_SCHEDULE, async () => {
        try {
            logger.info(`cron job started at ${new Date()}...`);
            const orders = await new Order(ORDER_STATUS.COMPLETED).getAllOrderWithStatus();
            const filteredOrders = orders.filter(async order => {
                isOrderLongerThanThreeDays(order.completedDate) &&
                orderHasNoDisputeOpenInLastThreeDays(order._id)
            });
            filteredOrders.map(async (order) => {
                const providerWallet = await new Wallet(order.providerId).getUserWallet();
                providerWallet.pendingWithdrawal -= order.price;
                providerWallet.currentBalance += order.price;
                await providerWallet.save()
            })
            logger.info(`cron job completed ${filteredOrders.length} records at ${new Date()}...`);
        } catch (e) {
            logger.error("Cronjob exception...", e)
        }
    })
}