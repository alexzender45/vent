const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Services = require("../service/Services");

function addUserLocationToService(parameters, userLocation) {
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
    const {_id, location} = req.user;
    const parameters = req.body;
    parameters["userId"] = _id;
    addUserLocationToService(parameters, location);
    const service = await new Services(parameters).create();
    return success(res, { service });
  } catch (err) {
    logger.error("Error creating service", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getAllProviderService = async (req, res) => {
  try {
    const services = await new Services({userId: req.params.userId, type: req.query.type}).getAllUserServices();
    return success(res, { services });
  } catch (err) {
    logger.error("Error getting all provider's services", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    addUserLocationToService(req.body, req.user.location);
    const service = await new Services({id: req.params.id, newDetails: req.body}).updateService();
    return success(res, { service });
  } catch (err) {
    logger.error("Error updating service", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const message = await new Services({_id:req.params.id, userId:req.user._id}).deleteService();
    return success(res, { message });
  } catch (err) {
    console.log(err);
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
    const services = await new Services({type: req.params.type, categoryId: req.query.categoryId}).getServiceByType();
    return success(res, { services });
  } catch (err) {
    logger.error("Error getting services by type", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getServiceByCategory = async (req, res) => {
  try {
    const services = await new Services(req.params.categoryId).getServiceByCategory();
    return success(res, { services });
  } catch (err) {
    logger.error("Error getting services by category", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getAllService = async (req, res) => {
  try {
    const services = await new Services(req.query).getAllService();
    return success(res, services);
  } catch (err) {
    logger.error("Error getting all services", err);
    return error(res, { code: err.code, message: err.message });
  }
};
