const accessSchema = require("../models/accessModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");

class Admin {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async getAll() {
    const discounts = await accessSchema
      .find()

    if (!discounts.length) {
      throwError("Access not found", 404);
    }
    return discounts;
  }

  async getOwner() {
    const id = this.data;
    const access = await accessSchema.findOne({type: "owner"})

    if (!access) {
      throwError("Access not found", 404);
    }
    return access;
  }

  async getSupport() {
    const id = this.data;
    const access = await accessSchema.findOne({type: "support"})

    if (!access) {
      throwError("Access not found", 404);
    }
    return access;
  }

  async add() {

    return await new accessSchema(this.data).save();
  }

  async editOwner() {

    return  await accessSchema.updateOne(
      { type: "owner"},
      { $set: this.data}
  );
  }

  async editSupport() {

    return  await accessSchema.updateOne(
      { type: "support"},
      { $set: this.data}
  );
  }

  async deleteOne() {
    const id = this.data;
    const discount = await accessSchema.deleteOne({_id: id})
    if(discount.n == 0){
      throwError("This discount does not exist")
    }
    return `${id} deleted `;
  }

}

module.exports = Admin;
