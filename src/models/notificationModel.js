const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { NOTIFICATION_TYPE } = require("../utils/constants");

const notificationSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
    },

    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    serviceName: {
      type: String,
    },
    image: {
      type: String,
    },
    notificationType: {
      type: String,
      enum: Object.keys(NOTIFICATION_TYPE),
    },
    price: {
      type: Number,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamp: true,
  }
);

notificationSchema.plugin(uniqueValidator, {
  message: "{TYPE} must be unique.",
});

const notificationModel = model("Notification", notificationSchema);
module.exports = notificationModel;
