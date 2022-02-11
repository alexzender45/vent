const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Order = require("../service/Order");

function addUserLocationToOrder(parameters, userLocation) {
  const { useProfileLocation } = parameters;
  const { country, state, address } = userLocation;
  if (useProfileLocation) {
    parameters["country"] = country;
    parameters["state"] = state;
    parameters["address"] = address;
  }
}

exports.create = async (req, res) => {
  try {
    const reference = Math.floor(1000002308 + Math.random() * 1000002308);
    const { _id, location } = req.user;
    const parameters = req.body;
    parameters["userId"] = _id;
    addUserLocationToOrder(parameters, location);
    parameters["clientId"] = req.user._id;
    parameters["fullName"] = req.user.fullName;
    parameters["orderReference"] = `${reference}.VENT`;
    await new Order(parameters).create();
    return success(res, { message: "Order Created Successfully" });
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
    await new Order(req.body.id).rejectOrder();
    return success(res, { message: "Reject Order Successfully" });
  } catch (err) {
    logger.error("Error rejecting order", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    await new Order(req.body).cancelOrder();
    return success(res, { message: "Cancel Order Successfully" });
  } catch (err) {
    logger.error("Error cancelling order", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    await new Order(req.body).acceptOrder();
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

// get order by reference
exports.getOrderByReference = async (req, res) => {
  try {
    const order = await new Order(req.params.reference).getOrderByReference();
    return success(res, { order });
  } catch (err) {
    logger.error("Error getting order", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.searchOrdersByClientId = async (req, res) => {
  try {
    const orders = await new Order(
      req.params.clientId
    ).searchOrdersByClientId();
    return success(res, { orders });
  } catch (err) {
    logger.error("Error getting client orders", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get all client orders or orders for provider by status
exports.getOrdersByStatus = async (req, res) => {
  try {
    const id = req.user._id;
    const status = req.params.status;
    const orders = await new Order({
      id,
      status,
    }).getOrdersForClientOrProvider();
    return success(res, { orders });
  } catch (err) {
    logger.error("Error getting orders by status", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.startOrderedService = async (req, res) => {
  try {
    const orderedService = await new Order({
      orderId: req.body.orderId,
      userId: req.user._id,
      dateToCompleteService: req.body.dateToCompleteService,
    }).startOrder();
    return success(res, { orderedService });
  } catch (err) {
    logger.error("Error starting ordered service", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.endOrderedService = async (req, res) => {
  try {
    req.body["userType"] = req.user.userType;
    req.body["userId"] = req.user._id;
    const orderedService = await new Order(req.body).endOrder();
    return success(res, { orderedService });
  } catch (err) {
    logger.error("Error ending ordered service", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get client orders by status
exports.getOrdersByStatusForClient = async (req, res) => {
  try {
    const clientId = req.user._id;
    const status = req.query.status;
    const orders = await new Order({
      clientId,
      status,
    }).getClientOrdersWithStatus();
    return success(res, { orders });
  } catch (err) {
    logger.error("Error getting orders by status", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get provider orders by status
exports.getOrdersByStatusForProvider = async (req, res) => {
  try {
    const providerId = req.user._id;
    const status = req.query.status;
    const orders = await new Order({
      providerId,
      status,
    }).getProviderOrdersWithStatus();
    return success(res, { orders });
  } catch (err) {
    logger.error("Error getting orders by status", err);
    return error(res, { code: err.code, message: err.message });
  }
};
