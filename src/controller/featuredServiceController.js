const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const FeaturedService = require("../service/FeaturedService");

exports.createFeaturedService = async (req, res) => {
  try {
    const featuredService = await new FeaturedService(req.body).createFeaturedService();
    return success(res, { featuredService });
  } catch (err) {
    logger.error("Error creating featured service", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getAllFeaturedService = async (req, res) => {
  try {
    const featuredServices = await new FeaturedService().getAllFeaturedServices();
    return success(res, { featuredServices });
  } catch (err) {
    logger.error("Error getting all featured services", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getFeaturedServiceById = async (req, res) => {
  try {
    const featuredService = await new FeaturedService(req.params.id).getFeaturedServiceById();
    return success(res, { featuredService });
  } catch (err) {
    logger.error("Error getting featured service", err);
    return error(res, { code: err.code, message: err.message });
  }
}

exports.updateFeaturedService = async (req, res) => {
    try {
        const featuredService = await new FeaturedService({id: req.params.id, newDetails: req.body}).updateFeaturedService();
        return success(res, { featuredService });
    } catch (err) {
        logger.error("Error updating featured service", err);
        return error(res, { code: err.code, message: err.message });
    }
    }

exports.getActiveFeaturedService = async (req, res) => {
    try {
        const featuredServices = await new FeaturedService().getActiveFeaturedServices();
        return success(res, { featuredServices });
    } catch (err) {
        logger.error("Error getting active featured service", err);
        return error(res, { code: err.code, message: err.message });
    }
    }
exports.makeServiceFeatured = async (req, res) => {
    try {
        await new FeaturedService(req.body).makeServiceFeatured();
        return success(res, { message: "Featured service successfully made" });
    } catch (err) {
        logger.error("Error making service featured", err);
        return error(res, { code: err.code, message: err.message });
    }
    }

exports.updateFeaturedServiceTransaction = async (req, res) => {
    try {
        const featuredService = await new FeaturedService({id: req.params.id, transactionId: req.body}).updateFeaturedServiceTransaction();
        return success(res, { featuredService });
    } catch (err) {
        logger.error("Error updating featured service", err);
        return error(res, { code: err.code, message: err.message });
    }
    }
exports.getAllFeaturedServices = async (req, res) => {
    try {
        const featuredServices = await new FeaturedService(req.query).getFeaturedServices();
        return success(res, { featuredServices });
    } catch (err) {
        logger.error("Error getting featured services", err);
        return error(res, { code: err.code, message: err.message });
    }
    }
