const orderSchema = require("../models/orderModel");
const cartSchema = require("../models/cartModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const { ORDER_STATUS } = require("../utils/constants");
const Service = require("./Services");

class Order {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    const {
      clientId,
      serviceId,
      numberOfItems,
      notes,
      dateRequested,
      location,
      specifiedTime,
    } = this.data;
    const service = await Servive.findOne({ clientId });
    const order = new orderSchema({
      providerId: service.providerId,
      clientId,
      serviceId,
      numberOfItems,
      notes,
      dateRequested,
      location,
      specifiedTime,
    });
    let validationError = order.validateSync();
    if (validationError) {
      Object.values(validationError.errors).forEach((e) => {
        if (e.reason) this.errors.push(e.reason.message);
        else this.errors.push(e.message.replace("Path ", ""));
      });
      throwError(this.errors);
    }
    await order.save();
    new cartSchema({
      clientId: order.clientId,
      orderId: order._id,
    }).save();
    return order;
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

  // cancel order
  async cancelOrder() {
    const order = await this.getOder();
    order.status = ORDER_STATUS.REJECTED;
    return await order.save();
  }
}

module.exports = Order;
