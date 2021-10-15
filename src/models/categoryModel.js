const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { CATEGORY_TYPE } = require("../utils/constants");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.keys(CATEGORY_TYPE),
      required: true,
    },
    image: {
      type: String,
    }
  },
  {
    timestamps: true,
  },
  {
    strictQuery: "throw",
  }
);

categorySchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const CategoryModel = model("Category", categorySchema);
module.exports = CategoryModel;
