const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Order = require("../service/Order");

exports.create = async (req, res) => {
  try {
    const clientId = req.user._id;
    const serviceId = req.params.serviceId;
    const { numberOfItems, notes, dateRequested, location, specifiedTime } =
      req.body;
    const oder = await new Order({
      clientId,
      serviceId,
      numberOfItems,
      notes,
      dateRequested,
      location,
      specifiedTime,
    }).create();
    return success(res, { oder });
  } catch (err) {
    logger.error("Error creating order", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getAllClientOrder = async (req, res) => {
  try {
    const clientOrders = await Order.getAllClientOrder();
    return success(res, { clientOrders });
  } catch (err) {
    logger.error("Error getting all client orders", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    await new Order(req.params.id).cancelOrder();
    return success(res, { message: "Cancelled Order Successfully" });
  } catch (err) {
    logger.error("Error cancelling order", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await new Order(req.params.id).getOder();
    return success(res, { order });
  } catch (err) {
    logger.error("Error getting order", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.getAllOrders();
    return success(res, { orders });
  } catch (err) {
    logger.error("Error getting all orders", err);
    return error(res, { code: err.code, message: err.message });
  }
};
