const { error, success } = require("../utils/baseController");
const { generateAuthToken } = require("../core/userAuth");
const { logger } = require("../utils/logger");
const Discount = require("../service/Discount");

exports.add = async (req, res) => {
  try {
    const discount = await new Discount(req.body).add();
    return success(res, { discount });
  } catch (err) {
    logger.error("Error occurred at add discount", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getOne = async (req, res) => {
  try {
      const discounts = await new Discount(req.params.id).getOne();
      return success(res, { discounts });
  } catch (err) {
      logger.error("Error occurred at get one discount", err);
      return error(res, { code: err.code, message: err });
  }
}

exports.getAll = async (req, res) => {
  try {
    req.query["limit"] = req.query["limit"] || 10;
    req.query["offset"] = req.query["offset"] || 0;
      const discounts = await new Discount(req.query).getAll();
      return success(res, { discounts });
  } catch (err) {
      logger.error("Error occurred at get all discount", err);
      return error(res, { code: err.code, message: err });
  }
}

exports.deleteOne = async (req, res) => {
  try {
      const discounts = await new Discount(req.params.id).deleteOne();
      return success(res, { discounts });
  } catch (err) {
      logger.error("Error occurred at delete one discount", err);
      return error(res, { code: err.code, message: err });
  }
}

exports.userDiscount = async (req, res) => {
  try {
    const discount = await new Discount(req.body).userDiscount();
    return success(res, { discount });
  } catch (err) {
    logger.error("Error occurred at add discount", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getUser = async (req, res) => {
  try {
    req.query["limit"] = req.query["limit"] || 10;
    req.query["offset"] = req.query["offset"] || 0;
      const discounts = await new Discount(req.query).getUser();
      return success(res, { discounts });
  } catch (err) {
      logger.error("Error occurred at get all discount", err);
      return error(res, { code: err.code, message: err });
  }
}

exports.referalDiscount = async (req, res) => {
  try {
      const discounts = await new Discount(req.params.id).referalDiscount();
      return success(res, { discounts });
  } catch (err) {
      logger.error("Error occurred at get one discount", err);
      return error(res, { code: err.code, message: err });
  }
}
