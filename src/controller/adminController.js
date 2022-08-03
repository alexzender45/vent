const { error, success } = require("../utils/baseController");
const { generateAuthToken } = require("../core/userAuth");
const { logger } = require("../utils/logger");
const Admin = require("../service/Admin");


exports.signup = async (req, res) => {
  try {
    const admin = await new Admin(req.body).signup();
    const token = await generateAuthToken({
      userId: admin._id,
      status: admin.status,
      role: admin.role,
      access: admin.access,
    });
    return success(res, { admin, token });
  } catch (err) {
    logger.error("Error occurred at signup", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.login = async (req, res) => {
    try {
        const admin = await new Admin(req.body).login();
        const token = await generateAuthToken({
        userId: admin._id,
        status: admin.status,
        role: admin.role,
        access: admin.access,
        });
        return success(res, { admin, token });
    } catch (err) {
        logger.error("Error occurred at login", err);
        return error(res, { code: err.code, message: err });
    }
    };

    exports.getAllAdmins = async (req, res) => {
        try {
            req.query["limit"] = req.query["limit"] || 10;
            req.query["offset"] = req.query["offset"] || 0;
            const admins = await new Admin(req.query).getAllAdmins();
            return success(res, { admins });
        } catch (err) {
            logger.error("Error occurred at getAllAdmins", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.approveAdmin = async (req, res) => {
        try {
            const admin = await new Admin(req.params.id).approveAdmin();
            return success(res, { admin });
        } catch (err) {
            logger.error("Error occurred at approveAdmin", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.deactivateAdmin = async (req, res) => { 
        try {
            const admin = await new Admin(req.params.id).deactivateAdmin();
            return success(res, { admin });
        } catch (err) {
            logger.error("Error occurred at deactivateAdmin", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.getAdminById = async (req, res) => {
        try {
            const admin = await new Admin(req.params.id).getAdminById();
            return success(res, { admin });
        } catch (err) {
            logger.error("Error occurred at getAdminById", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.overview = async (req, res) => {
        try {
            const overview = await new Admin().overview();
            return success(res, { overview });
        } catch (err) {
            logger.error("Error occurred at overview", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.getCompletedOrders = async (req, res) => {
        try {
            req.query["limit"] = req.query["limit"] || 10;
            req.query["offset"] = req.query["offset"] || 0;
            req.query["year"] = req.query["year"] || new Date().getFullYear();
            req.query["month"] = req.query["month"] || new Date().getMonth() + 1;
            const orders = await new Admin(req.query).getCompletedOrders();
            return success(res, { orders });
        } catch (err) {
            logger.error("Error occurred at getCompletedOrders", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.getTopServiceProviders = async (req, res) => {
        try {
            req.query["limit"] = req.query["limit"] || 10;
            req.query["offset"] = req.query["offset"] || 0;
            const serviceProviders = await new Admin(req.query).getTopServiceProviders();
            return success(res, { serviceProviders });
        } catch (err) {
            logger.error("Error occurred at getTopServiceProviders", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.getRecentOrders = async (req, res) => {
        try {
            req.query["limit"] = req.query["limit"] || 10;
            req.query["offset"] = req.query["offset"] || 0;
            const orders = await new Admin(req.query).getRecentOrders();
            return success(res, { orders });
        } catch (err) {
            logger.error("Error occurred at getRecentOrders", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.getTopServices = async (req, res) => {
        try {
            req.query["limit"] = req.query["limit"] || 10;
            req.query["offset"] = req.query["offset"] || 0;
            const services = await new Admin(req.query).getTopServices();
            return success(res, { services });
        } catch (err) {
            logger.error("Error occurred at getTopServices", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.getSuccessfulTransactions = async (req, res) => {
        try {
            req.query["limit"] = req.query["limit"] || 10;
            req.query["offset"] = req.query["offset"] || 0;
            const transactions = await new Admin(req.query).getSuccessfulTransactions();
            return success(res, { transactions });
        } catch (err) {
            logger.error("Error occurred at getSuccessfulTransactions", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.getAllServiceClient = async (req,res) => {
        try {
             req.query["limit"] = req.query["limit"] || 10
             req.query["offset"] = req.query["offset"] || 0
             const ServiceClient = await new Admin(req.query).getAllServiceClient()
             return success(res, { ServiceClient })
        }
        catch (err) {
            logger.error("Error occurred at getAllServiceClient", err);
            return error(res, { code: err.code, message: err });
        }
    }
    exports.getRecentServiceClient = async (req,res) => {
        try {

            req.query["limit"] = req.query["limit"] || 10
            req.query["offset"] = req.query["offset"] || 0
            const recentServiceClient = await new Admin(req.query).getRecentServiceClient()
              return success(res, { recentServiceClient });
        }
        catch(err) {
            logger.error("Error occurred at getRecentServiceClient", err);
            return error(res, { code: err.code, message: err });
        }
    }

    exports.getAllServiceProvider = async (req, res) => {
      try {
        req.query["limit"] = req.query["limit"] || 10;
        req.query["offset"] = req.query["offset"] || 0;
        const ServiceClient = await new Admin(req.query).getAllServiceProvider();
        return success(res, { ServiceClient });
      } catch (err) {
        logger.error("Error occurred at getAllServiceClient", err);
        return error(res, { code: err.code, message: err });
      }
    };

    exports.getRecentServiceProvider = async (req,res) => {
        try {

            req.query["limit"] = req.query["limit"] || 10
            req.query["offset"] = req.query["offset"] || 0
            const recentServiceClient = await new Admin(req.query).getRecentServiceProvider()
              return success(res, { recentServiceClient });
        }
        catch(err) {
            logger.error("Error occurred at getRecentServiceClient", err);
            return error(res, { code: err.code, message: err });
        }
    }