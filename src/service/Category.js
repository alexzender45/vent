const categorySchema = require("../models/categoryModel");
const { throwError } = require("../utils/handleErrors");
const {validateParameters} = require("../utils/util");

class Category {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    let parameters = this.data;
    const {isValid, messages} = validateParameters(["name", "type"], parameters);
    if (!isValid) {
        throwError(messages);
    }
    return await new categorySchema(parameters).save();
  }

  async getCategory() {
    return await categorySchema
      .findById(this.data)
      .orFail(() => throwError("Category Not Found", 404));
  }

  async getCategoryByType() {
    return await categorySchema
      .find({ type: this.data })
      .orFail(() => throwError(`No Category Found For ${type} Type`, 404));
  }

  static async getAllCategories() {
    return await categorySchema
      .find()
      .orFail(() => throwError("No Category Found", 404));
  }

  async deleteCategory() {
      return await categorySchema.findByIdAndRemove(this.data)
          .orFail(() => throwError("No Category Found", 404));
  }
}

module.exports = Category;
