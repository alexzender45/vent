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
      default: ORDER_STATUS.PENDING,
      required: true,
    },
    numberOfItems: {
      type: Number,
      default: 1,
    },
    notes: String,
    dateRequested: {
      type: Date,
      default: Date.now(),
    },
    location: {
      useProfileLocation: {
        type: Boolean,
        required: true,
        default: true,
      },
      country: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    specifiedTime: String,
    price: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    orderReference: {
      type: String,
      required: true,
    },
    selectFromProviderTime: {
      type: String,
    },
    completedDate: {
      type: Date
    },
    dispute: {
      type: Boolean,
      default: false,
    },
    dateToCompleteService: {
      type: Date,
      default: null,
    },
  },
  {
    strictQuery: "throw",
  }
);

orderSchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const OrderModel = model("Order", orderSchema);
module.exports = OrderModel;
