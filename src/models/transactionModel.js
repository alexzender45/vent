const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { TRANSACTION_TYPE } = require("../utils/constants");

const transactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceClient",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.keys(TRANSACTION_TYPE),
    },
    reference: {
      type: String,
      required: true,
    },
    paymentDate: {
      type: String,
      required: true,
    },
  },
  {
    timestamp: true,
  }
);

transactionSchema.plugin(uniqueValidator, {
  message: "{TYPE} must be unique.",
});

const transactionModel = model("Transaction", transactionSchema);
module.exports = transactionModel;
