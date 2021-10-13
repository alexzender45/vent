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
    await NotificationSchema.findOne({ userId: userId, _id: id }).orFail(() =>
      throwError("User Notification Not Found")
    );
  }

  async getAllUserNotifications() {
    return await NotificationSchema.find({ userId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "userId serviceId",
        "name fullName profilePictureUrl price createdAt"
      )
      .orFail(() => throwError("User Notifications Not Found"));
  }

  async getNotification() {
    return await NotificationSchema.findOne({ _id: this.data }).orFail(() =>
      throwError("Notification Not Found")
    );
  }
}

module.exports = Notification;
