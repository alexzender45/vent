const serviceProviderRoute = require("../core/routerConfig");
const serviceProviderController = require("../controller/serviceProviderController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");
const upload = require("../core/multer");

serviceProviderRoute
  .route("/service/providers")
  .post(serviceProviderController.signup)
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.getServiceProviderProfile
  )
  .put(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.updateServiceProviderDetails
  );
//TODO Should this be exposed to SERVICE_PROVIDER??
serviceProviderRoute
  .route("/service/providers/all")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.getAllServiceProvider
  );

serviceProviderRoute
  .route("/service/providers/login")
  .post(serviceProviderController.login);

serviceProviderRoute
  .route("/service/providers/forgot-password")
  .post(serviceProviderController.forgotPassword);

serviceProviderRoute
  .route("/service/providers/reset-password")
  .post(serviceProviderController.resetPassword);

serviceProviderRoute
  .route("/service/providers/change-password")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.changePassword
  );

// google sign in
serviceProviderRoute
  .route("/service/providers/google-sign-in")
  .get(serviceProviderController.googleSignIn);

serviceProviderRoute
  .route("/service/providers/access")
  .get(serviceProviderController.googleAccessToken);

serviceProviderRoute
  .route("/service/providers/facebook-sign-in")
  .get(serviceProviderController.initiateFacebookSignIn);

serviceProviderRoute
  .route("/service/providers/facebook-authenticate")
  .get(serviceProviderController.facebookAuthentication);

// upload profile picture
serviceProviderRoute
  .route("/service/providers/upload-profile-picture")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.uploadProfileImage
  );

// service client can delete their account
serviceProviderRoute
  .route("/service/providers/delete")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.deleteAccount
  );

// get service provider by id
serviceProviderRoute
  .route("/service/providers/:id")
  .get(authenticate, serviceProviderController.getServiceProviderById);

// delete service provider by id
serviceProviderRoute
  .route("/service/providers/:id/delete")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.deleteServiceProviderById
  );

// follow service provider
serviceProviderRoute
  .route("/service/clients/:id/follow")
  .get(authenticate, serviceProviderController.followUser);

// unfollow service provider
serviceProviderRoute
  .route("/service/clients/:id/unfollow")
  .get(authenticate, serviceProviderController.unfollowUser);

module.exports = serviceProviderRoute;
