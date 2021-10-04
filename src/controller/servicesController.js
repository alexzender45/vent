const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Services = require("../service/Services");

exports.create = async (req, res) => {
  try {
    const {_id, location} = req.user;
    const parameters = req.body;
    parameters["userId"] = _id;
    const service = await new Services({parameters, location}).create();
    return success(res, { service });
  } catch (err) {
    logger.error("Error creating service", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getAllProviderService = async (req, res) => {
  try {
    const services = await new Services(req.params.userId).getAllUserServices();
    return success(res, { services });
  } catch (err) {
    logger.error("Error getting all provider's services", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await new Services({id: req.params.id, newDetails: req.body, userLocation: req.user.location}).updateService();
    return success(res, { service });
  } catch (err) {
    logger.error("Error updating service", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const message = await new Services({_id: req.params.id, userId: req.user._id}).deleteService();
    return success(res, { message });
  } catch (err) {
    logger.error("Error deleting service", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await new Services(req.params.id).getService();
    return success(res, { service });
  } catch (err) {
    logger.error("Error getting service", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getServiceByType = async (req, res) => {
  try {
    const services = await new Services(req.params.type).getServiceByType();
    return success(res, { services });
  } catch (err) {
    logger.error("Error getting services by type", err);
    return error(res, { code: err.code, message: err.message });
  }
};
