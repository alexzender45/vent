const cartSchema = require("../models/cartModel");
const orderSchema = require("../models/orderModel");
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
    const order = await orderSchema.findOneAndUpdate(
      { _id: cartItem.orderId },
      { status: ORDER_STATUS.CANCELLED }
    );
    return await cartItem.remove();
  }

  async getAllClientCartItems() {
    return await cartSchema
      .find({ clientId: this.data })
      .populate("orderId clientId serviceId", "status fullName price type name")
      .orFail(() => throwError(`No Order Found`, 404));
  }
}

module.exports = Cart;
