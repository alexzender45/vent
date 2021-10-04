const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider" || "ServiceClient",
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
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
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider" || "ServiceClient",
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
