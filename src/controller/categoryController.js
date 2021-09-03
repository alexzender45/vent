const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Category = require("../service/Category");

exports.create = async (req, res) => {
  try {
    const category = await new Category(req.body).create();
    return success(res, { category });
  } catch (err) {
    logger.error("Error creating category", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getAllCategory = async (req, res) => {
  try {
    const categories = await Category.getAllCategories();
    return success(res, { categories });
  } catch (err) {
    logger.error("Error getting all categories", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await new Category(req.params.id).deleteCategory();
    return success(res, { message: "Category Removed Successfully" });
  } catch (err) {
    logger.error("Error deleting category", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const serviceProvider = await new Category(req.params.id).getCategory();
    return success(res, { serviceProvider });
  } catch (err) {
    logger.error("Error getting category", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getCategoryByType = async (req, res) => {
  try {
    const serviceProvider = await new Category(req.params.type).getCategoryByType();
    return success(res, { serviceProvider });
  } catch (err) {
    logger.error("Error getting category by type", err);
    return error(res, { code: err.code, message: err.message });
  }
};
