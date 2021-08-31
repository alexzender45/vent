const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { ORDER_STATUS } = require("../utils/constants");

const orderSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceClient",
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
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: "BOOKED",
      required: true,
    },
    numberOfItems: {
      type: Number,
    },
    notes: String,
    dateRequested: {
      type: Date,
      default: Date.now(),
    },
    location: {
      type: String,
      required: true,
      default: false,
    },
    specifiedTime: String,
  },
  {
    strictQuery: "throw",
  }
);

orderSchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const OrderModel = model("Order", orderSchema);
module.exports = OrderModel;
