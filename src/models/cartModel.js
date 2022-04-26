const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

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
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    image: {
      type: String,
    },
  },
  {
    strictQuery: "throw",
  }
);

cartSchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const CartModel = model("Cart", cartSchema);
module.exports = CartModel;
