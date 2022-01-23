const cartSchema = require("../models/cartModel");
const orderSchema = require("../models/orderModel");
const serviceClientSchema = require("../models/serviceClientModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const {
  orderNotification,
  orderPaidNotification,
  orderPaidNotificationForProvider,
} = require("../utils/sendgrid");
const {
  ORDER_STATUS,
  SERVICE_TYPE,
  TRANSACTION_TYPE,
  NOTIFICATION_TYPE,
  PAYMENT_STATUS,
  CANCELLED_STATUS,
  CANCELLED_MESSAGE,
} = require("../utils/constants");
const Transaction = require("../service/Transaction");
const Notification = require("./Notification");

class Cart {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }
  // delete cart item by id and delete order
  async deleteCartItem() {
    const cartItem = await cartSchema
      .findById(this.data)
      .orFail(() => throwError("Cart item not found"));
    const order = await orderSchema
      .findById(cartItem.orderId)
      .populate(
        "serviceId clientId providerId",
        " fullName profilePictureUrl name email"
      )
      .orFail(() => throwError("Order not found"));
    await cartItem.remove();
    order.status = ORDER_STATUS.CANCELLED;
    order.save();
    const notificationDetails = {
      userId: order.clientId,
      orderId: order._id,
      message: `${order.clientId.fullName} cancelled this order`,
      serviceId: order.serviceId,
      image: order.clientId.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.SERVICE_REQUEST,
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

  async getAllClientCartItems() {
    return await cartSchema
      .find({ clientId: this.data })
      .populate(
        "orderId clientId serviceId",
        "status fullName price type name portfolioFiles email"
      )
      .orFail(() => throwError(`No Order Found`, 404));
  }

  async checkOut() {
    const { clientId, paymentStatus } = this.data;
    const referenceCode = Math.floor(100000 + Math.random() * 100000);
    const cartItems = await cartSchema
      .find({ clientId: clientId })
      .populate(
        "orderId clientId providerId serviceId",
        "status fullName price type name userId numberOfItems orderReference email phoneNumber"
      )
      .orFail(() => throwError(`No Order Found`, 404));
    const acceptedOrders = cartItems.filter(
      (order) => order.orderId.status === ORDER_STATUS.ACCEPTED
    );
    if (acceptedOrders.length === 0) {
      throwError("No accepted orders found", 404);
    }
    const totalPrice = acceptedOrders.reduce((acc, order) => {
      return acc + order.orderId.price;
    }, 0);
    if (paymentStatus === PAYMENT_STATUS.SUCCESS) {
      const debitTransactionDetails = {
        userId: clientId,
        amount: totalPrice,
        reason: `Pay #${totalPrice} for accepted services`,
        type: TRANSACTION_TYPE.DEBIT,
        reference: "ORD" + referenceCode,
        paymentDate: Date.now(),
      };
      Transaction.createTransaction(debitTransactionDetails);
      const pendingOrders = acceptedOrders.filter(
        (order) =>
          order.serviceId.type === SERVICE_TYPE.BOOKING || SERVICE_TYPE.ONLINE
      );
      const serviceClient = await serviceClientSchema.findById(clientId);
      pendingOrders.map((order) => {
        const notificationDetails = {
          userId: order.serviceId.userId,
          orderId: order._id,
          message: `${serviceClient.fullName} requested a service`,
          serviceId: order.serviceId._id,
          image: serviceClient.profilePictureUrl,
          price: totalPrice,
          serviceName: order.serviceId.name,
          notificationType: NOTIFICATION_TYPE.SERVICE_REQUEST,
        };
        Notification.createNotification(notificationDetails);
      });
      acceptedOrders.forEach((order) => {
        order.orderId.status = ORDER_STATUS.PAID;
        orderPaidNotificationForProvider(
          order.providerId.email,
          order.providerId.fullName,
          order.orderId.price,
          order.orderId.numberOfItems,
          order.orderId.orderReference,
          order.clientId.fullName,
          order.clientId.phoneNumber,
          order.clientId.email,
          order.serviceId.name
        );
        order.orderId.save();
      });
      orderPaidNotification(
        serviceClient.email,
        serviceClient.fullName,
        totalPrice
      );
      acceptedOrders.forEach((order) => {
        order.remove();
      });
    } else {
      throwError("Payment Failed", 400);
    }
  }
}

module.exports = Cart;
