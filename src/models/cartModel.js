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
  },
  {
    strictQuery: "throw",
  }
);

cartSchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const CartModel = model("Cart", cartSchema);
module.exports = CartModel;
