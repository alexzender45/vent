const orderSchema = require("../models/orderModel");
const cartSchema = require("../models/cartModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const {
  ORDER_STATUS,
  SERVICE_TYPE,
  NOTIFICATION_TYPE,
} = require("../utils/constants");
const Notification = require("./Notification");

class Order {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    let parameters = this.data;
    const { isValid, messages } = validateParameters(
      [
        "providerId",
        "clientId",
        "serviceId",
        "numberOfItems",
        "notes",
        "price",
        "serviceType",
        "fullName",
      ],
      parameters
    );
    if (!isValid) {
      throwError(messages);
    }
    const cart = await cartSchema.findOne({
      clientId: parameters.clientId,
      serviceId: parameters.serviceId,
    });
    if (cart) {
      const order = await orderSchema.findOne({
        clientId: parameters.clientId,
        serviceId: parameters.serviceId,
      });
      const updateNumberOfItems =
        order.numberOfItems + parameters.numberOfItems;
      order.numberOfItems = updateNumberOfItems;
      order.price = parameters.price * updateNumberOfItems;
      cart.amount = parameters.price * updateNumberOfItems;
      order.save();
      cart.save();
      return order;
    } else {
      if (parameters.serviceType === SERVICE_TYPE.REQUESTING) {
        const order = await new orderSchema(parameters).save();
        const notificationDetails = {
          userId: parameters.providerId,
          notificationId: order._id,
          message: `${parameters.fullName} requested a service`,
          serviceId: parameters.serviceId,
          notificationType: NOTIFICATION_TYPE.SERVICE_REQUEST,
        };
        Notification.createNotification(notificationDetails);
        new cartSchema({
          clientId: order.clientId,
          orderId: order._id,
          serviceId: order.serviceId,
          amount: order.price,
        }).save();
      } else {
        this.data["status"] = ORDER_STATUS.ACCEPTED;
        const order = await new orderSchema(parameters).save();
        new cartSchema({
          clientId: order.clientId,
          orderId: order._id,
          serviceId: order.serviceId,
          amount: order.price,
        }).save();
        return order;
      }
    }
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
    const order = await orderSchema.findByIdAndUpdate(
      this.data.id,
      { status: ORDER_STATUS.ACCEPTED },
      { new: true }
    );
    // get provider name from providerId
    const notificationDetails = {
      userId: order.clientId,
      notificationId: order._id,
      message: `${this.data.providerFullName} accepted your request`,
      serviceId: order.serviceId,
      notificationType: NOTIFICATION_TYPE.ACCEPT_SERVICE_REQUEST,
    };
    Notification.createNotification(notificationDetails);
  }

  //cancel order
  async cancelOrder() {
    const order = await orderSchema.findByIdAndUpdate(
      this.data.id,
      { status: ORDER_STATUS.CANCELLED },
      { new: true }
    );
    const notificationDetails = {
      userId: order.clientId,
      notificationId: order._id,
      message: `${this.data.clientFullName} rejected your request`,
      serviceId: order.serviceId,
      notificationType: NOTIFICATION_TYPE.SERVICE_REQUEST_REJECTED,
    };
    Notification.createNotification(notificationDetails);
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
