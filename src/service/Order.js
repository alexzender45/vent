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
const { showNotification, sendMessageorder } = require("../utils/notification");
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
    // const service = await serviceSchema.findById(parameters.serviceId)
    // .populate('userId');
    // const serviceClient = await serviceClientSchema.findById(
    //   parameters.clientId
    // );
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
      // if (parameters.serviceType === SERVICE_TYPE.REQUESTING) {
        addOrderLocation(parameters);
        const order = await new orderSchema(parameters).save();
        const service = await serviceSchema.findById(parameters.serviceId)
        .populate('userId');
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
        const notification = await Notification.createNotification(notificationDetails);
        new cartSchema({
          clientId: order.clientId,
          orderId: order._id,
          serviceId: order.serviceId,
          amount: order.price,
          providerId: order.providerId,
        }).save();
        const data = {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          orderId: order._id.toString(),
          serviceId: order.serviceId.toString(),
          notificationId: notification._id.toString(),
          type: NOTIFICATION_TYPE.SERVICE_REQUEST,
        }
        const message = await sendMessageorder(
          `Hi ${service.userId.fullName}`, 
          `Your Service ${service.name} has been Ordered by ${serviceClient.fullName}.Please check your notifications to ACCEPT or REJECT the Service`, 
          data);
          if (service.userId.firebaseToken) {
          await showNotification(service.userId.firebaseToken, message);
          //}
          return order;
      // } else {
      //   this.data["status"] = ORDER_STATUS.ACCEPTED;
      //   addOrderLocation(parameters);
      //   const order = await new orderSchema(parameters).save();
      //   new cartSchema({
      //     clientId: order.clientId,
      //     orderId: order._id,
      //     serviceId: order.serviceId,
      //     amount: order.price,
      //     providerId: order.providerId,
      //   }).save();
      //   orderNotification(
      //     serviceClient.email,
      //     serviceClient.fullName,
      //     service.name,
      //     order.orderReference,
      //     ACCEPTED_STATUS,
      //     ACCEPTED_MESSAGE
      //   );
      //   const data = {
      //     click_action: "FLUTTER_NOTIFICATION_CLICK",
      //     orderId: order._id.toString(),
      //     serviceId: order.serviceId.toString(),
      //     type: NOTIFICATION_TYPE.SERVICE_REQUEST,
      //   }
      //   const message = await sendMessageorder(
      //     `Hi ${service.userId.fullName}`, 
      //     `Your Service ${service.name} has been Ordered by ${serviceClient.fullName}.Please check your notifications for Order Details`, 
      //     data);
      //     if (service.userId.firebaseToken) {
      //     await showNotification(service.userId.firebaseToken, message);
      //     }
      //   return order;
       }
    }
  }

  async getOder() {
    return await orderSchema
      .findById(this.data)
      .populate(
        "providerId clientId serviceId"
      )
      .orFail(() => throwError("Order Not Found", 404));
  }

  static async getAllOrders() {
    return await orderSchema
      .find()
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
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
        "serviceId clientId providerId"
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
    const notification = await Notification.createNotification(notificationDetails);
    orderNotification(
      order.clientId.email,
      order.clientId.fullName,
      order.serviceId.name,
      order.orderReference,
      REJECTED_STATUS,
      REJECTED_MESSAGE
    );
    const data = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      orderId: order._id.toString(),
      serviceId: order.serviceId.toString(),
      notificationId: notification._id.toString(),
      type: NOTIFICATION_TYPE.SERVICE_REQUEST_REJECTED
    }
    const message = await sendMessageorder(
      `Hi ${order.clientId.fullName}`, 
      `Order ${order.serviceId.name} has been Rejected by ${order.providerId.fullName}.Please login to your account to check the status of your order`, 
      data);
      if (order.clientId.firebaseToken) {
      await showNotification(order.clientId.firebaseToken, message);
      }
    return order;
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
        "serviceId clientId providerId"
      );
    const notificationDetails = {
      userId: order.clientId,
      orderId: order._id,
      message: `${order.providerId.fullName} accepted your request`,
      serviceId: order.serviceId,
      image: order.providerId.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.ACCEPT_SERVICE_REQUEST,
    };
    const notification = await Notification.createNotification(notificationDetails);
    orderNotification(
      order.clientId.email,
      order.clientId.fullName,
      order.serviceId.name,
      order.orderReference,
      ACCEPTED_STATUS,
      ACCEPTED_MESSAGE
    );
    const data = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      orderId: order._id.toString(),
      serviceId: order.serviceId.toString(),
      notificationId: notification._id.toString(),
      type: NOTIFICATION_TYPE.ACCEPT_SERVICE_REQUEST,
    }
    const message = await sendMessageorder(
      `Hi ${order.clientId.fullName}`, 
      `Order ${order.serviceId.name} has been Accepted by ${order.providerId.fullName}.Please login to make payment`, 
      data);
      if (order.clientId.firebaseToken) {
      await showNotification(order.clientId.firebaseToken, message);
      }
    return order;
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
        "serviceId clientId providerId"
      );
    const notificationDetails = {
      userId: order.clientId,
      orderId: order._id,
      message: `${order.clientId.fullName} cancelled this order`,
      serviceId: order.serviceId,
      image: order.clientId.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.SERVICE_REQUEST_REJECTED,
    };
    const notification = await Notification.createNotification(notificationDetails);
    orderNotification(
      order.providerId.email,
      order.clientId.fullName,
      order.serviceId.name,
      order.orderReference,
      CANCELLED_STATUS,
      CANCELLED_MESSAGE
    );
    const data = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      orderId: order._id.toString(),
      serviceId: order.serviceId.toString(),
      notificationId: notification._id.toString(),
      type: NOTIFICATION_TYPE.SERVICE_REQUEST_CANCLLED
    }
    const message = await sendMessageorder(
      `Hi ${order.providerId.fullName}`, 
      `Order ${order.serviceId.name} has been Cancelled by ${order.clientId.fullName}.Please login to check the order status`, 
      data);
      if (order.providerId.firebaseToken) {
      await showNotification(order.providerId.firebaseToken, message);
      }
    return order;
  }

  // get all orders for a client
  async getOrdersForClient() {
    return await orderSchema
      .find({ clientId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
      )
      .orFail(() => throwError("No Order Found", 404));
  }

  async getOrdersForProvider() {
    return await orderSchema
      .find({ providerId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
      )
      .orFail(() => throwError("No Order Found", 404));
  }

  // get order by reference
  async getOrderByReference() {
    return await orderSchema
      .findOne({ orderReference: this.data })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
      )
      .orFail(() => throwError("Order Not Found", 404));
  }

  async searchOrdersByClientId() {
    return await orderSchema
      .find({ clientId: this.data })
      .sort({ createdAt: -1 })
      .populate(
        "providerId clientId serviceId",
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
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
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
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
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
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
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
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
        "fullName profilePictureUrl name type priceDescription categoryId occupation phoneNumber email firebaseToken"
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
    const data = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      orderId: order._id.toString(),
      serviceId: order.serviceId.toString(),
      type: NOTIFICATION_TYPE.SERVICE_REQUEST_STARTED
    }
    const message = await sendMessageorder(
      `Hi ${order.clientId.fullName}`, 
      `Order ${order.serviceId.name} has been STARTED by ${order.providerId.fullName}.Please login to check the order status`, 
      data);
      if (order.clientId.firebaseToken) {
      await showNotification(order.clientId.firebaseToken, message);
      }
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
      .populate("serviceId providerId clientId")
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

    const providerWallet = await new Wallet(providerId._id).getUserWallet();
    providerWallet.pendingWithdrawal += order.price;
    await providerWallet.save();

    order.status = ORDER_STATUS.COMPLETED;
    order.completedDate = new Date();
    const data = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      orderId: order._id.toString(),
      serviceId: order.serviceId._id.toString(),
      type: NOTIFICATION_TYPE.SERVICE_REQUEST_COMPLETED
    }
    const message = await sendMessageorder(
      `Hi ${order.clientId.fullName}`, 
      `Order ${order.serviceId.name} has been COMPLETED by ${order.providerId.fullName}.Please login to check the order status`, 
      data);
      if (order.clientId.firebaseToken) {
      await showNotification(order.clientId.firebaseToken, message);
      }
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