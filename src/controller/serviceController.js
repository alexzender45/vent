const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Service = require("../service/Service");

exports.create = async (req, res) => {
    try {
        const service = await new Service(req.body).create();
        return success(res, { service });
    }catch(err) {
        logger.error("Error creating service", err);
        return error(res, { code: err.code, message: err })
    }
}

exports.getAllUserService = async (req, res) => {
    try {
        const categories = await new Service(req.params.userId).getAllUserServices();
        return success(res, { categories });
    } catch (err) {
        logger.error("Error getting all categories", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.updateService = async (req, res) => {
    try {
        const service = await new Service({newDetails: req.body}).updateService();
        return success(res, { service });
    } catch (err) {
        logger.error("Error updating service", err);
        return error(res, { code: err.code, message: err.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        await new Service(req.params.id).deleteService();
        return success(res, { message: "Service Deleted Successfully" });
    } catch (err) {
        logger.error("Error deleting service", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.getServiceById = async (req, res) => {
    try {
        const serviceProvider = await new Service(req.params.id).getService();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Error getting service", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.getServiceByType = async (req, res) => {
    try {
        const serviceProvider = await new Service(req.params.type).getServiceByType();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Error getting service by type", err);
        return error(res, { code: err.code, message: err.message });
    }
}