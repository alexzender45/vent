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
  USER_TYPE,
} = require("../utils/constants");
const Notification = require("./Notification");
const Wallet = require("./Wallet");
const Rating = require("./Rating");
const { error } = require("winston");
const UNAUTHORIZED_END_SERVICE_MESSAGE =
  "You are not authorized to end the service";
const UNAUTHORIZED_START_SERVICE_MESSAGE =
  "You are not authorized to start the service";
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
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      )
      .orFail(() => throwError("Order Not Found", 404));
  }

  static async getAllOrders() {
    return await orderSchema
      .find()
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      )
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
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      )
      .orFail(() => throwError("No Order Found", 404));
  }

  async getOrdersForProvider() {
    return await orderSchema
      .find({ providerId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      )
      .orFail(() => throwError("No Order Found", 404));
  }

  // get order by reference
  async getOrderByReference() {
    return await orderSchema
      .findOne({ orderReference: this.data })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      )
      .orFail(() => throwError("Order Not Found", 404));
  }

  async searchOrdersByClientId() {
    return await orderSchema
      .find({ clientId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      )
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
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      )
      .populate("categoryId", "name")
      .orFail(() => throwError("No Order Found", 404));
  }

  async clientOrders() {
    const { clientId } = this.data;
    return await orderSchema.find({ clientId });
  }

  async getAllOrderWithStatus() {
    const status = this.data;
    return await orderSchema
      .find({ status })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      ).orFail(() => throwError(`No Order with status ${status}`, 404));
  }

  // get client orders with status
  async getClientOrdersWithStatus() {
    const { clientId, status } = this.data;
    return await orderSchema
      .find({ clientId, status })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      );
  }

  // get provider orders with status
  async getProviderOrdersWithStatus() {
    const { providerId, status } = this.data;
    return await orderSchema
      .find({ providerId, status })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email"
      );
  }

  //service user starts all service (online, booking and requesting service)
  async startOrder() {
    const { orderId, userId, dateToCompleteService } = this.data;
    if(!dateToCompleteService || dateToCompleteService === "") {
      throwError("Please select a date to complete service", 400);
    }
    if(new Date(dateToCompleteService) < new Date()) {
      throwError("Please select date in future", 400);
    }
    this.data = orderId;
    const order = await this.getOder();
    if (order.providerId && order.providerId._id.toString() !== userId.toString()) {
      throwError(UNAUTHORIZED_START_SERVICE_MESSAGE);
    }

    if (order.status !== ORDER_STATUS.PAID) {
      throwError("Service is pending payment");
    }
    order.status = ORDER_STATUS.STARTED;
    order.dateToCompleteService = new Date(dateToCompleteService);
    return await order.save();
  }

  //service user ends online service
  //service provider ends booking and requesting service
  async endOrder() {
    const {
      orderId,
      userType,
      userId,
    } = this.data;
    const { isValid, messages } = validateParameters(
      ["orderId", "userType"],
      this.data
    );
    if (!isValid) {
      throwError(messages);
    }
    const order = await orderSchema
      .findById(orderId)
      .populate("serviceId", "type")
      .orFail(() => throwError("Order Not Found", 404));

    if (order.status !== ORDER_STATUS.STARTED) {
      throwError("Service Is Yet To Be Started");
    }
    const { providerId } = order;

    if (
      userType !== USER_TYPE.SERVICE_PROVIDER &&
      userId.toString() !== providerId._id.toString()
    ) {
      throwError(UNAUTHORIZED_END_SERVICE_MESSAGE);
    }

    const providerWallet = await new Wallet(providerId).getUserWallet();
    providerWallet.pendingWithdrawal += order.price;
    await providerWallet.save();

    order.status = ORDER_STATUS.COMPLETED;
    order.completedDate = new Date();
    const completedOrder = await order.save();
    return completedOrder;
  }
  async orderDispute(orderId) {
    const order = await orderSchema.findOne({ _id: orderId, dispute: true });
    if(order && order !== null) {
      return { error: "Order already has a dispute" };
    }
    const notCompletedOrder = await orderSchema.findOne({ _id: orderId, status: { $ne: ORDER_STATUS.COMPLETED } });
    if(notCompletedOrder && notCompletedOrder !== null) {
      return { error: "Order is not completed" };
    }
    return await orderSchema.findByIdAndUpdate(orderId, {
      dispute: true,
    });
  }
}

module.exports = Order;
