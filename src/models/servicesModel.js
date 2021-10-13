const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { CURRENCY, SERVICE_TYPE } = require("../utils/constants");

const serviceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: true,
    },
    type: {
      type: String,
      enum: Object.keys(SERVICE_TYPE),
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: {
      type: String,
      required: true,
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
    features: [],
    deliveryPeriod: String,
    availabilityPeriod: {
      type: String,
      required: true,
    },
    portfolioFiles: {
      type: [String],
      required: true,
    },
    portfolioLink: String,
    currency: {
      type: String,
      enum: Object.keys(CURRENCY),
    },
    priceDescription: [],
    others: String,
    rating: {
      type: String,
      default: "0",
    },
  },
  {
    timestamps: true,
  },
  {
    strictQuery: "throw",
  }
);

serviceSchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const ServicesModel = model("Service", serviceSchema);
module.exports = ServicesModel;
