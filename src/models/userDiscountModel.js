const bcrypt = require('bcrypt');
const { Schema, model } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { throwError } = require("../utils/handleErrors");

const userDiscountModel = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    discountId: {
      type: Schema.Types.ObjectId,
      ref: "Discount",
      required: true,
      },
    used: {
      type: Boolean,
      default: false
  },
    createdAt: {
        type: Date,
        default: Date.now,
      },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ref) {
        delete ref.password;
        delete ref.tokens;
      },
    },
    toObject: {
      transform(doc, ref) {
        delete ref.password;
        delete ref.tokens;
      },
    },
  },
  {
    strictQuery: 'throw'
  }
);

  
  const UserDiscountModel = model('UserDiscount', userDiscountModel);
  module.exports = UserDiscountModel;
