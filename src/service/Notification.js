const NotificationSchema = require("../models/notificationModel");
const { throwError } = require("../utils/handleErrors");

class Notification {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  static async createNotification(notificationDetails) {
    return await new NotificationSchema(notificationDetails).save();
  }

  async getUserNotification() {
    const { userId, id } = this.data;
    await NotificationSchema.findOne({ userId: userId, _id: id })
      .populate(
        "orderId serviceId",
        "name type notes dateRequested price specifiedTime notes createdAt status"
      )
      .orFail(() => throwError("User Notification Not Found"));
  }

  async getAllUserNotifications() {
    return await NotificationSchema.find({ userId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "orderId serviceId",
        "name type notes dateRequested price specifiedTime notes createdAt status"
      )
      .orFail(() => throwError("No Notification Found"));
  }

  async getNotification() {
    const notification = await NotificationSchema.findOne({ _id: this.data })
      .populate(
        "orderId serviceId",
        "name type notes dateRequested price specifiedTime notes createdAt status"
      )
      .orFail(() => throwError("Notification Not Found"));
    if (notification.isRead === false) {
      notification.isRead = true;
      await notification.save();
    }
    return notification;
  }

  // delete notification
  async deleteNotification() {
    return await NotificationSchema.findOneAndDelete({
      _id: this.data,
    }).orFail(() => throwError("Notification Not Found"));
  }
}

module.exports = Notification;
