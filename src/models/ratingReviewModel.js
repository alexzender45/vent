const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const ratingReviewSchema = new Schema(
  {
    reviewerId: {
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
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    review: {
      type: String,
    },
    providerResponse: {
      type: String,
    },
  },
  {
    strictQuery: "throw",
  }
);

ratingReviewSchema.plugin(uniqueValidator, {
  message: "{TYPE} must be unique.",
});

const RatingReviewModel = model("RatingReview", ratingReviewSchema);
module.exports = RatingReviewModel;
