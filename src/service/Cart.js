const cartSchema = require("../models/cartModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const { ORDER_STATUS } = require("../utils/constants");

class Cart {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async deleteItemFromCart() {
    const cartItem = await cartSchema.findById(this.data);
    // cancel order
    const order = await orderSchema.findById(cartItem.orderId);
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();
    return await cartItem.remove();
  }

  async getAllClientCartItems() {
    return await cartSchema
      .find({ clientId: this.data })
      .populate("serviceId orderId", "name type status price")
      .orFail(() => throwError(`No Order Found For ${type} Type`, 404));
  }
}

module.exports = Cart;
