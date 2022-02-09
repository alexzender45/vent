const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const disputeSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceClient",
      required: true,
    },
    providerId: {
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider",
        required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    others: {
      type: String,
    },
  },
  {
    strictQuery: "throw",
  }
);

disputeSchema.plugin(uniqueValidator, {
  message: "{TYPE} must be unique.",
});

const DisputeModel = model("Dispute", disputeSchema);
module.exports = DisputeModel;
