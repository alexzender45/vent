const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Rating = require("../service/Rating");

exports.create = async (req, res) => {
  try {
    const reviewerId = req.user._id;
    const { rating, review } = req.body;
    const rating = await new Rating({
      reviewerId,
      rating,
      review,
    }).create();
    return success(res, { rating });
  } catch (err) {
    logger.error("Error creating rating", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get all provider ratings
exports.getAllProviderRating = async (req, res) => {
  try {
    const { providerId } = req.params.providerId;
    const ratings = await new Rating({ providerId }).getAllProviderRating();
    return success(res, { ratings });
  } catch (err) {
    logger.error("Error getting ratings", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get all service ratings
exports.getAllServiceRating = async (req, res) => {
  try {
    const { serviceId } = req.params.serviceId;
    const ratings = await new Rating({ serviceId }).getAllServiceRating();
    return success(res, { ratings });
  } catch (err) {
    logger.error("Error getting ratings", err);
    return error(res, { code: err.code, message: err.message });
  }
};
