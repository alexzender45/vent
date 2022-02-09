const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Dispute = require("../service/Dispute");

exports.createDispute = async (req, res) => {
  try {
      req.body["clientId"] = req.user._id;
    const dispute = await new Dispute(req.body).createDispute();
    return success(res, { dispute });
  } catch (err) {
    logger.error("Error creating dispute", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await new Dispute().getAllDisputes();
    return success(res, { disputes });
  } catch (err) {
    logger.error("Error getting all dispute", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getDisputeById = async (req, res) => {
  try {
    const dispute = await new Dispute(req.params.id).getDisputeById();
    return success(res, { dispute });
  } catch (err) {
    logger.error("Error getting dispute", err);
    return error(res, { code: err.code, message: err.message });
  }
}
