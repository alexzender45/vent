const { error, success } = require("../utils/baseController");
const { generateAuthToken } = require("../core/userAuth");
const { logger } = require("../utils/logger");
const Discount = require("../service/Discount");
const Access = require("../service/Access");

exports.add = async (req, res) => {
  try {
    const access = await new Access(req.body).add();
    return success(res, { access });
  } catch (err) {
    logger.error("Error occurred at add access", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getOwner = async (req, res) => {
  try {
      const access = await new Access().getOwner();
      return success(res, { access });
  } catch (err) {
      logger.error("Error occurred at get one discount", err);
      return error(res, { code: err.code, message: err });
  }
}

exports.getSupport = async (req, res) => {
  try {
      const access = await new Access().getSupport();
      return success(res, { access });
  } catch (err) {
      logger.error("Error occurred at get one discount", err);
      return error(res, { code: err.code, message: err });
  }
}

exports.getAll = async (req, res) => {
  try {
      const access = await new Access().getAll();
      return success(res, { access });
  } catch (err) {3
      logger.error("Error occurred at get all access", err);
      return error(res, { code: err.code, message: err });
  }
}

exports.deleteOne = async (req, res) => {
  try {
      const discounts = await new Access(req.params.id).deleteOne();
      return success(res, { discounts });
  } catch (err) {
      logger.error("Error occurred at delete one discount", err);
      return error(res, { code: err.code, message: err });
  }
}

exports.editOwner = async (req, res) => {
  try {
    const access = await new Access(req.body).editOwner();
    return success(res, { access });
  } catch (err) {
    logger.error("Error occurred at add access", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.editSupport = async (req, res) => {
  try {
    const access = await new Access(req.body).editSupport();
    return success(res, { access });
  } catch (err) {
    logger.error("Error occurred at add access", err);
    return error(res, { code: err.code, message: err });
  }
};
