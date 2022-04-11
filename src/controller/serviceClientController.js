const { error, success } = require("../utils/baseController");
const { generateAuthToken } = require("../core/userAuth");
const { logger } = require("../utils/logger");
const { sendSuccessfulRegistrationEmail } = require("../utils/sendgrid");
const ServiceClient = require("../service/ServiceClient");

exports.signup = async (req, res) => {
  try {
    const newServiceClient = await new ServiceClient(req.body).signup();
    const token = await generateAuthToken({
      userId: newServiceClient._id,
      isActive: newServiceClient.isActive,
      userType: newServiceClient.userType,
      role: newServiceClient.role,
    });
    await sendSuccessfulRegistrationEmail(
      newServiceClient.email,
      newServiceClient.fullName
    );
    return success(res, { newServiceClient, token });
  } catch (err) {
    logger.error("Error occurred at signup", err);
    return error(res, { code: err.code, message: err });
  }
};

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
};

exports.getAllServiceClient = async (req, res) => {
  try {
    const serviceClients = await new ServiceClient().getAllServiceClient();
    return success(res, { serviceClients });
  } catch (err) {
    logger.error("Unable to complete request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.serviceClientProfile = async (req, res) => {
  try {
    const serviceClient = await new ServiceClient(
      req.user._id
    ).serviceClientProfile();
    return success(res, { serviceClient });
  } catch (err) {
    logger.error(
      "Unable to complete fetch service client profile request",
      err
    );
    return error(res, { code: err.code, message: err.message });
  }
};

exports.updateServiceClientDetails = async (req, res) => {
  try {
    const newDetails = req.body;
    const oldDetails = req.user;
    const serviceClient = await new ServiceClient({
      newDetails,
      oldDetails,
    }).updateServiceClientDetails();
    return success(res, { serviceClient });
  } catch (err) {
    logger.error("Unable to complete service Client update request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.forgotPassword = (req, res) => {
  new ServiceClient(req.body)
    .forgotPassword()
    .then((data) =>
      success(res, {
        status: "success",
        success: true,
        message: "Token Has Been Sent To Your Email",
      })
    )
    .catch((err) => error(res, { code: err.code, message: err.message }));
};

exports.resetPassword = (req, res) => {
  new ServiceClient(req.body)
    .resetPassword()
    .then((data) =>
      success(res, {
        status: "success",
        success: true,
        message: "Password Reset Successful",
      })
    )
    .catch((err) => error(res, { code: err.code, message: err.message }));
};

exports.changePassword = async (req, res) => {
  try {
    const { newPassword, oldPassword } = req.body;
    const userId = req.user._id;
    const serviceClient = await new ServiceClient({
      newPassword,
      oldPassword,
      userId,
    }).changePassword();
    return success(res, { serviceClient });
  } catch (err) {
    logger.error("Unable to complete service client update request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// google sign in
exports.googleSignIn = async (req, res) => {
  try {
    const serviceClient = await new ServiceClient().googleUrl();
    return success(res, { serviceClient });
  } catch (err) {
    logger.error("Unable to complete service client update request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.googleAccessToken = async (req, res) => {
  try {
    const code = req.query.code;
    const newServiceClient = await new ServiceClient(code).googleAccessToken();
    const token = await generateAuthToken({
      userId: newServiceClient._id,
      userType: newServiceClient.userType,
      role: newServiceClient.role,
    });
    return success(res, { token, message: `<h1>Successfully logged in</h1>` });
  } catch (err) {
    logger.error("Unable to complete service client update request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;
    const imageUrl = req.body.imageUrl;
    await new ServiceClient({
      imageUrl,
      userId,
    }).uploadProfileImage();
    return success(res, { message: "Profile Image Uploaded Successfully" });
  } catch (err) {
    logger.error("Unable to complete host update request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// service client can delete their account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    await new ServiceClient({ userId }).deleteAccount();
    return success(res, { message: "Account Deleted Successfully" });
  } catch (err) {
    logger.error("Unable to complete service client update request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// get service client by id
exports.getServiceClientById = async (req, res) => {
  try {
    const serviceClient = await new ServiceClient(
      req.params.id
    ).getServiceClientById();
    return success(res, { serviceClient });
  } catch (err) {
    logger.error("Unable to complete request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

// delete service client by id
exports.deleteServiceClientById = async (req, res) => {
  try {
    const serviceClient = await new ServiceClient(
      req.params.id
    ).deleteServiceClientById();
    return success(res, { serviceClient });
  } catch (err) {
    logger.error("Unable to complete request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.initiateFacebookSignIn = (req, res) => {
  try {
    const serviceClient = ServiceClient.getFacebookSignInUrl();
    return success(res, { serviceClient });
  } catch (err) {
    logger.error("Unable to complete service client update request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.initiateFacebookSignIn = (req, res) => {
  try {
    const facebookSignInUrl = ServiceClient.getFacebookSignInUrl();
    return success(res, { facebookSignInUrl });
  } catch (err) {
    logger.error("Unable to get facebook sign in url", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.facebookAuthentication = async (req, res) => {
  try {
    const code = req.query.code;
    const newServiceClient = await new ServiceClient(
      code
    ).processFacebookSignIn();
    const token = await generateAuthToken({
      userId: newServiceClient._id,
      userType: newServiceClient.userType,
      role: newServiceClient.role,
    });
    await sendSuccessfulRegistrationEmail(
      newServiceClient.email,
      newServiceClient.fullName
    );
    return success(res, { token, message: newServiceClient });
  } catch (err) {
    logger.error("Unable to complete service provider update request", err);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const followDetails = {
      followedUserId: req.params.id,
      userId: req.user._id,
    };
    const userDetails = await new ServiceClient(followDetails).followUser();
    return success(res, userDetails);
  } catch (err) {
    logger.error(`Unable to follow user ${err}`);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const unfollowDetails = {
      followedUserId: req.params.id,
      userId: req.user._id,
    };
    const userDetails = await new ServiceClient(unfollowDetails).unfollowUser();
    return success(res, userDetails);
  } catch (err) {
    logger.error(`Unable to unfollow user ${err}`);
    return error(res, { code: err.code, message: err.message });
  }
};

// save service
exports.saveService = async (req, res) => {
  try {
    const serviceDetails = {
      serviceId: req.params.id,
      userId: req.user._id,
    };
    const service = await new ServiceClient(serviceDetails).saveService();
    return success(res, { service });
  } catch (err) {
    logger.error(`Unable to save service ${err}`);
    return error(res, { code: err.code, message: err.message });
  }
};

// get all saved services
exports.getSavedServices = async (req, res) => {
  try {
    const services = await new ServiceClient(req.user._id).getSavedServices();
    return success(res, { services });
  } catch (err) {
    logger.error(`Unable to get saved services ${err}`);
    return error(res, { code: err.code, message: err.message });
  }
};
// delete saved service
exports.deleteSavedService = async (req, res) => {
  try {
    const serviceDetails = {
      serviceId: req.params.id,
      userId: req.user._id,
    };
    const service = await new ServiceClient(serviceDetails).deleteSavedService();
    return success(res, { service });
  } catch (err) {
    logger.error(`Unable to delete saved service ${err}`);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getReferralStatistic = async (req, res) => {
  try {
    const statistic = await new ServiceClient(
      req.user._id
    ).getReferralStatistics();
    return success(res, { statistic });
  } catch (err) {
    logger.error(`Unable to get statistic ${err}`);
    return error(res, { code: err.code, message: err.message });
  }
};

// get client followers
exports.getClientFollowers = async (req, res) => {
  try {
    const followers = await new ServiceClient(req.user._id).getClientFollowers();
    return success(res, { followers });
  } catch (err) {
    logger.error(`Unable to get followers ${err}`);
    return error(res, { code: err.code, message: err.message });
  }
};

exports.getClientFollowing = async (req, res) => {
  try {
    const following = await new ServiceClient(
      req.user._id
    ).getClientFollowing();
    return success(res, { following });
  } catch (err) {
    logger.error(`Unable to get followers ${err}`);
    return error(res, { code: err.code, message: err.message });
  }
};
