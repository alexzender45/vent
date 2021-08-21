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

// google sign in
exports.googleSignIn = async (req, res) => {
    try {
        const serviceClient = await new ServiceClient().googleUrl();
        return success(res, { serviceClient });
    } catch (err) {
        logger.error("Unable to complete service client update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.googleAccessToken = async (req, res) => {
    try {
        const code = req.query.code;
        const newServiceClient = await new ServiceClient(code).googleAccessToken();
        const token = await generateAuthToken({ 
            userId: newServiceClient._id, 
            userType: newServiceClient.userType,
            role: newServiceClient.role,
        })
        await registrationSuccessful(newServiceClient.email, newServiceClient.fullName);
        return success(res, { token, message: `<h1>Successfully logged in</h1>` });
    } catch (err) {
        logger.error("Unable to complete service client update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.uploadProfileImage = async (req, res) => {
    try {
      const originalname = req.files[0].originalname;
      const path = req.files[0].path;
      const userId = req.user._id;
      await new ServiceClient({
        originalname,
        path,
        userId,
      }).uploadProfileImage();
      return success(res, {message: "Profile Image Uploaded Successfully" });
    } catch (err) {
      logger.error("Unable to complete host update request", err);
      return error(res, { code: err.code, message: err.message });
    }
  };

exports.initiateFacebookSignIn = (req, res) => {
    try {
        const serviceProvider = ServiceClient.getFacebookSignInUrl();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Unable to complete service provider update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.facebookAuthenticate = async (req, res) => {
    try {
        const code = req.query.code;
        const newServiceProvider = await new ServiceClient(code).getFacebookAccessToken();
        const token = await generateAuthToken({
            userId: newServiceProvider._id,
            userType: newServiceProvider.userType,
            role: newServiceProvider.role,
        })
        await registrationSuccessful(newServiceProvider.email, newServiceProvider.fullName);
        return success(res, { token, message: newServiceProvider });
    } catch (err) {
        logger.error("Unable to complete service provider update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}