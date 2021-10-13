const cartSchema = require("../models/cartModel");
const orderSchema = require("../models/orderModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const {
  ORDER_STATUS,
  SERVICE_TYPE,
  TRANSACTION_TYPE,
  NOTIFICATION_TYPE,
  PAYMENT_STATUS,
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
      .orFail(() => throwError("Order not found"));
    await cartItem.remove();
    await order.remove();
  }

  async getAllClientCartItems() {
    return await cartSchema
      .find({ clientId: this.data })
      .populate("orderId clientId serviceId", "status fullName price type name")
      .orFail(() => throwError(`No Order Found`, 404));
  }

  async checkOut() {
    const clientId = this.data.clientId;
    const referenceCode = Math.floor(100000 + Math.random() * 100000);
    const cartItems = await cartSchema
      .find({ clientId: clientId })
      .populate("orderId clientId serviceId", "status fullName price type name")
      .orFail(() => throwError(`No Order Found`, 404));
    const acceptedOrders = cartItems.filter(
      (order) => order.orderId.status === ORDER_STATUS.ACCEPTED
    );
    const totalPrice = acceptedOrders.reduce((acc, order) => {
      return acc + order.orderId.price;
    }, 0);
    if (this.data.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      const debitTransactionDetails = {
        userId: clientId,
        amount: totalPrice,
        reason: "Pay for accepted services",
        type: TRANSACTION_TYPE.DEBIT,
        reference: "ORD" + referenceCode,
        paymentDate: Date.now(),
      };
      Transaction.createTransaction(debitTransactionDetails);
      const pendingOrders = acceptedOrders.filter(
        (order) =>
          order.serviceId.type === SERVICE_TYPE.BOOKING_SERVICE ||
          SERVICE_TYPE.ONLINE_SERVICE
      );
      pendingOrders.map((order) => {
        const notificationDetails = {
          userId: order.providerId,
          notificationId: order._id,
          message: `${this.data.fullName} requested a service`,
          serviceId: order.serviceId,
          notificationType: NOTIFICATION_TYPE.SERVICE_REQUEST,
        };
        Notification.createNotification(notificationDetails);
      });
      acceptedOrders.forEach((order) => {
        order.orderId.status = ORDER_STATUS.PAID;
        order.orderId.save();
      });
      acceptedOrders.forEach((order) => {
        order.remove();
      });
    } else {
      throwError("Payment Failed", 400);
    }
  }
}

module.exports = Cart;
