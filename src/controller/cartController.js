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
    await new Cart(req.params.id).deleteItemFromCart();
    return success(res, { message: "Item Removed Successfully" });
  } catch (err) {
    logger.error("Error deleting item", err);
    return error(res, { code: err.code, message: err.message });
  }
};
