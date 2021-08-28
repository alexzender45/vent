const { error, success } = require("../utils/baseController");
const { generateAuthToken } = require("../core/userAuth");
const { logger } = require("../utils/logger");
const { sendSuccessfulRegistrationEmail } = require('../utils/sendgrid');
const ServiceProvider = require("../service/ServiceProvider");


exports.signup = async (req, res) => {
    try {
        const newServiceProvider = await new ServiceProvider(req.body).signup();
        const token = await generateAuthToken({ 
            userId: newServiceProvider._id, 
            isActive: newServiceProvider.isActive,
            userType: newServiceProvider.userType,
            role: newServiceProvider.role,
        })
        await sendSuccessfulRegistrationEmail(newServiceProvider.email, newServiceProvider.fullName);
        return success(res, { newServiceProvider, token });
    }catch(err) {
        logger.error("Error occurred at signup", err);
        return error(res, { code: err.code, message: err })
    }
}

exports.login = async (req, res) => {
   try {
        const serviceProviderDetails = await new ServiceProvider(req.body).login();
        const token = await generateAuthToken({ 
            userId: serviceProviderDetails._id, 
            isVerified: serviceProviderDetails.verified, 
            isActive: serviceProviderDetails.isActive, 
            userType: serviceProviderDetails.userType,
         });
        return success(res, { serviceProviderDetails, token });
    } catch (err) {
        logger.error("Error occurred at login", err.message);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.getAllServiceProvider = async (req, res) => {
    try {
        const serviceProvider = await ServiceProvider.getAllServiceProvider();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Unable to complete request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.getServiceProviderProfile = async (req, res) => {
    try {
        const serviceProvider = await new ServiceProvider(req.user._id).serviceProviderProfile();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Unable to complete fetch service provider profile request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.updateServiceProviderDetails = async (req, res) => {
    try {
        const newDetails = req.body;
        const oldDetails = req.user;
        const serviceProvider = await new ServiceProvider({newDetails, oldDetails}).updateServiceProviderDetails();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Unable to complete service provider update request", err);
        return error(res, { code: err.code, message: err.message });
    }
};

exports.forgotPassword = (req, res) => {
    new ServiceProvider(req.body).forgotPassword()
        .then(data => success(res, {status: "success", success: true, message: "Token Has Been Sent To Your Email"}))
        .catch(err => error(res, { code: err.code, message: err.message }))
};

exports.resetPassword = (req, res) => {
    new ServiceProvider(req.body).resetPassword()
        .then(data => success(res, {status: "success", success: true,
         message: "Password Reset Successful"}))
        .catch(err => error(res, { code: err.code, message: err.message }))
}

exports.changePassword = async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;
        const userId = req.user._id;
        const serviceProvider = await new ServiceProvider({newPassword, oldPassword, userId}).changePassword();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Unable to complete service provider update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

// google sign in
exports.googleSignIn = async (req, res) => {
    try {
        const serviceProvider = await new ServiceProvider().googleUrl();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Unable to complete service provider update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.googleAccessToken = async (req, res) => {
    try {
        const code = req.query.code;
        const newServiceProvider = await new ServiceProvider(code).googleAccessToken();
        const token = await generateAuthToken({ 
            userId: newServiceProvider._id, 
            userType: newServiceProvider.userType,
            role: newServiceProvider.role,
        })
        await sendSuccessfulRegistrationEmail(newServiceProvider.email, newServiceProvider.fullName);
        return success(res, { token, message: `<h1>Successfully logged in</h1>` });
    } catch (err) {
        logger.error("Unable to complete service provider update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.uploadProfileImage = async (req, res) => {
    try {
      const originalname = req.files[0].originalname;
      const path = req.files[0].path;
      const userId = req.user._id;
      await new ServiceProvider({
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

// service provider can delete their account
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        await new ServiceProvider({ userId }).deleteAccount();
        return success(res, { message: "Account Deleted Successfully" });
    } catch (err) {
        logger.error("Unable to complete delete account request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

// get service provider by id
exports.getServiceProviderById = async (req, res) => {
    try {
        const serviceProvider = await new ServiceProvider(req.params.id).getServiceProviderById();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Unable to complete request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

// delete service provider by id
exports.deleteServiceProviderById = async (req, res) => {
    try {
        const serviceProvider = await new ServiceProvider(req.params.id).deleteServiceProviderById();
        return success(res, { serviceProvider });
    } catch (err) {
        logger.error("Unable to complete request", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.initiateFacebookSignIn = (req, res) => {
    try {
        const facebookSignInUrl = ServiceProvider.getFacebookSignInUrl();
        return success(res, { facebookSignInUrl });
    } catch (err) {
        logger.error("Unable to get facebook sign in url", err);
        return error(res, { code: err.code, message: err.message });
    }
}

exports.facebookAuthentication = async (req, res) => {
    try {
        const code = req.query.code;
        const newServiceProvider = await new ServiceProvider(code).processFacebookSignIn();
        const token = await generateAuthToken({
            userId: newServiceProvider._id,
            userType: newServiceProvider.userType,
            role: newServiceProvider.role,
        })
        await sendSuccessfulRegistrationEmail(newServiceProvider.email, newServiceProvider.fullName);
        return success(res, { token, message: newServiceProvider });
    } catch (err) {
        logger.error("Unable to complete service provider update request", err);
        return error(res, { code: err.code, message: err.message });
    }
}