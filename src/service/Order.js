const orderSchema = require("../models/orderModel");
const cartSchema = require("../models/cartModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const { ORDER_STATUS } = require("../utils/constants");

class Order {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    let parameters = this.data;
    const { isValid, messages } = validateParameters(
      ["providerId", "clientId", "serviceId", "numberOfItems", "notes"],
      parameters
    );
    if (!isValid) {
      throwError(messages);
    }
    const order = await new orderSchema(parameters).save();
    new cartSchema({
      clientId: order.clientId,
      orderId: order._id,
      serviceId: order.serviceId,
    }).save();
    return order;
  }

  async getOder() {
    return await orderSchema
      .findById(this.data)
      .orFail(() => throwError("Order Not Found", 404));
  }

  static async getAllOrders() {
    return await orderSchema
      .find()
      .orFail(() => throwError("No Order Found", 404));
  }

  // reject order
  async rejectOrder() {
    return await orderSchema.findByIdAndUpdate(
      this.data,
      { status: ORDER_STATUS.REJECTED },
      { new: true }
    );
  }

  // accept order
  async acceptOrder() {
    return await orderSchema.findByIdAndUpdate(
      this.data,
      { status: ORDER_STATUS.ACCEPTED },
      { new: true }
    );
  }

  //cancel order
  async cancelOrder() {
    return await orderSchema.findByIdAndUpdate(
      this.data,
      { status: ORDER_STATUS.CANCELLED },
      { new: true }
    );
  }

  // get all orders for a client
  async getOrdersForClient() {
    return await orderSchema
      .find({ clientId: this.data })
      .orFail(() => throwError("No Order Found", 404));
  }

  async getOrdersForProvider() {
    return await orderSchema
      .find({ providerId: this.data })
      .orFail(() => throwError("No Order Found", 404));
  }
}

module.exports = Order;
