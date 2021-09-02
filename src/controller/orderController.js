const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Order = require("../service/Order");

exports.create = async (req, res) => {
  try {
    req.body["clientId"] = req.user._id;
    req.body["serviceId"] = req.params.serviceId;
    const { numberOfItems, notes, dateRequested, location, specifiedTime } =
      req.body;
    const oder = await new Order({
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

exports.getOrdersForClient = async (req, res) => {
  try {
    const clientOrders = await new Order(req.user._id).getOrdersForClient();
    return success(res, { clientOrders });
  } catch (err) {
    logger.error("Error getting all client orders", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.rejectOrder = async (req, res) => {
  try {
    await new Order(req.params.id).rejectOrder();
    return success(res, { message: "Reject Order Successfully" });
  } catch (err) {
    logger.error("Error rejecting order", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    await new Order(req.params.id).cancelOrder();
    return success(res, { message: "Cancel Order Successfully" });
  } catch (err) {
    logger.error("Error cancelling order", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    await new Order(req.params.id).acceptOrder();
    return success(res, { message: "Accepted Order Successfully" });
  } catch (err) {
    logger.error("Error accepting order", err);
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

exports.getOrdersForProvider = async (req, res) => {
  try {
    const providerOrders = await new Order(req.user._id).getOrdersForProvider();
    return success(res, { providerOrders });
  } catch (err) {
    logger.error("Error getting all provider orders", err);
    return error(res, { code: err.code, message: err.message });
  }
};
