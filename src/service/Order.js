const orderSchema = require("../models/orderModel");
const cartSchema = require("../models/cartModel");
const serviceSchema = require("../models/servicesModel");
const serviceClientSchema = require("../models/serviceClientModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const { orderNotification } = require("../utils/sendgrid");
const {
  ORDER_STATUS,
  SERVICE_TYPE,
  NOTIFICATION_TYPE,
  ACCEPTED_MESSAGE,
  ACCEPTED_STATUS,
  REJECTED_MESSAGE,
  REJECTED_STATUS,
  CANCELLED_MESSAGE,
  CANCELLED_STATUS,
} = require("../utils/constants");
const Notification = require("./Notification");

function addOrderLocation(parameters) {
  const { useProfileLocation, country, state, address } = parameters;
  parameters["location"] = {
    useProfileLocation,
    country,
    state,
    address,
  };
}

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
        "serviceId",
        "numberOfItems",
        "price",
        "serviceType",
        "country",
        "state",
        "address",
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
    const service = await serviceSchema.findById(parameters.serviceId);
    const serviceClient = await serviceClientSchema.findById(
      parameters.clientId
    );
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
        addOrderLocation(parameters);
        const order = await new orderSchema(parameters).save();
        const service = await serviceSchema.findById(parameters.serviceId);
        const serviceClient = await serviceClientSchema.findById(
          parameters.clientId
        );
        const notificationDetails = {
          userId: parameters.providerId,
          orderId: order._id,
          message: `${parameters.fullName} requested a service`,
          serviceId: order.serviceId,
          image: serviceClient.profilePictureUrl,
          price: order.price,
          serviceName: service.name,
          notificationType: NOTIFICATION_TYPE.SERVICE_REQUEST,
        };
        Notification.createNotification(notificationDetails);
        new cartSchema({
          clientId: order.clientId,
          orderId: order._id,
          serviceId: order.serviceId,
          amount: order.price,
          providerId: order.providerId,
        }).save();
      } else {
        this.data["status"] = ORDER_STATUS.ACCEPTED;
        addOrderLocation(parameters);
        const order = await new orderSchema(parameters).save();
        new cartSchema({
          clientId: order.clientId,
          orderId: order._id,
          serviceId: order.serviceId,
          amount: order.price,
          providerId: order.providerId,
        }).save();
        orderNotification(
          serviceClient.email,
          serviceClient.fullName,
          service.name,
          order.orderReference,
          ACCEPTED_STATUS,
          ACCEPTED_MESSAGE
        );
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
    const order = await orderSchema
      .findByIdAndUpdate(
        this.data,
        { status: ORDER_STATUS.REJECTED },
        { new: true }
      )
      .populate(
        "serviceId clientId providerId",
        " fullName profilePictureUrl name email"
      )
      .orFail(() => throwError("Order Not Found", 404));
    const notificationDetails = {
      userId: order.clientId,
      orderId: order._id,
      message: `${order.providerId.fullName} rejected your request`,
      serviceId: order.serviceId,
      image: order.providerId.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.ACCEPT_SERVICE_REQUEST,
    };
    Notification.createNotification(notificationDetails);
    orderNotification(
      order.clientId.email,
      order.clientId.fullName,
      order.serviceId.name,
      order.orderReference,
      REJECTED_STATUS,
      REJECTED_MESSAGE
    );
  }

  // accept order
  async acceptOrder() {
    const order = await orderSchema
      .findByIdAndUpdate(
        this.data.id,
        { status: ORDER_STATUS.ACCEPTED },
        { new: true }
      )
      .populate(
        "serviceId clientId providerId",
        " fullName profilePictureUrl name email"
      );
    const notificationDetails = {
      userId: order.clientId,
      orderId: order._id,
      message: `${order.providerId.fullName} accepted your request`,
      serviceId: order.serviceId,
      image: order.providerId.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.ACCEPT_SERVICE_REQUEST,
    };
    Notification.createNotification(notificationDetails);
    orderNotification(
      order.clientId.email,
      order.clientId.fullName,
      order.serviceId.name,
      order.orderReference,
      ACCEPTED_STATUS,
      ACCEPTED_MESSAGE
    );
  }

  //cancel order
  async cancelOrder() {
    const order = await orderSchema
      .findByIdAndUpdate(
        this.data.id,
        { status: ORDER_STATUS.CANCELLED },
        { new: true }
      )
      .populate(
        "serviceId clientId providerId",
        " fullName profilePictureUrl name email"
      );
    const notificationDetails = {
      userId: order.clientId,
      orderId: order._id,
      message: `${order.clientId.fullName} cancelled this order`,
      serviceId: order.serviceId,
      image: order.clientId.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.SERVICE_REQUEST_REJECTED,
    };
    Notification.createNotification(notificationDetails);
    orderNotification(
      order.providerId.email,
      order.clientId.fullName,
      order.serviceId.name,
      order.orderReference,
      CANCELLED_STATUS,
      CANCELLED_MESSAGE
    );
  }

  // get all orders for a client
  async getOrdersForClient() {
    return await orderSchema
      .find({ clientId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name"
      )
      .orFail(() => throwError("No Order Found", 404));
  }

  async getOrdersForProvider() {
    return await orderSchema
      .find({ providerId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name"
      )
      .orFail(() => throwError("No Order Found", 404));
  }

  // get order by reference
  async getOrderByReference() {
    return await orderSchema
      .findOne({ orderReference: this.data })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name"
      )
      .orFail(() => throwError("Order Not Found", 404));
  }

  async searchOrdersByClientId() {
    return await orderSchema
      .find({ clientId: this.data })
      .sort({ createdAt: -1 })
      .populate("providerId serviceId", "fullName profilePictureUrl name")
      .orFail(() => throwError("No Orders for this Service Client", 404));
  }

  async getOrdersForClientOrProvider() {
    const { id, status } = this.data;
    return await orderSchema
      .find({
        $or: [{ clientId: id }, { providerId: id }],
        status,
      })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type price categoryId"
      )
      .populate("categoryId", "name")
      .orFail(() => throwError("No Order Found", 404));
  }
}

module.exports = Order;
