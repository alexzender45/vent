const { error, success } = require("../utils/baseController");
const { generateAuthToken } = require("../core/userAuth");
const { logger } = require("../utils/logger");
const { registrationSuccessful } = require('../utils/sendgrid');
const ServiceClient = require("../service/ServiceClient");


exports.signup = async (req, res) => {
    try {
        const newServiceClient = await new ServiceClient(req.body).signup();
        const token = await generateAuthToken({ 
            userId: newServiceClient._id, 
            isActive: newServiceClient.isActive,
            userType: newServiceClient.userType,
            role: newServiceClient.role,
        })
        await registrationSuccessful(newServiceClient.email, newServiceClient.fullName);
        return success(res, { newServiceClient, token });
    }catch(err) {
        logger.error("Error occurred at signup", err);
        return error(res, { code: err.code, message: err })
    }
}

exports.login = async (req, res) => {
   try {
        const serviceClientDetails = await new ServiceClient(req.body).login();
        const token = await generateAuthToken({ 
            userId: serviceClientDetails._id, 
            isVerified: serviceClientDetails.verified, 
            isActive: serviceClientDetails.isActive, 
            userType: serviceClientDetails.userType,
         });
        return success(res, { serviceClientDetails, token });
    } catch (err) {
        logger.error("Error occurred at login", err.message);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.getAllServiceClient = async (req, res) => {
    try {
        const serviceClients = await ServiceClient.getAllServiceClient();
        return success(res, { serviceClients });
    } catch (err) {
        logger.error("Unable to complete request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.serviceClientProfile = async (req, res) => {
    try {
        const serviceClient = await new ServiceClient(req.user._id).serviceClientProfile();
        return success(res, { serviceClient });
    } catch (err) {
        logger.error("Unable to complete fetch service client profile request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.updateServiceClientDetails = async (req, res) => {
    try {
        const newDetails = req.body;
        const oldDetails = req.user;
        const serviceClient = await new ServiceClient({newDetails, oldDetails}).updateServiceClientDetails();
        return success(res, { serviceClient });
    } catch (err) {
        logger.error("Unable to complete service Client update request", err);
        return error(res, { code: err.code, message: err.message });
    }
};

exports.forgotPassword = (req, res) => {
    new ServiceClient(req.body).forgotPassword()
        .then(data => success(res, {status: "success", success: true, message: "Token Has Been Sent To Your Email"}))
        .catch(err => error(res, { code: err.code, message: err.message }))
};

exports.resetPassword = (req, res) => {
    new ServiceClient(req.body).resetPassword()
        .then(data => success(res, {status: "success", success: true,
         message: "Password Reset Successful"}))
        .catch(err => error(res, { code: err.code, message: err.message }))
}

exports.changePassword = async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;
        const userId = req.user._id;
        const serviceClient = await new ServiceClient({newPassword, oldPassword, userId}).changePassword();
        return success(res, { serviceClient });
    } catch (err) {
        logger.error("Unable to complete service client update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}
