const orderSchema = require("../models/orderModel");
const cartSchema = require("../models/cartModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const { ORDER_STATUS } = require("../utils/constants");
const serviceSchema = require("../models/servicesModel");

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
    const service = await serviceSchema.findById({ _id: serviceId });
    const order = new orderSchema({
      providerId: service.userId,
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
    const order = await this.getOder();
    order.status = ORDER_STATUS.REJECTED;
    return await order.save();
  }

  // accept order
  async acceptOrder() {
    const order = await this.getOder();
    order.status = ORDER_STATUS.ACCEPTED;
    return await order.save();
  }

  //cancel order
  async cancelOrder() {
    const order = await this.getOder();
    order.status = ORDER_STATUS.CANCELLED;
    return await order.save();
  }

  // get all orders for a client
  async getOrdersForClient() {
    const orders = await orderSchema.find({ clientId: this.data });
    if (!orders) throwError("No Order Found", 404);
    return orders;
  }

  async getOrdersForProvider() {
    const orders = await orderSchema.find({ providerId: this.data });
    if (!orders) throwError("No Order Found", 404);
    return orders;
  }
}

module.exports = Order;
