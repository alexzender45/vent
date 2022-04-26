const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Cart = require("../service/Cart");

exports.getAllClientCartItems = async (req, res) => {
  try {
    const clientCartItems = await new Cart(
      req.user._id
    ).getAllClientCartItems();
    return success(res, { clientCartItems });
  } catch (err) {
    logger.error("Error getting all client cart items", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.deleteItemFromCart = async (req, res) => {
  try {
    await new Cart(req.params.id).deleteCartItem();
    return success(res, { message: "Item Removed Successfully" });
  } catch (err) {
    logger.error("Error deleting item", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const clientId = req.user._id;
    const paymentStatus = req.query.paymentStatus;
    const transactionId = req.query.transactionId;
    await new Cart({ clientId, paymentStatus, transactionId }).checkOut();
    return success(res, { message: "Checkout Successful" });
  } catch (err) {
    logger.error("Error checking out", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.updateCartItems = async (req, res) => {
  try {
    const clientId = req.user._id;
    const transactionId = req.query.transactionId;
    await new Cart({
      clientId,
      transactionId,
    }).updateCartItems();
    return success(res, { message: "Cart Items Updated Successfully" });
  } catch (err) {
    logger.error("Error updating cart item", err);
    return error(res, { code: err.code, message: err.message });
  }
}
