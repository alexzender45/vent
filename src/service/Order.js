const orderSchema = require("../models/orderModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");

class Order {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    let parameters = this.data;
    const order = new orderSchema(parameters);
    let validationError = order.validateSync();
    if (validationError) {
      Object.values(validationError.errors).forEach((e) => {
        if (e.reason) this.errors.push(e.reason.message);
        else this.errors.push(e.message.replace("Path ", ""));
      });
      throwError(this.errors);
    }

    return await order.save();
  }

  async getOder() {
    return await orderSchema
      .findById(this.data)
      .orFail(() => throwError("Order Not Found", 404));
  }

  async getOrderByClient() {
    return await orderSchema
      .find({ clientId: this.data })
      .orFail(() => throwError(`No Order Found For ${type} Type`, 404));
  }

  static async getAllOders() {
    return await orderSchema
      .find()
      .orFail(() => throwError("No Order Found", 404));
  }

  async deleteOrder() {
    return await orderSchema.findByIdAndRemove(this.data);
  }

  async updateOrder() {
    throwError("NOT SUPPORTED");
  }
}

module.exports = Order;
