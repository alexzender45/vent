const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { ORDER_STATUS } = require("../utils/constants");

const cartSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceClient",
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: "BOOKED",
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    servicePrice: {
      type: String,
      required: true,
    },
    serviceProviderImage: {
      type: String,
      required: true,
    },
  },
  {
    strictQuery: "throw",
  }
);

cartSchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const CartModel = model("Cart", cartSchema);
module.exports = CartModel;
