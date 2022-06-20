const bcrypt = require('bcrypt');
const { Schema, model } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { throwError } = require("../utils/handleErrors");

const discountModel = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
        type: String,
        required: true,
      },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    discount: {
        type: Number,
        required: true,
      },
    timeframe: {
        type: Date,
        required: true,
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

  
  const DiscountModel = model('Discount', discountModel);
  module.exports = DiscountModel;
