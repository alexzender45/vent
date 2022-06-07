const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const featuredServiceSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
    },
    activeFor: {
        type: Number
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strictQuery: "throw",
  }
);

featuredServiceSchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const FeaturedServiceModel = model("FeaturedService", featuredServiceSchema);
module.exports = FeaturedServiceModel;
