const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Rating = require("../service/Rating");

exports.createRating = async (req, res) => {
  try {
      req.body["reviewerId"] = req.user._id;
    // const { rating, review, orderId, serviceId, providerId } = req.body;
    const createRating = await new Rating(req.body).createRating();
    return success(res, { createRating });
  } catch (err) {
    logger.error("Error creating rating", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get all provider ratings
exports.getAllProviderRating = async (req, res) => {
  try {
    const ratings = await new Rating(
      req.params.providerId
    ).getAllProviderRating();
    return success(res, { ratings });
  } catch (err) {
    logger.error("Error getting ratings", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get all service ratings
exports.getAllServiceRating = async (req, res) => {
  try {
    const ratings = await new Rating(
      req.params.serviceId
    ).getAllServiceRating();
    return success(res, { ratings });
  } catch (err) {
    logger.error("Error getting ratings", err);
    return error(res, { code: err.code, message: err.message });
  }
};
